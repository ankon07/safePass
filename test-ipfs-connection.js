const { create } = require('ipfs-http-client');

async function testIPFSConnection() {
    console.log('🔍 Testing IPFS connection...');
    
    try {
        // Create IPFS client
        const client = create({ url: 'http://localhost:5001' });
        
        // Test connection
        console.log('Testing IPFS node accessibility...');
        const nodeInfo = await client.id();
        console.log('✅ IPFS node is online and accessible');
        console.log(`📋 Node ID: ${nodeInfo.id}`);
        console.log(`🌐 Addresses: ${nodeInfo.addresses.slice(0, 2).join(', ')}...`);
        
        // Test file upload
        console.log('\nTesting file upload...');
        const testBuffer = Buffer.from('Hello IPFS test from Phase 4');
        const result = await client.add({
            content: testBuffer,
            path: 'test-file.txt'
        });
        const cid = result.cid.toString();
        console.log(`✅ Test file uploaded successfully. CID: ${cid}`);
        
        // Test file retrieval
        console.log('\nTesting file retrieval...');
        const chunks = [];
        for await (const chunk of client.cat(cid)) {
            chunks.push(chunk);
        }
        const retrievedBuffer = Buffer.concat(chunks);
        console.log(`✅ Test file retrieved successfully. Content: "${retrievedBuffer.toString()}"`);
        
        // Test pinning
        console.log('\nTesting file pinning...');
        await client.pin.add(cid);
        console.log('✅ Test file pinned successfully');
        
        console.log('\n🎉 All IPFS tests passed! IPFS is ready for Phase 4.');
        
    } catch (error) {
        console.error('❌ IPFS connection test failed:', error.message);
        
        if (error.code === 'ECONNREFUSED') {
            console.log('\n💡 IPFS node is not running. Please start it with:');
            console.log('   npm run start:ipfs');
            console.log('\n💡 Then wait for the node to be ready and try again.');
        } else if (error.message.includes('timeout')) {
            console.log('\n💡 IPFS node is starting up. Please wait a moment and try again.');
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

testIPFSConnection();
