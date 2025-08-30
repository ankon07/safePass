/**
 * Phase 4 Verifiable Credential Ecosystem Test
 * 
 * This script demonstrates the complete workflow:
 * 1. Worker uploads a document
 * 2. Regulator reviews and issues a verifiable credential
 * 3. Worker retrieves their credentials
 * 4. Public verification of credentials
 */

const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

const API_BASE = 'http://localhost:3001/api';

// Test users (you'll need to register these first)
const WORKER_CREDENTIALS = {
    email: 'worker@example.com',
    password: 'password123'
};

const REGULATOR_CREDENTIALS = {
    email: 'regulator@example.com', 
    password: 'password123'
};

let workerToken = '';
let regulatorToken = '';
let workerDid = '';
let regulatorDid = '';
let documentUploadId = '';
let credentialJwt = '';

// Helper function to create a test file (simple PNG format)
function createTestFile() {
    // Create a minimal valid PNG file (1x1 pixel transparent PNG)
    const pngData = Buffer.from([
        0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, // PNG signature
        0x00, 0x00, 0x00, 0x0D, // IHDR chunk length
        0x49, 0x48, 0x44, 0x52, // IHDR
        0x00, 0x00, 0x00, 0x01, // Width: 1
        0x00, 0x00, 0x00, 0x01, // Height: 1
        0x08, 0x06, 0x00, 0x00, 0x00, // Bit depth: 8, Color type: 6 (RGBA), Compression: 0, Filter: 0, Interlace: 0
        0x1F, 0x15, 0xC4, 0x89, // CRC
        0x00, 0x00, 0x00, 0x0A, // IDAT chunk length
        0x49, 0x44, 0x41, 0x54, // IDAT
        0x78, 0x9C, 0x63, 0x00, 0x01, 0x00, 0x00, 0x05, 0x00, 0x01, // Compressed data
        0x0D, 0x0A, 0x2D, 0xB4, // CRC
        0x00, 0x00, 0x00, 0x00, // IEND chunk length
        0x49, 0x45, 0x4E, 0x44, // IEND
        0xAE, 0x42, 0x60, 0x82  // CRC
    ]);
    
    const testFilePath = path.join(__dirname, 'test-document.png');
    fs.writeFileSync(testFilePath, pngData);
    return testFilePath;
}

// Helper function to make authenticated requests
async function makeRequest(method, url, data = null, token = null, isFormData = false) {
    try {
        const config = {
            method,
            url: `${API_BASE}${url}`,
            headers: {}
        };

        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }

        if (data) {
            if (isFormData) {
                config.data = data;
                config.headers = { ...config.headers, ...data.getHeaders() };
            } else {
                config.data = data;
                config.headers['Content-Type'] = 'application/json';
            }
        }

        const response = await axios(config);
        return response.data;
    } catch (error) {
        console.error(`Error in ${method} ${url}:`, error.response?.data || error.message);
        throw error;
    }
}

async function runPhase4Test() {
    console.log('🚀 Starting Phase 4 Verifiable Credential Ecosystem Test\n');

    try {
        // Step 1: Login as Worker
        console.log('1️⃣ Logging in as Worker...');
        const workerLogin = await makeRequest('POST', '/auth/login', WORKER_CREDENTIALS);
        workerToken = workerLogin.token;
        workerDid = workerLogin.user.did;
        console.log(`✅ Worker logged in successfully. DID: ${workerDid}\n`);

        // Step 2: Login as Regulator
        console.log('2️⃣ Logging in as Regulator...');
        const regulatorLogin = await makeRequest('POST', '/auth/login', REGULATOR_CREDENTIALS);
        regulatorToken = regulatorLogin.token;
        regulatorDid = regulatorLogin.user.did;
        console.log(`✅ Regulator logged in successfully. DID: ${regulatorDid}\n`);

        // Step 3: Worker uploads a document
        console.log('3️⃣ Worker uploading document...');
        const testFilePath = createTestFile();
        
        const formData = new FormData();
        formData.append('file', fs.createReadStream(testFilePath));
        formData.append('documentType', 'Passport');

        const uploadResponse = await makeRequest('POST', '/worker/documents', formData, workerToken, true);
        documentUploadId = uploadResponse.data.id;
        console.log(`✅ Document uploaded successfully. Upload ID: ${documentUploadId}`);
        console.log(`📄 IPFS CID: ${uploadResponse.data.ipfsCid}\n`);

        // Clean up test file
        fs.unlinkSync(testFilePath);

        // Step 4: Worker checks their documents
        console.log('4️⃣ Worker checking uploaded documents...');
        const workerDocuments = await makeRequest('GET', '/worker/documents', null, workerToken);
        console.log(`✅ Worker has ${workerDocuments.data.length} document(s)`);
        console.log(`📋 Latest document status: ${workerDocuments.data[0]?.status}\n`);

        // Step 5: Regulator views pending documents
        console.log('5️⃣ Regulator checking pending documents...');
        const pendingDocuments = await makeRequest('GET', '/regulator/documents/pending', null, regulatorToken);
        console.log(`✅ Found ${pendingDocuments.data.length} pending document(s) for review\n`);

        // Step 6: Regulator issues a verifiable credential
        console.log('6️⃣ Regulator issuing verifiable credential...');
        const credentialData = {
            documentUploadId: documentUploadId,
            holderDid: workerDid,
            claims: {
                passportNumber: 'A1234567',
                nationality: 'Bangladeshi',
                expiryDate: '2030-12-31',
                fullName: 'Test Worker',
                dateOfBirth: '1990-01-01'
            }
        };

        const issuedCredential = await makeRequest('POST', '/regulator/issue-credential', credentialData, regulatorToken);
        credentialJwt = issuedCredential.data.jwt;
        console.log(`✅ Verifiable credential issued successfully!`);
        console.log(`🆔 Credential ID: ${issuedCredential.data.credentialId}`);
        console.log(`📜 Credential Type: ${issuedCredential.data.type}`);
        console.log(`🔐 JWT: ${credentialJwt.substring(0, 50)}...\n`);

        // Step 7: Worker retrieves their credentials
        console.log('7️⃣ Worker retrieving their credentials...');
        const workerCredentials = await makeRequest('GET', '/worker/me/credentials', null, workerToken);
        console.log(`✅ Worker has ${workerCredentials.data.length} verifiable credential(s)`);
        if (workerCredentials.data.length > 0) {
            const credential = workerCredentials.data[0];
            console.log(`📜 Credential Type: ${credential.type}`);
            console.log(`📅 Issued: ${credential.issuanceDate}`);
            console.log(`🏢 Issuer DID: ${credential.issuerDid}\n`);
        }

        // Step 8: Public verification of the credential
        console.log('8️⃣ Publicly verifying the credential...');
        const verificationResult = await makeRequest('GET', `/credentials/verify/${encodeURIComponent(credentialJwt)}`);
        console.log(`✅ Credential verification completed`);
        console.log(`🔍 Verified: ${verificationResult.data.verified}`);
        console.log(`🏢 Issuer: ${verificationResult.data.issuer.id}`);
        console.log(`👤 Subject: ${verificationResult.data.credentialSubject.id}`);
        console.log(`📋 Document Type: ${verificationResult.data.credentialSubject.documentType}\n`);

        // Step 9: Test document rejection workflow
        console.log('9️⃣ Testing document rejection workflow...');
        
        // Upload another document
        const testFilePath2 = createTestFile();
        const formData2 = new FormData();
        formData2.append('file', fs.createReadStream(testFilePath2));
        formData2.append('documentType', 'NID');

        const uploadResponse2 = await makeRequest('POST', '/worker/documents', formData2, workerToken, true);
        const documentUploadId2 = uploadResponse2.data.id;
        
        // Clean up test file
        fs.unlinkSync(testFilePath2);

        // Regulator rejects the document
        const rejectionData = {
            documentUploadId: documentUploadId2,
            reviewerNotes: 'Document quality is insufficient for verification'
        };

        const rejectionResponse = await makeRequest('POST', '/regulator/reject-document', rejectionData, regulatorToken);
        console.log(`✅ Document rejected successfully`);
        console.log(`📝 Status: ${rejectionResponse.data.status}`);
        console.log(`💬 Notes: ${rejectionResponse.data.reviewerNotes}\n`);

        console.log('🎉 Phase 4 Verifiable Credential Ecosystem Test Completed Successfully!');
        console.log('\n📊 Test Summary:');
        console.log('✅ Document upload workflow');
        console.log('✅ IPFS file storage');
        console.log('✅ Verifiable credential issuance');
        console.log('✅ Credential retrieval');
        console.log('✅ Public credential verification');
        console.log('✅ Document rejection workflow');
        console.log('\n🔗 Key Components Tested:');
        console.log('• IPFS Service integration');
        console.log('• Veramo agent with W3C credentials');
        console.log('• Multi-step workflow logic');
        console.log('• Database schema for documents and credentials');
        console.log('• Role-based access control');
        console.log('• File upload handling with Multer');

    } catch (error) {
        console.error('❌ Test failed:', error.message);
        
        if (error.response?.status === 404) {
            console.log('\n💡 Tip: Make sure you have:');
            console.log('1. Started the API server (npm run api:dev)');
            console.log('2. Started IPFS node (npm run start:ipfs)');
            console.log('3. Registered test users with the correct roles');
            console.log('4. Updated the database schema');
        }
        
        process.exit(1);
    }
}

// Helper function to register test users (run this first)
async function registerTestUsers() {
    console.log('👥 Registering test users...\n');
    
    try {
        // Register worker
        const workerData = {
            email: WORKER_CREDENTIALS.email,
            password: WORKER_CREDENTIALS.password,
            name: 'Test Worker',
            role: 'Worker'
        };
        
        await makeRequest('POST', '/auth/register', workerData);
        console.log('✅ Worker registered successfully');

        // Register regulator
        const regulatorData = {
            email: REGULATOR_CREDENTIALS.email,
            password: REGULATOR_CREDENTIALS.password,
            name: 'Test Regulator',
            role: 'Regulator'
        };
        
        await makeRequest('POST', '/auth/register', regulatorData);
        console.log('✅ Regulator registered successfully\n');
        
    } catch (error) {
        if (error.response?.status === 409 && error.response?.data?.error?.includes('already exists')) {
            console.log('ℹ️ Test users already exist, proceeding with test...\n');
        } else {
            console.error('❌ Failed to register test users:', error.response?.data || error.message);
            throw error;
        }
    }
}

// Main execution
async function main() {
    const args = process.argv.slice(2);
    
    if (args.includes('--register-users')) {
        await registerTestUsers();
        return;
    }
    
    if (args.includes('--help')) {
        console.log('Phase 4 Test Script Usage:');
        console.log('node test-phase4.js                 # Run the full test');
        console.log('node test-phase4.js --register-users # Register test users first');
        console.log('node test-phase4.js --help          # Show this help');
        return;
    }
    
    await registerTestUsers();
    await runPhase4Test();
}

main().catch(console.error);
