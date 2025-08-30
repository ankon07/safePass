const axios = require('axios');
const FormData = require('form-data');

async function testSimpleIPFS() {
    console.log('🔍 Testing Simple IPFS connection...');
    
    const baseUrl = 'http://localhost:5001';
    
    try {
        // Test connection
        console.log('Testing IPFS node accessibility...');
        const nodeResponse = await axios.post(`${baseUrl}/api/v0/id`, null, {
            timeout: 5000,
        });
        
        console.log('✅ IPFS node is online and accessible');
        console.log(`📋 Node ID: ${nodeResponse.data.ID}`);
        console.log(`🌐 Addresses: ${nodeResponse.data.Addresses.slice(0, 2).join(', ')}...`);
        
        // Test file upload
        console.log('\nTesting file upload...');
        const testBuffer = Buffer.from('Hello Simple IPFS test from Phase 4');
        const formData = new FormData();
        formData.append('file', testBuffer, 'test-file.txt');
        
        const uploadResponse = await axios.post(`${baseUrl}/api/v0/add`, formData, {
            headers: {
                ...formData.getHeaders(),
            },
            timeout: 30000,
        });
        
        const cid = uploadResponse.data.Hash;
        console.log(`✅ Test file uploaded successfully. CID: ${cid}`);
        
        // Test file retrieval
        console.log('\nTesting file retrieval...');
        const retrieveResponse = await axios.post(`${baseUrl}/api/v0/cat?arg=${cid}`, null, {
            responseType: 'arraybuffer',
            timeout: 30000,
        });
        
        const retrievedBuffer = Buffer.from(retrieveResponse.data);
        console.log(`✅ Test file retrieved successfully. Content: "${retrievedBuffer.toString()}"`);
        
        // Test pinning
        console.log('\nTesting file pinning...');
        await axios.post(`${baseUrl}/api/v0/pin/add?arg=${cid}`, null, {
            timeout: 30000,
        });
        console.log('✅ Test file pinned successfully');
        
        console.log('\n🎉 All Simple IPFS tests passed! IPFS is ready for Phase 4.');
        
    } catch (error) {
        console.error('❌ Simple IPFS connection test failed:', error.message);
        
        if (error.code === 'ECONNREFUSED') {
            console.log('\n💡 IPFS node is not running. Please start it with:');
            console.log('   npm run start:ipfs');
            console.log('\n💡 Then wait for the node to be ready and try again.');
        } else if (error.code === 'ETIMEDOUT') {
            console.log('\n💡 IPFS node is starting up or busy. Please wait a moment and try again.');
        } else {
            console.log('\n💡 Troubleshooting steps:');
            console.log('1. Check if Docker is running: docker --version');
            console.log('2. Check IPFS container: docker ps | grep ipfs');
            console.log('3. Start IPFS: npm run start:ipfs');
            console.log('4. Check IPFS logs: docker logs safepass-ipfs-node-1');
        }
        
        process.exit(1);
    }
}

testSimpleIPFS();
