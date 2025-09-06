const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

async function applyDatabaseFix() {
    console.log('🔧 Applying database constraint fix...\n');

    try {
        // Initialize Supabase client
        const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

        console.log('1. Checking current document status distribution...');
        const { data: currentStatus, error: statusError } = await supabase
            .from('document_uploads')
            .select('status')
            .then(result => {
                if (result.error) return result;
                
                const statusCounts = {};
                result.data.forEach(doc => {
                    statusCounts[doc.status] = (statusCounts[doc.status] || 0) + 1;
                });
                
                return { data: statusCounts, error: null };
            });

        if (statusError) {
            console.error('❌ Error checking current status:', statusError);
            return;
        }

        console.log('Current status distribution:', currentStatus);

        console.log('\n2. Dropping existing constraint...');
        const { error: dropError } = await supabase.rpc('exec_sql', {
            sql: 'ALTER TABLE document_uploads DROP CONSTRAINT IF EXISTS document_uploads_status_check;'
        });

        if (dropError) {
            console.error('❌ Error dropping constraint:', dropError);
            // Continue anyway, constraint might not exist
        } else {
            console.log('✅ Existing constraint dropped');
        }

        console.log('\n3. Adding new constraint with Verified status...');
        const { error: addError } = await supabase.rpc('exec_sql', {
            sql: `ALTER TABLE document_uploads ADD CONSTRAINT document_uploads_status_check 
                  CHECK (status IN ('PendingVerification', 'Verified', 'Rejected'));`
        });

        if (addError) {
            console.error('❌ Error adding new constraint:', addError);
            return;
        }
        console.log('✅ New constraint added');

        console.log('\n4. Updating existing Approved documents to Verified...');
        const { data: updateResult, error: updateError } = await supabase
            .from('document_uploads')
            .update({ status: 'Verified' })
            .eq('status', 'Approved')
            .select();

        if (updateError) {
            console.error('❌ Error updating documents:', updateError);
            return;
        }
        console.log(`✅ Updated ${updateResult?.length || 0} documents from Approved to Verified`);

        console.log('\n5. Verifying final status distribution...');
        const { data: finalStatus, error: finalError } = await supabase
            .from('document_uploads')
            .select('status')
            .then(result => {
                if (result.error) return result;
                
                const statusCounts = {};
                result.data.forEach(doc => {
                    statusCounts[doc.status] = (statusCounts[doc.status] || 0) + 1;
                });
                
                return { data: statusCounts, error: null };
            });

        if (finalError) {
            console.error('❌ Error checking final status:', finalError);
            return;
        }

        console.log('Final status distribution:', finalStatus);
        console.log('\n✅ Database constraint fix applied successfully!');

    } catch (error) {
        console.error('❌ Unexpected error:', error);
    }
}

// Alternative approach using direct SQL execution
async function applyDatabaseFixDirectSQL() {
    console.log('🔧 Applying database constraint fix using direct SQL...\n');

    try {
        const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

        // Step 1: Check current status
        console.log('1. Checking current document status...');
        const { data: docs, error: docsError } = await supabase
            .from('document_uploads')
            .select('status');

        if (docsError) {
            console.error('❌ Error fetching documents:', docsError);
            return;
        }

        const statusCounts = {};
        docs.forEach(doc => {
            statusCounts[doc.status] = (statusCounts[doc.status] || 0) + 1;
        });
        console.log('Current status distribution:', statusCounts);

        // Step 2: Update Approved to Verified first
        console.log('\n2. Updating Approved documents to Verified...');
        const { data: updateResult, error: updateError } = await supabase
            .from('document_uploads')
            .update({ status: 'Verified' })
            .eq('status', 'Approved')
            .select();

        if (updateError) {
            console.error('❌ Error updating documents:', updateError);
        } else {
            console.log(`✅ Updated ${updateResult?.length || 0} documents from Approved to Verified`);
        }

        // Step 3: Verify the update worked
        console.log('\n3. Verifying update...');
        const { data: verifyDocs, error: verifyError } = await supabase
            .from('document_uploads')
            .select('status');

        if (verifyError) {
            console.error('❌ Error verifying update:', verifyError);
            return;
        }

        const newStatusCounts = {};
        verifyDocs.forEach(doc => {
            newStatusCounts[doc.status] = (newStatusCounts[doc.status] || 0) + 1;
        });
        console.log('Updated status distribution:', newStatusCounts);

        console.log('\n✅ Database update completed successfully!');
        console.log('Note: The constraint update requires direct database access.');
        console.log('Please run the following SQL in Supabase SQL Editor:');
        console.log(`
-- Drop existing constraint
ALTER TABLE document_uploads DROP CONSTRAINT IF EXISTS document_uploads_status_check;

-- Add new constraint
ALTER TABLE document_uploads ADD CONSTRAINT document_uploads_status_check 
CHECK (status IN ('PendingVerification', 'Verified', 'Rejected'));
        `);

    } catch (error) {
        console.error('❌ Unexpected error:', error);
    }
}

// Run the fix
applyDatabaseFixDirectSQL();
