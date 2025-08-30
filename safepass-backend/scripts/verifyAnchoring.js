const { ethers } = require('ethers');
require('dotenv/config');

// Import the ABI of the Anchor contract
const AnchorArtifact = require('../artifacts/contracts/Anchor.sol/Anchor.json');

// Configuration
const SEPOLIA_RPC_URL = process.env.ETHEREUM_SEPOLIA_RPC_URL || process.env.ETHEREUM_SEPOLIA_URL;
const SEPOLIA_ANCHOR_ADDRESS = process.env.SEPOLIA_ANCHOR_CONTRACT_ADDRESS;

async function main() {
  console.log('🔍 Verifying Anchoring on Ethereum Sepolia');
  console.log('='.repeat(50));
  console.log(`🔗 Sepolia RPC: ${SEPOLIA_RPC_URL}`);
  console.log(`📍 Anchor Contract: ${SEPOLIA_ANCHOR_ADDRESS}`);
  console.log('='.repeat(50));

  try {
    // Connect to Sepolia
    const sepoliaProvider = new ethers.JsonRpcProvider(SEPOLIA_RPC_URL);
    const anchorContract = new ethers.Contract(SEPOLIA_ANCHOR_ADDRESS, AnchorArtifact.abi, sepoliaProvider);

    // Get the current batch counter
    const batchCounter = await anchorContract.batchCounter();
    console.log(`📊 Total batches anchored: ${batchCounter.toString()}`);

    if (batchCounter > 0) {
      console.log('\n📋 Anchored batches:');
      
      for (let i = 1; i <= batchCounter; i++) {
        const merkleRoot = await anchorContract.getMerkleRoot(i);
        console.log(`  Batch ${i}: ${merkleRoot}`);
      }

      // Get the latest batch info
      const [latestBatchId, latestMerkleRoot] = await anchorContract.getLatestBatch();
      console.log(`\n🔐 Latest batch: ${latestBatchId.toString()}`);
      console.log(`🌳 Latest Merkle root: ${latestMerkleRoot}`);

      // Get recent events
      console.log('\n📡 Recent BatchAnchored events:');
      const filter = anchorContract.filters.BatchAnchored();
      const events = await anchorContract.queryFilter(filter, -100); // Last 100 blocks
      
      for (const event of events) {
        console.log(`  Block ${event.blockNumber}: Batch ${event.args[0].toString()} - ${event.args[1]}`);
        console.log(`    Transaction: https://sepolia.etherscan.io/tx/${event.transactionHash}`);
        console.log(`    Gas Used: ${event.gasUsed || 'N/A'}`);
      }

      console.log('\n✅ Anchoring verification completed successfully!');
      console.log(`🔗 View contract on Etherscan: https://sepolia.etherscan.io/address/${SEPOLIA_ANCHOR_ADDRESS}`);
      
    } else {
      console.log('⚠️  No batches have been anchored yet.');
    }

  } catch (error) {
    console.error('❌ Verification failed:', error.message);
    process.exit(1);
  }
}

main().catch(console.error);
