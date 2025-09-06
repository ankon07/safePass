const { MerkleTree } = require('merkletreejs');
const keccak256 = require('keccak256');
const { ethers } = require('ethers');

/**
 * Offline Test Suite for SafePass Merkle Verification System
 * Tests core functionality without requiring database or blockchain connections
 */

console.log('🧪 Testing SafePass Merkle Verification System (Offline Mode)');
console.log('============================================================');

const testResults = {
    merkleTreeGeneration: false,
    proofGeneration: false,
    proofVerification: false,
    anchorContractInterface: false,
    apiEndpointStructure: false,
    configurationValidation: false
};

/**
 * Test 1: Merkle Tree Generation
 */
async function testMerkleTreeGeneration() {
    console.log('1️⃣ Testing Merkle Tree Generation...');
    
    try {
        // Sample transaction hashes
        const transactions = [
            '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef12',
            '0x2345678901bcdef12345678901bcdef12345678901bcdef12345678901bcdef23',
            '0x3456789012cdef123456789012cdef123456789012cdef123456789012cdef34',
            '0x4567890123def1234567890123def1234567890123def1234567890123def45'
        ];

        // Create leaves by hashing transaction hashes
        const leaves = transactions.map(tx => keccak256(tx));
        
        // Build Merkle tree
        const tree = new MerkleTree(leaves, keccak256, { sortPairs: true });
        const root = tree.getHexRoot();
        
        console.log(`   📊 Transactions: ${transactions.length}`);
        console.log(`   🌳 Tree depth: ${tree.getDepth()}`);
        console.log(`   🔐 Merkle root: ${root}`);
        
        if (root && root.startsWith('0x') && root.length === 66) {
            console.log('   ✅ Merkle tree generation: PASSED');
            testResults.merkleTreeGeneration = true;
            return { tree, transactions, leaves, root };
        } else {
            throw new Error('Invalid Merkle root format');
        }
    } catch (error) {
        console.log(`   ❌ Merkle tree generation: FAILED - ${error.message}`);
        return null;
    }
}

/**
 * Test 2: Proof Generation
 */
async function testProofGeneration(treeData) {
    console.log('2️⃣ Testing Proof Generation...');
    
    try {
        if (!treeData) {
            throw new Error('No tree data available');
        }

        const { tree, transactions, leaves } = treeData;
        const targetTx = transactions[1]; // Test with second transaction
        const targetLeaf = keccak256(targetTx);
        
        // Generate proof
        const proof = tree.getHexProof(targetLeaf);
        const leafIndex = tree.getLeafIndex(targetLeaf);
        
        console.log(`   🎯 Target transaction: ${targetTx}`);
        console.log(`   📍 Leaf index: ${leafIndex}`);
        console.log(`   🔍 Proof length: ${proof.length} elements`);
        console.log(`   📝 Proof: [${proof.slice(0, 2).join(', ')}${proof.length > 2 ? ', ...' : ''}]`);
        
        if (proof && proof.length > 0 && leafIndex >= 0) {
            console.log('   ✅ Proof generation: PASSED');
            testResults.proofGeneration = true;
            return { proof, targetTx, targetLeaf, leafIndex };
        } else {
            throw new Error('Invalid proof generated');
        }
    } catch (error) {
        console.log(`   ❌ Proof generation: FAILED - ${error.message}`);
        return null;
    }
}

/**
 * Test 3: Proof Verification
 */
async function testProofVerification(treeData, proofData) {
    console.log('3️⃣ Testing Proof Verification...');
    
    try {
        if (!treeData || !proofData) {
            throw new Error('Missing tree or proof data');
        }

        const { root } = treeData;
        const { proof, targetLeaf } = proofData;
        
        // Verify proof using MerkleTree library
        const isValid = MerkleTree.verify(proof, targetLeaf, root, keccak256, { sortPairs: true });
        
        console.log(`   🔐 Root: ${root}`);
        console.log(`   🍃 Leaf: ${targetLeaf.toString('hex')}`);
        console.log(`   ✅ Verification result: ${isValid ? 'VALID' : 'INVALID'}`);
        
        if (isValid) {
            console.log('   ✅ Proof verification: PASSED');
            testResults.proofVerification = true;
            return true;
        } else {
            throw new Error('Proof verification failed');
        }
    } catch (error) {
        console.log(`   ❌ Proof verification: FAILED - ${error.message}`);
        return false;
    }
}

/**
 * Test 4: Anchor Contract Interface
 */
async function testAnchorContractInterface() {
    console.log('4️⃣ Testing Anchor Contract Interface...');
    
    try {
        // Load Anchor contract ABI
        const AnchorArtifact = require('./artifacts/contracts/Anchor.sol/Anchor.json');
        
        // Create contract interface
        const contractInterface = new ethers.Interface(AnchorArtifact.abi);
        
        // Test encoding function calls
        const merkleRoot = '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef12';
        const encodedCall = contractInterface.encodeFunctionData('anchorNewBatch', [merkleRoot]);
        
        console.log(`   📋 Contract ABI loaded: ${AnchorArtifact.abi.length} functions`);
        console.log(`   🔧 Function encoding test: ${encodedCall.slice(0, 20)}...`);
        
        // Test key functions exist
        const requiredFunctions = ['anchorNewBatch', 'getMerkleRoot', 'getLatestBatch', 'batchExists'];
        const availableFunctions = AnchorArtifact.abi
            .filter(item => item.type === 'function')
            .map(item => item.name);
        
        const missingFunctions = requiredFunctions.filter(fn => !availableFunctions.includes(fn));
        
        if (missingFunctions.length === 0) {
            console.log('   ✅ All required functions available');
            console.log('   ✅ Anchor contract interface: PASSED');
            testResults.anchorContractInterface = true;
            return true;
        } else {
            throw new Error(`Missing functions: ${missingFunctions.join(', ')}`);
        }
    } catch (error) {
        console.log(`   ❌ Anchor contract interface: FAILED - ${error.message}`);
        return false;
    }
}

/**
 * Test 5: API Endpoint Structure
 */
async function testAPIEndpointStructure() {
    console.log('5️⃣ Testing API Endpoint Structure...');
    
    try {
        // Load verification API routes
        const fs = require('fs');
        const verificationApiContent = fs.readFileSync('./src/api/verification.js', 'utf8');
        
        // Check for required endpoints
        const requiredEndpoints = [
            'GET.*proof/:transactionHash',
            'POST.*verify',
            'GET.*status',
            'GET.*batch/:batchId',
            'GET.*batches',
            'GET.*search',
            'GET.*stats'
        ];
        
        const foundEndpoints = [];
        const missingEndpoints = [];
        
        for (const endpoint of requiredEndpoints) {
            const regex = new RegExp(endpoint);
            if (regex.test(verificationApiContent)) {
                foundEndpoints.push(endpoint);
            } else {
                missingEndpoints.push(endpoint);
            }
        }
        
        console.log(`   📡 Found endpoints: ${foundEndpoints.length}/${requiredEndpoints.length}`);
        
        if (missingEndpoints.length === 0) {
            console.log('   ✅ All required endpoints found');
            console.log('   ✅ API endpoint structure: PASSED');
            testResults.apiEndpointStructure = true;
            return true;
        } else {
            throw new Error(`Missing endpoints: ${missingEndpoints.join(', ')}`);
        }
    } catch (error) {
        console.log(`   ❌ API endpoint structure: FAILED - ${error.message}`);
        return false;
    }
}

/**
 * Test 6: Configuration Validation
 */
async function testConfigurationValidation() {
    console.log('6️⃣ Testing Configuration Validation...');
    
    try {
        require('dotenv/config');
        
        const requiredEnvVars = [
            'ETHEREUM_SEPOLIA_RPC_URL',
            'ANCHORING_SERVICE_PRIVATE_KEY',
            'SEPOLIA_ANCHOR_CONTRACT_ADDRESS',
            'BESU_RPC_URL'
        ];
        
        const missingVars = [];
        const foundVars = [];
        
        for (const envVar of requiredEnvVars) {
            if (process.env[envVar]) {
                foundVars.push(envVar);
            } else {
                missingVars.push(envVar);
            }
        }
        
        console.log(`   ⚙️  Found config vars: ${foundVars.length}/${requiredEnvVars.length}`);
        
        // Validate contract address format
        const contractAddress = process.env.SEPOLIA_ANCHOR_CONTRACT_ADDRESS;
        const isValidAddress = contractAddress && 
                              contractAddress.startsWith('0x') && 
                              contractAddress.length === 42;
        
        console.log(`   📍 Contract address valid: ${isValidAddress ? 'YES' : 'NO'}`);
        
        if (missingVars.length === 0 && isValidAddress) {
            console.log('   ✅ Configuration validation: PASSED');
            testResults.configurationValidation = true;
            return true;
        } else {
            const errors = [];
            if (missingVars.length > 0) errors.push(`Missing vars: ${missingVars.join(', ')}`);
            if (!isValidAddress) errors.push('Invalid contract address');
            throw new Error(errors.join('; '));
        }
    } catch (error) {
        console.log(`   ❌ Configuration validation: FAILED - ${error.message}`);
        return false;
    }
}

/**
 * Test 7: Enhanced Anchor Service Structure
 */
async function testEnhancedAnchorService() {
    console.log('7️⃣ Testing Enhanced Anchor Service Structure...');
    
    try {
        const fs = require('fs');
        const anchorServiceContent = fs.readFileSync('./scripts/enhancedAnchorService.js', 'utf8');
        
        // Check for key components
        const requiredComponents = [
            'class EnhancedAnchorService',
            'performAnchoring',
            'startScheduler',
            'getBesuTransactionsSince',
            'anchorToSepolia',
            'createMerkleTree'
        ];
        
        const foundComponents = [];
        const missingComponents = [];
        
        for (const component of requiredComponents) {
            if (anchorServiceContent.includes(component)) {
                foundComponents.push(component);
            } else {
