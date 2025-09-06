const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

async function applyConstraintFix() {
    console.log('🔧 Applying database constraint fix...\n');

    try {
        // Use service role key for admin operations
        const supabase = createClient(
            process.env.SUPABASE_URL, 
            process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY
        );

        console.log('1. Testing current constraint by trying to insert invalid status...');
        
        // Try to insert a document with 'Approved' status to see if constraint exists
        const testInsert = await supabase
            .from('document_uploads')
            .insert({
                user_id: '034a6ab5-93a6-4e33-bebc-86ab7115ea3f', // Use existing user ID
                document_type: 'Passport',
                ipfs_cid: 'QmTestCid',
                status: 'Approved' // This should fail if constraint is correct
            })
            .select();

        if (testInsert.error) {
            if (testInsert.error.message.includes('violates check constraint')) {
                console.log('❌ Current constraint still allows only old values');
                console.log('Error:', testInsert.error.message);
            } else {
                console.log('✅ Constraint appears to be working correctly');
                console.log('Error (expected):', testInsert.error.message);
            }
        } else {
            console.log('⚠️  Test insert succeeded - constraint may need updating');
            // Clean up test record
            await supabase
                .from('document_uploads')
                .delete()
                .eq('ipfs_cid', 'QmTestCid');
        }

        console.log('\n2. Attempting to update constraint using SQL...');
        
        // Try using the SQL editor approach
        const constraintSQL = `
            -- Drop existing constraint
            ALTER TABLE document_uploads DROP CONSTRAINT IF EXISTS document_uploads_status_check;
            
            -- Add new constraint
            ALTER TABLE document_uploads ADD CONSTRAINT document_uploads_status_check 
            CHECK (status IN ('PendingVerification', 'Verified', 'Rejected'));
        `;

        console.log('SQL to execute:');
        console.log(constraintSQL);

        // Since we can't execute DDL through the client, let's try a different approach
        console.log('\n3. Alternative: Testing if we can update a document to Verified status...');
        
        // Find a pending document to test with
        const { data: pendingDocs, error: pendingError } = await supabase
            .from('document_uploads')
            .select('id, status')
            .eq('status', 'PendingVerification')
            .limit(1);

        if (pendingError) {
            console.error('❌ Error fetching pending documents:', pendingError);
            return;
        }

        if (pendingDocs && pendingDocs.length > 0) {
            const testDoc = pendingDocs[0];
            console.log(`Testing with document: ${testDoc.id}`);

            // Try to update to Verified
            const { data: updateResult, error: updateError } = await supabase
                .from('document_uploads')
                .update({ 
                    status: 'Verified',
                    reviewed_at: new Date().toISOString(),
                    reviewer_notes: 'Test update to verify constraint'
                })
                .eq('id', testDoc.id)
                .select();

            if (updateError) {
                console.error('❌ Error updating document to Verified:', updateError);
                if (updateError.message.includes('violates check constraint')) {
                    console.log('🔍 Constraint issue confirmed - needs manual SQL execution');
                }
            } else {
                console.log('✅ Successfully updated document to Verified status!');
                console.log('Updated document:', updateResult[0]);
                
                // Revert the test change
                await supabase
                    .from('document_uploads')
                    .update({ 
                        status: 'PendingVerification',
                        reviewed_at: null,
                        reviewer_notes: null
                    })
                    .eq('id', testDoc.id);
                console.log('✅ Reverted test change');
            }
        } else {
            console.log('No pending documents found to test with');
        }

        console.log('\n📋 Summary:');
        console.log('The database constraint needs to be updated manually in Supabase.');
        console.log('Please execute the following SQL in the Supabase SQL Editor:');
        console.log('\n' + constraintSQL);

    } catch (error) {
        console.error('❌ Unexpected error:', error);
    }
}

applyConstraintFix();
