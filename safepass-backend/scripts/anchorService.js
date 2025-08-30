const { ethers } = require('ethers');
const { MerkleTree } = require('merkletreejs');
const keccak256 = require('keccak256');
const { readFileSync, writeFileSync, existsSync } = require('fs');
require('dotenv/config');

// Import the ABI of the Anchor contract
const AnchorArtifact = require('../artifacts/contracts/Anchor.sol/Anchor.json');

// --- Configuration ---
const BESU_RPC_URL = process.env.BESU_RPC_URL || 'http://localhost:8545';
const SEPOLIA_RPC_URL = process.env.ETHEREUM_SEPOLIA_RPC_URL;
const ANCHORING_PRIVATE_KEY = process.env.ANCHORING_SERVICE_PRIVATE_KEY;
const SEPOLIA_ANCHOR_ADDRESS = process.env.SEPOLIA_ANCHOR_CONTRACT_ADDRESS;
const LAST_ANCHORED_BLOCK_FILE = process.env.LAST_ANCHORED_BLOCK_FILE || './data/last-anchored-block.json';

// Validation
if (!SEPOLIA_RPC_URL) {
  console.error('❌ ETHEREUM_SEPOLIA_RPC_URL not set in .env file');
  process.exit(1);
}

if (!ANCHORING_PRIVATE_KEY) {
  console.error('❌ ANCHORING_SERVICE_PRIVATE_KEY not set in .env file');
  process.exit(1);
}

if (!SEPOLIA_ANCHOR_ADDRESS) {
  console.error('❌ SEPOLIA_ANCHOR_CONTRACT_ADDRESS not set in .env file');
  console.error('Please deploy the Anchor contract to Sepolia first using:');
  console.error('npx hardhat run scripts/deployAnchorToSepolia.ts --network ethereum_sepolia');
  process.exit(1);
}

// --- Providers and Wallet Setup ---
const besuProvider = new ethers.JsonRpcProvider(BESU_RPC_URL);
const sepoliaProvider = new ethers.JsonRpcProvider(SEPOLIA_RPC_URL);
const anchoringWallet = new ethers.Wallet(ANCHORING_PRIVATE_KEY, sepoliaProvider);
const anchorContract = new ethers.Contract(SEPOLIA_ANCHOR_ADDRESS, AnchorArtifact.abi, anchoringWallet);

// --- Helper Functions ---
function loadLastAnchoredBlock() {
  try {
    if (existsSync(LAST_ANCHORED_BLOCK_FILE)) {
      const data = JSON.parse(readFileSync(LAST_ANCHORED_BLOCK_FILE, 'utf8'));
      return data.lastAnchoredBlock || 0;
    }
  } catch (error) {
    console.warn('⚠️  Could not load last anchored block, starting from block 1');
  }
  return 0;
}

function saveLastAnchoredBlock(blockNumber, batchId, merkleRoot) {
  const data = {
    lastAnchoredBlock: blockNumber,
    lastAnchoredAt: new Date().toISOString(),
    lastBatchId: batchId,
    lastMerkleRoot: merkleRoot,
    sepoliaContract: SEPOLIA_ANCHOR_ADDRESS
  };
  
  try {
    writeFileSync(LAST_ANCHORED_BLOCK_FILE, JSON.stringify(data, null, 2));
    console.log(`💾 Saved anchoring state to ${LAST_ANCHORED_BLOCK_FILE}`);
  } catch (error) {
    console.error('❌ Failed to save anchoring state:', error.message);
  }
}

async function getBesuTransactionsSince(startBlock) {
  console.log(`🔍 Fetching transactions from Besu blocks ${startBlock} onwards...`);
  
  const latestBlockNumber = await besuProvider.getBlockNumber();
  console.log(`📊 Latest Besu block: ${latestBlockNumber}`);
  
  if (startBlock >= latestBlockNumber) {
    console.log('ℹ️  No new blocks to process');
    return { transactions: [], latestBlock: latestBlockNumber };
  }

  const transactionHashes = [];
  let processedBlocks = 0;
  
  // Process blocks in batches to avoid overwhelming the RPC
  const BATCH_SIZE = 10;
  
  for (let i = startBlock + 1; i <= latestBlockNumber; i += BATCH_SIZE) {
    const endBlock = Math.min(i + BATCH_SIZE - 1, latestBlockNumber);
    
    console.log(`📦 Processing blocks ${i} to ${endBlock}...`);
    
    const blockPromises = [];
    for (let blockNum = i; blockNum <= endBlock; blockNum++) {
      blockPromises.push(besuProvider.getBlock(blockNum));
    }
    
    const blocks = await Promise.all(blockPromises);
    
    for (const block of blocks) {
      if (block && block.transactions.length > 0) {
        transactionHashes.push(...block.transactions);
        processedBlocks++;
      }
    }
  }
  
  console.log(`✅ Processed ${processedBlocks} blocks with transactions`);
  console.log(`📝 Found ${transactionHashes.length} transactions to anchor`);
  
  return { transactions: transactionHashes, latestBlock: latestBlockNumber };
}

function createMerkleTree(transactionHashes) {
  if (transactionHashes.length === 0) {
    // If no transactions, create a tree with a single "empty" leaf
    const emptyLeaf = keccak256('NO_TRANSACTIONS_' + Date.now());
    return new MerkleTree([emptyLeaf], keccak256, { sortPairs: true });
  }
  
  // Create leaves from transaction hashes
  const leaves = transactionHashes.map(tx => keccak256(tx));
  return new MerkleTree(leaves, keccak256, { sortPairs: true });
}

async function anchorToSepolia(merkleRoot) {
  console.log(`🚀 Anchoring Merkle root to Sepolia: ${merkleRoot}`);
  
  try {
    // Check wallet balance
    const balance = await sepoliaProvider.getBalance(anchoringWallet.address);
    console.log(`💰 Anchoring wallet balance: ${ethers.formatEther(balance)} ETH`);
    
    if (balance < ethers.parseEther('0.001')) {
      throw new Error('Insufficient balance for anchoring transaction. Please fund the anchoring wallet.');
    }
    
    // Estimate gas
    const gasEstimate = await anchorContract.anchorNewBatch.estimateGas(merkleRoot);
    console.log(`⛽ Estimated gas: ${gasEstimate.toString()}`);
    
    // Send transaction
    const tx = await anchorContract.anchorNewBatch(merkleRoot, {
      gasLimit: gasEstimate * 120n / 100n // Add 20% buffer
    });
    
    console.log(`📤 Transaction sent: ${tx.hash}`);
    console.log(`🔗 Etherscan: https://sepolia.etherscan.io/tx/${tx.hash}`);
    
    // Wait for confirmation
    console.log('⏳ Waiting for transaction confirmation...');
    const receipt = await tx.wait();
    
    console.log(`✅ Transaction confirmed in block ${receipt.blockNumber}`);
    console.log(`💸 Gas used: ${receipt.gasUsed.toString()}`);
    
    // Extract batch ID from event logs
    let batchId = null;
    for (const log of receipt.logs) {
      try {
        const parsedLog = anchorContract.interface.parseLog(log);
        if (parsedLog && parsedLog.name === 'BatchAnchored') {
          batchId = parsedLog.args[0].toString();
          break;
        }
      } catch (e) {
        // Skip logs that don't match our contract
      }
    }
    
    return {
      success: true,
      transactionHash: receipt.hash || receipt.transactionHash || tx.hash,
      blockNumber: receipt.blockNumber,
      gasUsed: receipt.gasUsed.toString(),
      batchId: batchId
    };
    
  } catch (error) {
    console.error('❌ Failed to anchor Merkle root:', error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

// --- Main Logic ---
async function main() {
  console.log('🌟 Starting SafePass Daily Anchoring Service');
  console.log('='.repeat(50));
  console.log(`📅 Timestamp: ${new Date().toISOString()}`);
  console.log(`🔗 Besu RPC: ${BESU_RPC_URL}`);
  console.log(`🔗 Sepolia RPC: ${SEPOLIA_RPC_URL}`);
  console.log(`📍 Anchor Contract: ${SEPOLIA_ANCHOR_ADDRESS}`);
  console.log(`👛 Anchoring Wallet: ${anchoringWallet.address}`);
  console.log('='.repeat(50));

  try {
    // 1. Load the last anchored block
    const lastAnchoredBlock = loadLastAnchoredBlock();
    console.log(`📖 Last anchored block: ${lastAnchoredBlock}`);

    // 2. Fetch new transactions from Besu
    const { transactions, latestBlock } = await getBesuTransactionsSince(lastAnchoredBlock);

    if (transactions.length === 0) {
      console.log('ℹ️  No new transactions to anchor. Exiting.');
      return;
    }

    // 3. Build the Merkle Tree
    console.log('🌳 Building Merkle tree...');
    const tree = createMerkleTree(transactions);
    const merkleRoot = tree.getHexRoot();

    console.log(`🔐 Merkle Root: ${merkleRoot}`);
    console.log(`🍃 Tree depth: ${tree.getDepth()}`);
    console.log(`📊 Leaf count: ${tree.getLeafCount()}`);

    // 4. Anchor to Sepolia
    const anchorResult = await anchorToSepolia(merkleRoot);

    if (anchorResult.success) {
      // 5. Save the anchoring state
      saveLastAnchoredBlock(latestBlock, anchorResult.batchId, merkleRoot);

      console.log('\n🎉 Anchoring completed successfully!');
      console.log('='.repeat(50));
      console.log(`📦 Transactions anchored: ${transactions.length}`);
      console.log(`🔐 Merkle Root: ${merkleRoot}`);
      console.log(`🆔 Batch ID: ${anchorResult.batchId}`);
      console.log(`📋 Transaction: ${anchorResult.transactionHash}`);
      console.log(`🔗 Etherscan: https://sepolia.etherscan.io/tx/${anchorResult.transactionHash}`);
      console.log(`⛽ Gas Used: ${anchorResult.gasUsed}`);
      console.log('='.repeat(50));
    } else {
      console.error('\n❌ Anchoring failed!');
      console.error(`Error: ${anchorResult.error}`);
      process.exit(1);
    }

  } catch (error) {
    console.error('\n💥 Unexpected error during anchoring:');
    console.error(error);
    process.exit(1);
  }
}

// Handle command line arguments
const args = process.argv.slice(2);
if (args.includes('--help') || args.includes('-h')) {
  console.log('SafePass Daily Anchoring Service');
  console.log('');
  console.log('Usage: node scripts/anchorService.ts [options]');
  console.log('');
  console.log('Options:');
  console.log('  --help, -h     Show this help message');
  console.log('  --dry-run      Simulate anchoring without sending transaction');
  console.log('  --force        Force anchoring even if no new transactions');
  console.log('');
  console.log('Environment Variables:');
  console.log('  ETHEREUM_SEPOLIA_RPC_URL        Sepolia RPC endpoint');
  console.log('  ANCHORING_SERVICE_PRIVATE_KEY   Private key for anchoring wallet');
  console.log('  SEPOLIA_ANCHOR_CONTRACT_ADDRESS Deployed Anchor contract address');
  console.log('  BESU_RPC_URL                    Besu RPC endpoint (default: http://localhost:8545)');
  process.exit(0);
}

// Execute the main function
main().catch(console.error);
