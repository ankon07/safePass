# SafePass System - Complete Technical Architecture Documentation

## Executive Summary

SafePass is a **decentralized identity and credential management platform** designed for migrant workers and employment verification. The system combines blockchain technology, decentralized storage (IPFS), and traditional web services to create a secure, verifiable, and tamper-proof credential ecosystem.

## System Overview

### Core Purpose
- **Identity Management**: Secure DID-based identity creation and management
- **Document Verification**: Upload, verify, and issue credentials for personal documents
- **Employment Contracts**: Smart contract-based employment agreements
- **Cross-Chain Anchoring**: Public verifiability through blockchain anchoring
- **Credential Ecosystem**: W3C-compliant verifiable credentials

### Key Stakeholders
- **Workers**: Migrant workers who need verified credentials
- **Employers/Agencies**: Organizations hiring workers
- **Regulators**: Trusted authorities who verify documents and issue credentials
- **Public/Verifiers**: Anyone who needs to verify credentials

## Architecture Layers

### 1. Blockchain Layer (Smart Contracts)

#### Private Blockchain - Hyperledger Besu
- **Network**: Private Proof-of-Authority (Clique consensus)
- **Chain ID**: 1337
- **RPC Endpoints**: 
  - HTTP: `http://localhost:8545`
  - WebSocket: `http://localhost:8546`
- **Block Time**: 5 seconds
- **Pre-funded Account**: `0xfe3b557e8fb62b89f4916b721be55ceb828dbd73`

#### Smart Contracts

##### 1. EmploymentContract.sol
```solidity
// Core employment agreement management
enum ContractStatus { Proposed, Active, Disputed, Completed }

Key Functions:
- signContract() - Both parties sign the agreement
- recordPayment() - Employer records salary payments
- raiseDispute() - Worker raises employment disputes
- resolveDispute() - Regulator resolves disputes
- updateCredentialStatus() - Manage worker credentials
```

**Features**:
- Multi-party contract (Worker, Employer, Regulator)
- Payment tracking and history
- Dispute resolution mechanism
- Credential status management
- Event-driven lifecycle tracking

##### 2. Anchor.sol
```solidity
// Cross-chain anchoring for public verifiability
Key Functions:
- anchorNewBatch() - Anchor Merkle root to public chain
- getMerkleRoot() - Retrieve anchored data
- batchExists() - Verify batch existence
```

**Features**:
- Gas-efficient batch anchoring
- Merkle tree-based data compression
- Owner-only anchoring (backend service)
- Event emission for monitoring

##### 3. EthereumDIDRegistry.sol
```solidity
// W3C DID standard implementation
Key Functions:
- changeOwner() - Transfer DID ownership
- addDelegate() - Add trusted delegates
- setAttribute() - Set DID attributes
- revokeAttribute() - Revoke DID attributes
```

**Features**:
- ERC-1056 compliant DID registry
- Cryptographic signature support
- Delegate management
- Attribute-based identity

#### Public Blockchain Integration
- **Ethereum Sepolia Testnet**: Chain ID 11155111
- **Polygon Mumbai**: Chain ID 80001
- **BSC Testnet**: Chain ID 97
- **Purpose**: Public anchoring for transparency and immutability

### 2. Backend Services Layer

#### API Gateway (Express.js)
```typescript
// Main server entry point
Port: 3001
Endpoints:
- /api/auth/* - Authentication services
- /api/users/* - User management
- /api/documents/* - Document upload/management
- /api/credentials/* - Verifiable credentials
- /api/blockchain/* - Blockchain operations
```

#### Core Services

##### 1. Blockchain Service (`blockchainService.ts`)
```typescript
class BlockchainService extends EventEmitter {
  // Contract management
  registerContract(name, config)
  getContract(name)
  
  // Transaction execution
  executeContractMethod(contractName, methodName, args)
  callContractMethod(contractName, methodName, args)
  
  // Event handling
  startEventListener(contractName, eventName, callback)
  getPastEvents(contractName, eventName, fromBlock, toBlock)
  
  // Deployment
  deployContract(contractName, abi, bytecode, constructorArgs)
}
```

**Features**:
- Automatic gas estimation and nonce management
- Event-driven architecture
- Transaction retry logic
- Contract abstraction layer
- Real-time blockchain event monitoring

##### 2. Identity Service (`identityService.ts`)
```typescript
// Veramo-based DID management
Functions:
- createUserDID() - Generate new DID and private key
- encryptPrivateKey() - Secure key storage
- decryptPrivateKey() - Key retrieval
- createVeramoAgent() - Initialize Veramo agent
```

**Features**:
- W3C DID standard compliance
- Ethereum-based DIDs (did:ethr:besu)
- Cryptographic key management
- Veramo framework integration
- SQLite-based key storage

##### 3. IPFS Service (`ipfsService.ts`)
```typescript
class IPFSService {
  // File operations
  uploadFile(fileBuffer, filename) - Upload to IPFS
  getFile(cid) - Retrieve file by CID
  getFileAsBuffer(cid) - Get file as buffer
  pinFile(cid) - Pin file to prevent GC
  
  // Node management
  isOnline() - Check IPFS connectivity
  getNodeInfo() - Get node information
}
```

**Features**:
- Content-addressed storage
- Immutable file storage
- Automatic file pinning
- HTTP API integration
- Timeout and error handling

##### 4. Anchoring Service (`anchorService.js`)
```javascript
// Cross-chain anchoring automation
Process:
1. Fetch new transactions from Besu
2. Build Merkle tree from transaction hashes
3. Anchor Merkle root to Sepolia testnet
4. Track anchoring progress
5. Provide public verifiability
```

**Features**:
- Automated batch processing
- Merkle tree generation
- Cross-chain transaction management
- Progress tracking and persistence
- Gas optimization

### 3. Data Layer

#### Database Schema (Supabase PostgreSQL)

##### Users Table
```sql
CREATE TABLE users (
    id UUID PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    name VARCHAR(255) NOT NULL,
    role VARCHAR(50) CHECK (role IN ('Worker', 'AgencyAdmin', 'Regulator')),
    did VARCHAR(255) UNIQUE NOT NULL,
    encrypted_private_key_hex TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

##### Document Uploads Table
```sql
CREATE TABLE document_uploads (
    id UUID PRIMARY KEY,
    user_id UUID REFERENCES users(id),
    document_type VARCHAR(100) NOT NULL,
    ipfs_cid VARCHAR(255) NOT NULL,
    status VARCHAR(50) DEFAULT 'PendingVerification',
    created_at TIMESTAMP DEFAULT NOW(),
    reviewed_at TIMESTAMP,
    reviewer_notes TEXT,
    reviewer_id UUID REFERENCES users(id)
);
```

##### Verifiable Credentials Table
```sql
CREATE TABLE verifiable_credentials (
    id UUID PRIMARY KEY,
    holder_did VARCHAR(255) NOT NULL,
    issuer_did VARCHAR(255) NOT NULL,
    type VARCHAR(100) NOT NULL,
    issuance_date TIMESTAMP DEFAULT NOW(),
    raw_vc_jwt TEXT NOT NULL,
    source_document_id UUID REFERENCES document_uploads(id)
);
```

**Security Features**:
- Row-Level Security (RLS) policies
- Role-based access control
- Encrypted private key storage
- Audit trail tracking

#### IPFS Storage
- **Node**: Kubo (Go-IPFS)
- **API Port**: 5001
- **Gateway Port**: 8081
- **Storage**: Content-addressed, immutable
- **Features**: Automatic pinning, content verification

### 4. Infrastructure Layer

#### Docker Services (`docker-compose.yml`)
```yaml
services:
  besu-node:
    image: hyperledger/besu:latest
    ports: ["8545:8545", "8546:8546", "30303:30303"]
    
  ipfs-node:
    image: ipfs/kubo:latest
    ports: ["5001:5001", "8081:8080"]
```

#### Development Tools
- **Hardhat**: Smart contract development and testing
- **TypeScript**: Type-safe backend development
- **Veramo**: DID and Verifiable Credential framework
- **Ethers.js**: Blockchain interaction library

## Data Flow Architecture

### 1. User Registration Flow
```
1. User submits registration → API Gateway
2. Generate DID and private key → Identity Service
3. Encrypt and store private key → Database
4. Create user record → Database
5. Return user credentials → Frontend
```

### 2. Document Verification Flow
```
1. Worker uploads document → API Gateway
2. Store document in IPFS → IPFS Service
3. Save metadata to database → Database
4. Regulator reviews document → API Gateway
5. Issue verifiable credential → Identity Service
6. Store credential → Database
7. Update document status → Database
```

### 3. Employment Contract Flow
```
1. Create employment contract → Blockchain Service
2. Deploy to Besu network → Smart Contract
3. Both parties sign contract → Smart Contract
4. Contract becomes active → Event System
5. Record payments → Smart Contract
6. Handle disputes → Smart Contract
7. Complete contract → Smart Contract
```

### 4. Cross-Chain Anchoring Flow
```
1. Collect Besu transactions → Anchoring Service
2. Build Merkle tree → Anchoring Service
3. Anchor root to Sepolia → Public Blockchain
4. Update anchoring state → File System
5. Provide public verification → Public API
```

## Security Architecture

### 1. Cryptographic Security
- **DID Keys**: secp256k1 elliptic curve cryptography
- **Private Key Storage**: AES-256-CBC encryption with master key
- **Transaction Signing**: Ethereum-compatible ECDSA signatures
- **Merkle Trees**: Keccak-256 hash function

### 2. Access Control
- **Role-Based Access Control (RBAC)**:
  - Workers: Upload documents, view own credentials
  - Regulators: Review documents, issue credentials
  - Employers: Create contracts, record payments
- **Row-Level Security**: Database-level access control
- **JWT Authentication**: Stateless session management

### 3. Data Privacy
- **Off-Chain Storage**: Sensitive documents stored on IPFS
- **On-Chain Metadata**: Only hashes and proofs on blockchain
- **Encrypted Storage**: Private keys encrypted at rest
- **Content Addressing**: IPFS CID-based integrity verification

### 4. Network Security
- **Private Blockchain**: Isolated Besu network for sensitive operations
- **Public Anchoring**: Transparency through public blockchain
- **CORS Configuration**: Controlled cross-origin access
- **Rate Limiting**: API endpoint protection

## Technology Stack

### Blockchain Technologies
- **Hyperledger Besu**: Private blockchain infrastructure
- **Ethereum**: Public blockchain for anchoring
- **Solidity**: Smart contract programming language
- **Hardhat**: Development and testing framework

### Backend Technologies
- **Node.js**: Runtime environment
- **TypeScript**: Type-safe programming
- **Express.js**: Web application framework
- **Ethers.js**: Blockchain interaction library

### Identity & Credentials
- **Veramo**: DID and VC framework
- **W3C DIDs**: Decentralized identifier standard
- **W3C VCs**: Verifiable credentials standard
- **ERC-1056**: Ethereum DID registry standard

### Storage Technologies
- **IPFS**: Decentralized file storage
- **Supabase**: PostgreSQL database service
- **SQLite**: Local Veramo data storage

### DevOps & Infrastructure
- **Docker**: Containerization
- **Docker Compose**: Multi-service orchestration
- **Git**: Version control
- **npm**: Package management

## API Endpoints Reference

### Authentication Endpoints
```
POST /api/auth/register - User registration
POST /api/auth/login - User authentication
GET /api/auth/profile - Get user profile
PUT /api/auth/profile - Update user profile
```

### Document Management
```
POST /api/worker/documents - Upload document for verification
GET /api/worker/documents - Get user's documents
GET /api/regulator/documents/pending - Get pending documents
POST /api/regulator/issue-credential - Issue verifiable credential
POST /api/regulator/reject-document - Reject document
```

### Blockchain Operations
```
GET /api/blockchain/status - Service health check
POST /api/blockchain/credentials/issue - Issue credential on-chain
GET /api/blockchain/credentials/:id - Get credential details
PUT /api/blockchain/credentials/:id/status - Update credential status
GET /api/blockchain/events/:contract/:event - Query blockchain events
```

### Public Verification
```
GET /api/credentials/verify/:jwt - Verify credential authenticity
GET /api/public/anchor/:batchId - Verify anchored data
```

## Deployment Architecture

### Development Environment
```
Local Services:
- Besu Node: localhost:8545
- IPFS Node: localhost:5001
- API Server: localhost:3001
- Database: Supabase cloud
```

### Production Considerations
- **Load Balancing**: Multiple API server instances
- **Database Scaling**: Read replicas and connection pooling
- **IPFS Clustering**: Multiple IPFS nodes for redundancy
- **Monitoring**: Blockchain event monitoring and alerting
- **Backup**: Regular database and key backups

## Performance Characteristics

### Blockchain Performance
- **Block Time**: 5 seconds (Besu)
- **Transaction Throughput**: ~200 TPS (Besu)
- **Gas Costs**: Minimal (private network)
- **Finality**: Immediate (PoA consensus)

### Storage Performance
- **IPFS Upload**: ~1-5 seconds per file
- **Database Queries**: <100ms typical
- **Credential Verification**: <500ms
- **Cross-Chain Anchoring**: ~15 seconds (Sepolia)

## Scalability Considerations

### Horizontal Scaling
- **API Layer**: Stateless design enables load balancing
- **Database**: Supabase auto-scaling
- **IPFS**: Distributed storage network
- **Blockchain**: Private network can be scaled

### Vertical Scaling
- **Memory**: Veramo agent and blockchain connections
- **CPU**: Cryptographic operations and Merkle tree generation
- **Storage**: IPFS data and database growth
- **Network**: Cross-chain communication bandwidth

## Future Enhancements

### Technical Improvements
- **Zero-Knowledge Proofs**: Selective disclosure capabilities
- **Mobile SDK**: Native mobile application support
- **Advanced Analytics**: Blockchain data analysis
- **Multi-Chain Support**: Additional blockchain networks

### Feature Enhancements
- **Batch Processing**: Multiple document uploads
- **AI Verification**: Automated document validation
- **Credential Templates**: Customizable credential schemas
- **Revocation Registry**: Credential revocation support

## Conclusion

SafePass represents a comprehensive solution for decentralized identity and credential management, combining the security of blockchain technology with the usability of traditional web services. The architecture provides:

- **Security**: Cryptographic proofs and decentralized storage
- **Scalability**: Modular design and horizontal scaling capabilities
- **Interoperability**: W3C standards and cross-chain compatibility
- **Usability**: RESTful APIs and familiar web technologies
- **Transparency**: Public verifiability through blockchain anchoring

This technical architecture serves as the foundation for a robust, secure, and scalable credential management platform suitable for enterprise deployment and regulatory compliance.
