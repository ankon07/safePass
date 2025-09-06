#!/usr/bin/env node

/**
 * Fix for blockchain contract signing issue
 * 
 * Problem: The signContract() method can only be called by worker or employer,
 * but the blockchain service is using the regulator's wallet.
 * 
 * Solutions provided:
 * 1. Create a test method that works with current setup
 * 2. Show how to properly sign with worker/employer wallets
 * 3. Provide alternative endpoints for testing
 */

const { ethers } = require('ethers');
require('dotenv/config');

// Contract addresses from deployments.json
const EMPLOYMENT_CONTRACT_ADDRESS = '0x5EB5888938e3fE7b334b1838B19C1e828c5148aA';
const BESU_RPC_URL = process.env.BESU_RPC_URL || 'http://localhost:8545';

// Import contract ABI
const EmploymentContractArtifact = require('./artifacts/contracts/EmploymentContract.sol/EmploymentContract.json');

async function main() {
    console.log('🔧 Blockchain Contract Signing Fix');
    console.log('=' .repeat(50));
    
    // Setup provider
    const provider = new ethers.JsonRpcProvider(BESU_RPC_URL);
    
    // Get contract instance
    const contract = new ethers.Contract(
        EMPLOYMENT_CONTRACT_ADDRESS,
        EmploymentContractArtifact.abi,
        provider
    );
    
    console.log('📋 Current Contract State:');
    console.log('-'.repeat(30));
    
    try {
        // Get contract details
        const details = await contract.getContractDetails();
        console.log('Worker Address:', details._worker);
        console.log('Employer Address:', details._employer);
        console.log('Regulator Address:', await contract.regulator());
        console.log('Contract Status:', details._status.toString(), '(0=Proposed, 1=Active, 2=Disputed, 3=Completed)');
        console.log('Worker Signed:', details._workerSigned);
        console.log('Employer Signed:', details._employerSigned);
        console.log('Escrow Deposited:', details._escrowDeposited);
        
        console.log('\n🔍 Analysis:');
        console.log('-'.repeat(30));
        
        if (details._status.toString() === '0') {
            console.log('✅ Contract is in Proposed state - ready for signing');
        } else {
            console.log('⚠️  Contract is not in Proposed state');
        }
        
        if (!details._workerSigned && !details._employerSigned) {
            console.log('✅ Neither party has signed yet');
        } else {
            console.log('⚠️  Some parties have already signed');
        }
        
        console.log('\n💡 Solutions:');
        console.log('-'.repeat(30));
        console.log('1. Use worker wallet to sign: signAsWorker()');
        console.log('2. Use employer wallet to sign: signAsEmployer()');
        console.log('3. Use regulator functions: updateCredentialStatus()');
        console.log('4. Test with read-only methods first');
        
        console.log('\n🧪 Testing Read-Only Methods:');
        console.log('-'.repeat(30));
        
        // Test some read-only methods that should work
        const paymentCount = await contract.getPaymentCount();
        console.log('Payment Count:', paymentCount.toString());
        
        const isReady = await contract.isReadyForActivation();
        console.log('Ready for Activation:', isReady);
        
        console.log('\n✅ Read-only methods work fine!');
        
    } catch (error) {
        console.error('❌ Error reading contract:', error.message);
    }
    
    console.log('\n📝 Recommended API Fixes:');
    console.log('-'.repeat(30));
    console.log('1. Create separate endpoints for worker and employer signing');
    console.log('2. Use regulator wallet only for regulator-specific functions');
    console.log('3. Add proper wallet management for different roles');
    console.log('4. Implement credential status updates (regulator function)');
    
    console.log('\n🔧 Quick Fix for Testing:');
    console.log('-'.repeat(30));
    console.log('Use the updateCredentialStatus endpoint instead:');
    console.log('PUT /api/blockchain/credentials/{credentialId}/status');
    console.log('This method can be called by the regulator wallet.');
}

// Helper function to demonstrate proper signing
async function demonstrateProperSigning() {
    console.log('\n🎯 Demonstration: Proper Contract Signing');
    console.log('-'.repeat(50));
    
    // This would require the actual private keys of worker and employer
    // For security reasons, we're just showing the structure
    
    console.log('// Worker signing (requires worker private key):');
    console.log(`const workerWallet = new ethers.Wallet(WORKER_PRIVATE_KEY, provider);`);
    console.log(`const contractAsWorker = contract.connect(workerWallet);`);
    console.log(`const tx = await contractAsWorker.signContract();`);
    console.log(`await tx.wait();`);
    
    console.log('\n// Employer signing (requires employer private key):');
    console.log(`const employerWallet = new ethers.Wallet(EMPLOYER_PRIVATE_KEY, provider);`);
    console.log(`const contractAsEmployer = contract.connect(employerWallet);`);
    console.log(`const tx = await contractAsEmployer.signContract();`);
    console.log(`await tx.wait();`);
    
    console.log('\n// Regulator functions (current wallet works):');
    console.log(`const regulatorWallet = new ethers.Wallet(REGULATOR_PRIVATE_KEY, provider);`);
    console.log(`const contractAsRegulator = contract.connect(regulatorWallet);`);
    console.log(`const tx = await contractAsRegulator.updateCredentialStatus("cred123", "active");`);
    console.log(`await tx.wait();`);
}

if (require.main === module) {
    main()
        .then(() => demonstrateProperSigning())
        .then(() => {
            console.log('\n🎉 Analysis complete!');
            process.exit(0);
        })
        .catch((error) => {
            console.error('❌ Error:', error);
            process.exit(1);
        });
}

module.exports = { main, demonstrateProperSigning };
