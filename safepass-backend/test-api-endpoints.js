const fetch = require('node-fetch');

const BASE_URL = 'http://localhost:3001';

// Test data - using one of the pending documents from our database
const TEST_DOCUMENT_ID = '99551f8a-3706-4b44-8be5-7fc0191dfb1b';
const TEST_HOLDER_DID = 'did:ethr:0x123456789abcdef'; // Mock DID for testing

// Mock JWT token for regulator (you'll need to get a real one)
let REGULATOR_TOKEN = null;

async function loginAsRegulator() {
    console.log('🔐 Logging in as regulator...');
    
    try {
        const response = await fetch(`${BASE_URL}/api/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                email: 'regulator@example.com', // Adjust based on your test data
                password: 'password123' // Adjust based on your test data
            })
        });

        const data = await response.json();
        
        if (response.ok && data.token) {
            REGULATOR_TOKEN = data.token;
            console.log('✅ Successfully logged in as regulator');
            return true;
        } else {
            console.log('❌ Failed to login as regulator:', data);
            return false;
        }
    } catch (error) {
        console.error('❌ Login error:', error.message);
        return false;
    }
}

async function testGetPendingDocuments() {
    console.log('\n📋 Testing GET /api/regulator/documents/pending...');
    
    try {
        const response = await fetch(`${BASE_URL}/api/regulator/documents/pending`, {
            headers: {
                'Authorization': `Bearer ${REGULATOR_TOKEN}`,
                'Content-Type': 'application/json',
            }
        });

        const data = await response.json();
        
        if (response.ok) {
            console.log(`✅ Successfully fetched ${data.data.length} pending documents`);
            data.data.forEach(doc => {
                console.log(`  - ${doc.id}: ${doc.documentType} (${doc.status})`);
            });
            return data.data;
        } else {
            console.log('❌ Failed to fetch pending documents:', data);
            return [];
        }
    } catch (error) {
        console.error('❌ Error fetching pending documents:', error.message);
        return [];
    }
}

async function testApproveDocument(documentId, holderDid) {
    console.log(`\n✅ Testing APPROVE document ${documentId}...`);
    
    try {
        const response = await fetch(`${BASE_URL}/api/regulator/issue-credential`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${REGULATOR_TOKEN}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                documentUploadId: documentId,
                holderDid: holderDid,
                claims: {
                    documentType: 'Passport',
                    verifiedBy: 'Test Regulator',
                    verificationDate: new Date().toISOString(),
                }
            })
        });

        const data = await response.json();
        
        if (response.ok) {
            console.log('✅ Document approved successfully!');
            console.log('📄 Credential issued:', data.data);
            return true;
        } else {
            console.log('❌ Failed to approve document:', data);
            return false;
        }
    } catch (error) {
        console.error('❌ Error approving document:', error.message);
        return false;
    }
}

async function testRejectDocument(documentId) {
    console.log(`\n❌ Testing REJECT document ${documentId}...`);
    
    try {
        const response = await fetch(`${BASE_URL}/api/regulator/reject-document`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${REGULATOR_TOKEN}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                documentUploadId: documentId,
                reviewerNotes: 'Test rejection - document quality insufficient'
            })
        });

        const data = await response.json();
        
        if (response.ok) {
            console.log('✅ Document rejected successfully!');
            console.log('📄 Rejection details:', data.data);
            return true;
        } else {
            console.log('❌ Failed to reject document:', data);
            return false;
        }
    } catch (error) {
        console.error('❌ Error rejecting document:', error.message);
        return false;
    }
}

async function testGetVerifiedDocuments() {
    console.log('\n📋 Testing GET /api/regulator/documents/verified...');
    
    try {
        const response = await fetch(`${BASE_URL}/api/regulator/documents/verified`, {
            headers: {
                'Authorization': `Bearer ${REGULATOR_TOKEN}`,
                'Content-Type': 'application/json',
            }
        });

        const data = await response.json();
        
        if (response.ok) {
            console.log(`✅ Successfully fetched ${data.data.length} verified documents`);
            data.data.slice(0, 3).forEach(doc => {
                console.log(`  - ${doc.id}: ${doc.documentType} (${doc.status}) - Verified by: ${doc.verifiedBy}`);
            });
            return data.data;
        } else {
            console.log('❌ Failed to fetch verified documents:', data);
            return [];
        }
    } catch (error) {
        console.error('❌ Error fetching verified documents:', error.message);
        return [];
    }
}

async function runAPITests() {
    console.log('🧪 Starting API Endpoint Tests...\n');

    // Step 1: Login as regulator
    const loginSuccess = await loginAsRegulator();
    if (!loginSuccess) {
        console.log('❌ Cannot proceed without regulator authentication');
        return;
    }

    // Step 2: Get pending documents
    const pendingDocs = await testGetPendingDocuments();
    if (pendingDocs.length === 0) {
        console.log('❌ No pending documents to test with');
        return;
    }

    // Step 3: Test approve functionality (use first pending document)
    const firstDoc = pendingDocs[0];
    console.log(`\n🎯 Using document ${firstDoc.id} for approval test`);
    
    const approveSuccess = await testApproveDocument(
        firstDoc.id, 
        firstDoc.worker?.did || TEST_HOLDER_DID
    );

    // Step 4: Test reject functionality (use second pending document if available)
    if (pendingDocs.length > 1) {
        const secondDoc = pendingDocs[1];
        console.log(`\n🎯 Using document ${secondDoc.id} for rejection test`);
        
        const rejectSuccess = await testRejectDocument(secondDoc.id);
    }

    // Step 5: Get verified documents to see the changes
    await testGetVerifiedDocuments();

    // Step 6: Check database state after operations
    console.log('\n🔍 Checking database state after operations...');
    const { exec } = require('child_process');
    exec('node test-document-workflow.js', { cwd: __dirname }, (error, stdout, stderr) => {
        if (error) {
            console.error('Error running database check:', error);
        } else {
            console.log(stdout);
        }
    });

    console.log('\n✅ API endpoint tests completed!');
}

// Run the tests
runAPITests().catch(console.error);
