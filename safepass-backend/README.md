# SafePass Backend - Cross-Chain Blockchain Development Environment

This project sets up a complete cross-chain blockchain development environment with:
- **Node.js** for backend and scripting
- **Hardhat** for smart contract development
- **Hyperledger Besu** running in Docker as a private blockchain
- **IPFS** running in Docker for decentralized storage
- **Cross-Chain Bridge** for anchoring private blockchain data to public networks
- **Multi-Network Support** for Ethereum, Polygon, BSC, and other EVM-compatible chains

## Project Structure

```
safepass-backend/
├── besu-config/
│   ├── besu-genesis-config.json    # Besu network configuration template
│   └── network-files/
│       ├── genesis.json            # Genesis block configuration
│       └── keys/
│           └── key                 # Private key for the validator node
├── besu-data/                      # Besu blockchain data (created by Docker)
├── contracts/
│   ├── Anchor.sol                  # Cross-chain anchoring contract
│   ├── EmploymentContract.sol      # Employment agreement contract
│   └── Lock.sol                    # Sample smart contract
├── ipfs-data/                      # IPFS data (created by Docker)
├── scripts/
│   ├── bridge-service.js           # Cross-chain bridge service
│   ├── deployBridge.js             # Cross-chain deployment script
│   ├── deployAll.ts                # Complete deployment script
│   └── deploy.ts                   # Basic deployment script
├── test/
│   ├── Anchor.test.ts              # Anchor contract tests
│   ├── EmploymentContract.test.ts  # Employment contract tests
│   └── CrossChainBridge.test.js    # Cross-chain functionality tests
├── deployments.json               # Contract deployment addresses
├── .env                           # Environment variables (private keys, API keys)
├── .gitignore                     # Git ignore rules
├── docker-compose.yml             # Docker services configuration
├── hardhat.config.js              # Multi-network Hardhat configuration
├── package.json                   # Node.js dependencies and scripts
└── tsconfig.json                  # TypeScript configuration
```

## Services

### Besu Node
- **RPC HTTP**: http://localhost:8545
- **RPC WebSocket**: http://localhost:8546
- **Chain ID**: 1337
- **Consensus**: Clique (Proof of Authority)

### IPFS Node
- **API**: http://localhost:5001
- **Gateway**: http://localhost:8081

## Getting Started

### Prerequisites
- Node.js (v18 or later)
- Docker and Docker Compose
- Git

### Setup

1. **Start the blockchain and IPFS services:**
   ```bash
   docker-compose up -d
   ```

2. **Check service status:**
   ```bash
   docker-compose ps
   ```

3. **Compile smart contracts:**
   ```bash
   npx hardhat compile
   ```

4. **Deploy to local Besu network:**
   ```bash
   npx hardhat run scripts/deploy.ts --network besu_local
   ```

5. **Test IPFS connection:**
   ```bash
   curl -X POST "http://127.0.0.1:5001/api/v0/version"
   ```

### Stopping Services

```bash
docker-compose down
```

## Configuration

### Environment Variables
The `.env` file contains:
- `BESU_LOCAL_PRIVATE_KEY`: Private key for the pre-funded account

### Network Configuration
- **Chain ID**: 1337
- **Block time**: 5 seconds
- **Pre-funded account**: 0xfe3b557e8fb62b89f4916b721be55ceb828dbd73

## Development

### Adding New Contracts
1. Add your Solidity files to the `contracts/` directory
2. Compile with `npx hardhat compile`
3. Create deployment scripts in `scripts/`
4. Deploy with `npx hardhat run scripts/your-script.ts --network besu_local`

### Testing
Run tests with:
```bash
npx hardhat test --network besu_local
```

### IPFS Usage
You can interact with IPFS using the API at http://localhost:5001 or access files through the gateway at http://localhost:8081.

## Cross-Chain Bridge Functionality

### Overview
The SafePass system implements a cross-chain bridge that allows data from the private Hyperledger Besu blockchain to be anchored and verified on public blockchain networks. This ensures transparency and immutability while maintaining privacy for sensitive operations.

### Supported Networks

#### Private Blockchain
- **Hyperledger Besu (Local)**: Chain ID 1337

#### Public Blockchains
- **Ethereum Mainnet**: Chain ID 1
- **Ethereum Sepolia Testnet**: Chain ID 11155111
- **Polygon Mainnet**: Chain ID 137
- **Polygon Mumbai Testnet**: Chain ID 80001
- **BSC Mainnet**: Chain ID 56
- **BSC Testnet**: Chain ID 97

### Smart Contracts

#### Anchor Contract
The `Anchor.sol` contract provides gas-efficient batch anchoring of Merkle roots from private to public chains:

```solidity
// Anchor a new batch of data
function anchorNewBatch(bytes32 _merkleRoot) external onlyOwner

// Retrieve anchored data
function getMerkleRoot(uint256 batchId) external view returns (bytes32)

// Check if batch exists
function batchExists(uint256 batchId) external view returns (bool)
```

#### Employment Contract
The `EmploymentContract.sol` manages employment agreements with full lifecycle tracking:

```solidity
// Contract lifecycle: Proposed → Active → Disputed/Completed
enum ContractStatus { Proposed, Active, Disputed, Completed }

// Key functions
function signContract() external onlyParties
function recordPayment(uint256 amount) external onlyEmployer
function raiseDispute() external onlyWorker
function resolveDispute(ContractStatus newStatus) external onlyRegulator
```

### Deployment Commands

#### Quick Start
```bash
# Start local blockchain
npm run start:all

# Compile contracts
npm run compile

# Deploy to Besu (private chain)
npm run deploy:bridge:besu

# Deploy to Ethereum Sepolia (public testnet)
npm run deploy:bridge:sepolia

# Deploy to Polygon Mumbai (public testnet)
npm run deploy:bridge:mumbai
```

#### Advanced Deployment
```bash
# Deploy to specific networks
npx hardhat run scripts/deployBridge.js --network besu_local
npx hardhat run scripts/deployBridge.js --network ethereum_sepolia
npx hardhat run scripts/deployBridge.js --network polygon_mainnet

# Use bridge service for cross-chain deployment
node scripts/bridge-service.js deploy besu_local ethereum_sepolia
```

### Bridge Service Operations

#### Status Monitoring
```bash
# Check cross-chain status
npm run bridge:status
node scripts/bridge-service.js status

# Monitor cross-chain events
npm run bridge:monitor
node scripts/bridge-service.js monitor
```

#### Data Anchoring
```bash
# Anchor Merkle root to public chain
node scripts/bridge-service.js anchor 0x1234567890abcdef...

# Verify anchored data
node scripts/bridge-service.js verify 1
```

### Testing

#### Run All Tests
```bash
npm run test:all          # All tests
npm run test:bridge       # Cross-chain bridge tests
npm run test:anchor       # Anchor contract tests
npm run test:employment   # Employment contract tests
```

#### Test Coverage
- Cross-chain anchoring functionality
- Employment contract lifecycle
- Gas optimization verification
- Error handling and edge cases
- Multi-batch processing
- Data integrity verification

### Environment Configuration

#### Required Environment Variables
```bash
# Private blockchain
BESU_LOCAL_PRIVATE_KEY=your_besu_private_key

# Public blockchain networks
ETHEREUM_MAINNET_URL=https://mainnet.infura.io/v3/YOUR_PROJECT_ID
ETHEREUM_SEPOLIA_URL=https://sepolia.infura.io/v3/YOUR_PROJECT_ID
POLYGON_MAINNET_URL=https://polygon-mainnet.infura.io/v3/YOUR_PROJECT_ID
POLYGON_MUMBAI_URL=https://polygon-mumbai.infura.io/v3/YOUR_PROJECT_ID

# Private keys for public networks
PUBLIC_NETWORK_PRIVATE_KEY=your_mainnet_private_key
TESTNET_PRIVATE_KEY=your_testnet_private_key

# API keys for contract verification
ETHERSCAN_API_KEY=your_etherscan_api_key
POLYGONSCAN_API_KEY=your_polygonscan_api_key
BSCSCAN_API_KEY=your_bscscan_api_key

# Bridge configuration
BRIDGE_BATCH_SIZE=100
BRIDGE_CONFIRMATION_BLOCKS=12
BRIDGE_RETRY_ATTEMPTS=3
```

### Cross-Chain Workflow

1. **Private Chain Operations**
   - Deploy employment contracts on Besu
   - Execute business logic (signing, payments, disputes)
   - Generate Merkle proofs of contract states

2. **Public Chain Anchoring**
   - Batch contract data into Merkle trees
   - Anchor Merkle roots to public blockchain
   - Provide immutable proof of private chain data

3. **Verification Process**
   - Query public chain for anchored data
   - Verify Merkle proofs against private chain
   - Ensure data integrity across chains

### Gas Optimization

The bridge is designed for gas efficiency:
- Batch processing reduces per-transaction costs
- Merkle tree compression minimizes data storage
- Optimized contract design for minimal gas usage
- Configurable batch sizes for cost optimization

### Security Considerations

- **Private Key Management**: Never commit real private keys
- **Network Separation**: Private and public chain isolation
- **Access Control**: Owner-only anchoring functions
- **Data Validation**: Merkle root verification
- **Retry Logic**: Robust error handling and recovery

## Troubleshooting

### Container Issues
- Check logs: `docker-compose logs [service-name]`
- Restart services: `docker-compose restart`
- Clean restart: `docker-compose down && docker-compose up -d`

### Port Conflicts
If you encounter port conflicts, modify the port mappings in `docker-compose.yml`.

### Node.js Version Warning
The setup works with Node.js v23.8.0 despite Hardhat warnings. For production, consider using Node.js LTS versions.
# sfaePass
