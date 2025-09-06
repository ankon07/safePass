const { ethers } = require('ethers');
const EmploymentContract = require('./artifacts/contracts/EmploymentContract.sol/EmploymentContract.json');

async function testContractMethods() {
    console.log('🔍 Testing EmploymentContract methods...');
    
    try {
        // Initialize provider and wallet
        const provider = new ethers.JsonRpcProvider(process.env.BESU_RPC_URL || 'http://localhost:8545');
        const wallet = new ethers.Wallet(process.env.REGULATOR_PRIVATE_KEY, provider);
        
        console.log('✅ Connected to blockchain');
        console.log('📍 Wallet address:', wallet.address);
        
        // Get contract address from environment
        const contractAddress = process.env.EMPLOYMENT_CONTRACT_ADDRESS;
        console.log('📍 Contract address:', contractAddress);
        
        if (!contractAddress) {
            throw new Error('EMPLOYMENT_CONTRACT_ADDRESS not set in environment');
        }
        
        // Create contract instance
        const contract = new ethers.Contract(contractAddress, EmploymentContract.abi, wallet);
        console.log('✅ Contract instance created');
        
        // Test basic contract properties
        console.log('\n🧪 Testing basic contract properties...');
        
        try {
            const worker = await contract.worker();
            console.log('✅ worker():', worker);
        } catch (error) {
            console.log('❌ worker() failed:', error.message);
        }
        
        try {
            const employer = await contract.employer();
            console.log('✅ employer():', employer);
        } catch (error) {
            console.log('❌ employer() failed:', error.message);
        }
        
        try {
            const status = await contract.status();
            console.log('✅ status():', status.toString());
        } catch (error) {
            console.log('❌ status() failed:', error.message);
        }
        
        // Test the problematic getContractDetails method
        console.log('\n🧪 Testing getContractDetails method...');
        try {
            const details = await contract.getContractDetails();
            console.log('✅ getContractDetails() success:', details);
        } catch (error) {
            console.log('❌ getContractDetails() failed:', error.message);
            console.log('Full error:', error);
        }
        
        // Test other methods
        console.log('\n🧪 Testing other methods...');
        
        try {
            const paymentCount = await contract.getPaymentCount();
            console.log('✅ getPaymentCount():', paymentCount.toString());
        } catch (error) {
            console.log('❌ getPaymentCount() failed:', error.message);
        }
        
        try {
            const isReady = await contract.isReadyForActivation();
            console.log('✅ isReadyForActivation():', isReady);
        } catch (error) {
            console.log('❌ isReadyForActivation() failed:', error.message);
        }
        
        // Check if contract has code
        console.log('\n🧪 Checking contract code...');
        const code = await provider.getCode(contractAddress);
        console.log('Contract code length:', code.length);
        console.log('Has code:', code !== '0x');
        
        if (code === '0x') {
            console.log('❌ Contract has no code! It may not be deployed or the address is wrong.');
        }
        
    } catch (error) {
        console.error('❌ Test failed:', error);
    }
}

// Load environment variables
require('dotenv').config();

// Run the test
testContractMethods().catch(console.error);
