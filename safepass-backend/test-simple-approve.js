const { createClient } = require('@supabase/supabase-js');
const axios = require('axios');
require('dotenv').config();

const BASE_URL = 'http://localhost:3001';

async function testSimpleApprove() {
    console.log('🧪 Testing Simple Document Approval (bypassing credential creation)...\n');

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

        // 3. Test direct database update (simulating what the API should do)
        console.log('\n🔧 Testing direct database update...');
        const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

        const { data: updateResult, error: updateError } = await supabase
            .from('document_uploads')
            .update({
                status: 'Verified',
                reviewed_at: new Date().toISOString(),
                reviewer_id: loginResponse.data.user.id,
                reviewer_notes: 'Test approval - bypassing credential creation'
            })
            .eq('id', testDoc.id)
            .select();

        if (updateError) {
            console.error('❌ Direct database update failed:', updateError);
        } else {
            console.log('✅ Direct database update successful!');
            console.log('Updated document:', updateResult[0]);

            // 4. Verify the document appears in verified documents
            console.log('\n📋 Checking verified documents...');
            const verifiedResponse = await axios.get(`${BASE_URL}/api/regulator/documents/verified`, { headers });
            
            const verifiedDoc = verifiedResponse.data.data.find(doc => doc.id === testDoc.id);
            if (verifiedDoc) {
                console.log('✅ Document successfully appears in verified documents!');
                console.log(`Status: ${verifiedDoc.status}, Reviewed: ${verifiedDoc.reviewedAt}`);
            } else {
                console.log('❌ Document not found in verified documents');
            }

            // 5. Revert the change for future tests
            console.log('\n🔄 Reverting test change...');
            await supabase
                .from('document_uploads')
                .update({
                    status: 'PendingVerification',
                    reviewed_at: null,
                    reviewer_id: null,
                    reviewer_notes: null
                })
                .eq('id', testDoc.id);
            console.log('✅ Test change reverted');
        }

        // 6. Now let's check what's wrong with the credential creation
        console.log('\n🔍 Investigating credential creation issue...');
        console.log('The database update works fine, so the issue is in the API endpoint.');
        console.log('Let me check if the Veramo agent is the problem...');

        // Test if we can create a simple credential without the full API
        try {
            console.log('\n🧪 Testing Veramo agent directly...');
            const { getAgent } = require('./src/services/identityService');
            const agent = await getAgent();
            console.log('✅ Veramo agent loaded successfully');
            
            // Try to create a simple credential
            const testCredential = await agent.createVerifiableCredential({
                credential: {
                    issuer: { id: loginResponse.data.user.did },
                    credentialSubject: {
                        id: testDoc.worker?.did || 'test-did',
                        test: 'This is a test credential'
                    },
                    '@context': ['https://www.w3.org/2018/credentials/v1'],
                    type: ['VerifiableCredential', 'TestCredential'],
                    issuanceDate: new Date().toISOString(),
                },
                proofFormat: 'jwt',
            });
            
            console.log('✅ Test credential created successfully!');
            console.log('Credential type:', testCredential.type);
            
        } catch (veramoError) {
            console.error('❌ Veramo agent error:', veramoError.message);
            console.log('🔍 The issue is with the Veramo agent or identity service');
        }

    } catch (error) {
        console.error('❌ Test failed:', error.message);
        if (error.response) {
            console.error('Response data:', error.response.data);
        }
    }
}

testSimpleApprove();
