const { createClient } = require('@supabase/supabase-js');
const axios = require('axios');
require('dotenv').config();

const BASE_URL = 'http://localhost:3001';

async function testCredentialSave() {
    console.log('🧪 Testing Credential Save Process...\n');

    try {
        // 1. Login as regulator
        console.log('🔐 Logging in as regulator...');
        const loginResponse = await axios.post(`${BASE_URL}/api/auth/login`, {
            email: 'regulator@example.com',
            password: 'password123'
        });

        const token = loginResponse.data.token;
        const headers = { Authorization: `Bearer ${token}` };
        console.log('✅ Successfully logged in');

        // 2. Get a pending document
        console.log('\n📋 Getting pending documents...');
        const pendingResponse = await axios.get(`${BASE_URL}/api/regulator/documents/pending`, { headers });
        
        if (pendingResponse.data.data.length === 0) {
            console.log('❌ No pending documents found');
            return;
        }

        const testDoc = pendingResponse.data.data[0];
        console.log(`Found document: ${testDoc.id} (${testDoc.documentType})`);

        // 3. Test the full credential creation and save process
        console.log('\n🧪 Testing full credential creation process...');
        
        try {
            const { getAgent } = require('./src/services/identityService');
            const agent = await getAgent();
            
            // Create the verifiable credential (same as API does)
            const verifiableCredential = await agent.createVerifiableCredential({
                credential: {
                    issuer: { id: loginResponse.data.user.did },
                    credentialSubject: {
                        id: testDoc.worker?.did,
                        documentType: testDoc.documentType,
                        ipfsCid: testDoc.ipfsCid,
                        verificationDate: new Date().toISOString(),
                        verifiedBy: 'Test Regulator',
                    },
                    '@context': [
                        'https://www.w3.org/2018/credentials/v1',
                        'https://safepass.example.com/contexts/v1'
                    ],
                    type: ['VerifiableCredential', 'VerifiedPassportCredential'],
                    issuanceDate: new Date().toISOString(),
                },
                proofFormat: 'jwt',
            });

            console.log('✅ Verifiable credential created successfully');
            console.log('Credential JWT length:', verifiableCredential.proof.jwt.length);

            // 4. Test saving to database
            console.log('\n💾 Testing credential save to database...');
            const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

            const { data: savedCredential, error: credError } = await supabase
                .from('verifiable_credentials')
                .insert({
                    holder_did: testDoc.worker?.did,
                    issuer_did: loginResponse.data.user.did,
                    type: 'VerifiedPassportCredential',
                    raw_vc_jwt: verifiableCredential.proof.jwt,
                    source_document_id: testDoc.id
                })
                .select()
                .single();

            if (credError) {
                console.error('❌ Error saving credential:', credError);
                console.log('🔍 This might be the issue in the API!');
            } else {
                console.log('✅ Credential saved successfully!');
                console.log('Saved credential ID:', savedCredential.id);

                // 5. Now test the document update
                console.log('\n📝 Testing document status update...');
                const { error: updateError } = await supabase
                    .from('document_uploads')
                    .update({
                        status: 'Verified',
                        reviewed_at: new Date().toISOString(),
                        reviewer_id: loginResponse.data.user.id,
                        reviewer_notes: `Document verified and credential issued by ${loginResponse.data.user.email}`
                    })
                    .eq('id', testDoc.id);

                if (updateError) {
                    console.error('❌ Error updating document status:', updateError);
                } else {
                    console.log('✅ Document status updated successfully!');
                    console.log('🎉 The entire process works when done step by step!');
                }

                // Clean up
                console.log('\n🧹 Cleaning up test data...');
                await supabase.from('verifiable_credentials').delete().eq('id', savedCredential.id);
                await supabase
                    .from('document_uploads')
                    .update({
                        status: 'PendingVerification',
                        reviewed_at: null,
                        reviewer_id: null,
                        reviewer_notes: null
                    })
                    .eq('id', testDoc.id);
                console.log('✅ Test data cleaned up');
            }

        } catch (processError) {
            console.error('❌ Error in credential process:', processError.message);
            console.log('Stack trace:', processError.stack);
        }

        // 6. Let's also check if there are any issues with the API endpoint structure
        console.log('\n🔍 The issue might be in the API endpoint error handling or transaction logic');
        console.log('Since individual steps work, the problem is likely in the API flow or error handling');

    } catch (error) {
        console.error('❌ Test failed:', error.message);
    }
}

testCredentialSave();
