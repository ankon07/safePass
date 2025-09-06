const axios = require('axios');
require('dotenv').config();

const BASE_URL = 'http://localhost:3001';

async function testDetailedAPI() {
    console.log('🔍 Starting Detailed API Test...\n');

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

        // 2. Get pending documents with full details
        console.log('\n📋 Fetching pending documents with full details...');
        const pendingResponse = await axios.get(`${BASE_URL}/api/regulator/documents/pending`, { headers });
        
        console.log(`Found ${pendingResponse.data.data.length} pending documents:`);
        pendingResponse.data.data.forEach((doc, index) => {
            console.log(`\n  Document ${index + 1}:`);
            console.log(`    ID: ${doc.id}`);
            console.log(`    Type: ${doc.documentType}`);
            console.log(`    Status: ${doc.status}`);
            console.log(`    Worker Info:`);
            console.log(`      ID: ${doc.worker?.id || 'MISSING'}`);
            console.log(`      Name: ${doc.worker?.name || 'MISSING'}`);
            console.log(`      Email: ${doc.worker?.email || 'MISSING'}`);
            console.log(`      DID: ${doc.worker?.did || 'MISSING'}`);
        });

        if (pendingResponse.data.data.length === 0) {
            console.log('❌ No pending documents found to test with');
            return;
        }

        // 3. Test approve with the first document
        const testDoc = pendingResponse.data.data[0];
        console.log(`\n🎯 Testing APPROVE with document: ${testDoc.id}`);
        
        const approveRequest = {
            documentUploadId: testDoc.id,
            holderDid: testDoc.worker?.did || '',
            claims: {
                documentType: testDoc.documentType,
                verifiedBy: 'Test Regulator',
                verificationDate: new Date().toISOString(),
            }
        };

        console.log('\n📤 Approve request payload:');
        console.log(JSON.stringify(approveRequest, null, 2));

        try {
            const approveResponse = await axios.post(`${BASE_URL}/api/regulator/issue-credential`, approveRequest, { headers });
            console.log('\n✅ Approve request successful!');
            console.log('Response:', JSON.stringify(approveResponse.data, null, 2));
        } catch (approveError) {
            console.log('\n❌ Approve request failed!');
            console.log('Status:', approveError.response?.status);
            console.log('Error:', JSON.stringify(approveError.response?.data, null, 2));
            
            // Let's check if the issue is with missing holderDid
            if (!testDoc.worker?.did || testDoc.worker.did === 'unknown') {
                console.log('\n🔍 Issue identified: holderDid is missing or invalid');
                console.log('Worker DID value:', testDoc.worker?.did);
                
                // Let's check the database directly for this user
                console.log('\n🔍 Checking user data in database...');
                const { createClient } = require('@supabase/supabase-js');
                const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);
                
                const { data: userData, error: userError } = await supabase
                    .from('users')
                    .select('id, name, email, did')
                    .eq('id', testDoc.worker?.id);
                
                if (userError) {
                    console.log('❌ Database query error:', userError);
                } else {
                    console.log('📊 User data from database:');
                    console.log(JSON.stringify(userData, null, 2));
                }
            }
        }

    } catch (error) {
        console.error('❌ Test failed:', error.message);
        if (error.response) {
            console.error('Response status:', error.response.status);
            console.error('Response data:', error.response.data);
        }
    }
}

testDetailedAPI();
