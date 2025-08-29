# Phase 6: Intelligence, Incentives, and Privacy

## Overview

Phase 6 introduces advanced features to the SafePass system, focusing on three key areas:

1. **Intelligence**: Dynamic trust scoring system for recruitment agencies
2. **Incentives**: Automated reward/penalty system based on performance
3. **Privacy**: Zero-Knowledge Proof (ZKP) system for license verification

## Features Implemented

### 🔢 Dynamic Trust Score System

A comprehensive reputation system that automatically tracks and scores recruitment agencies based on their performance.

#### Key Components:
- **AgencyRegistry Smart Contract**: On-chain registry with trust scores
- **Trust Score Service**: Automated calculation engine with configurable parameters
- **Event-Driven Updates**: Real-time score adjustments based on contract outcomes
- **Historical Tracking**: Complete audit trail of score changes

#### Trust Score Formula:
```
NewScore = OldScore + (α × SuccessfulPlacements) - (β × VerifiedComplaints)
```

Where:
- α (Alpha) = Points added per successful placement (default: 1.0)
- β (Beta) = Points deducted per verified complaint (default: 10.0)
- Scores are scaled by 10 for precision (1000 = 100.0 display score)

### 🔐 Zero-Knowledge Proof (ZKP) System

Privacy-preserving license verification system that allows agencies to prove license validity without revealing sensitive information.

#### Key Components:
- **ZKP Service**: Proof generation and verification
- **Merkle Tree Management**: Efficient license registry
- **Circuit-Based Proofs**: Cryptographic proof system
- **Public Verification**: Anyone can verify proofs without accessing private data

#### ZKP Workflow:
1. **Regulator**: Creates Merkle tree of valid license numbers
2. **Agency**: Generates proof of license membership
3. **Public**: Verifies proof without seeing actual license number

## Database Schema Extensions

### New Tables Added:

#### `agency_trust_scores`
Stores historical trust score data with calculation details.

#### `trust_score_events`
Audit trail of all events affecting trust scores.

#### `trust_score_config`
Configurable parameters for trust score calculations.

#### `zkp_license_proofs`
Storage for generated ZKP proofs.

#### `zkp_verification_keys`
Cryptographic keys for proof verification.

#### `zkp_merkle_trees`
Merkle tree data for license verification.

#### `employment_contract_outcomes`
Contract completion data for trust score calculations.

## API Endpoints

### Trust Score Endpoints

#### Public Endpoints:
- `GET /api/trust-scores/agencies/:address` - Get agency trust score
- `GET /api/trust-scores/statistics` - Get system-wide statistics
- `GET /api/trust-scores/top-agencies` - Get top-rated agencies

#### Regulator-Only Endpoints:
- `POST /api/trust-scores/calculate` - Trigger manual calculation
- `POST /api/trust-scores/events` - Record trust score events

### ZKP Endpoints

#### Public Endpoints:
- `POST /api/zkp/verify-license-proof` - Verify a ZKP proof
- `GET /api/zkp/verification-key` - Get public verification key
- `GET /api/zkp/current-merkle-root` - Get current license registry root

#### Agency Endpoints:
- `POST /api/zkp/generate-license-proof` - Generate license proof
- `GET /api/zkp/my-proofs` - View agency's proofs

#### Regulator Endpoints:
- `POST /api/zkp/create-merkle-tree` - Create license registry
- `POST /api/zkp/store-verification-key` - Store cryptographic keys

## Installation & Setup

### 1. Install Dependencies

```bash
npm install node-cron snarkjs merkletreejs
npm install --save-dev @types/node-cron
```

### 2. Database Setup

Run the Phase 6 database schema:

```bash
# Apply the schema to your Supabase database
psql -h your-supabase-host -U postgres -d postgres -f phase6-database-schema.sql
```

### 3. Deploy Smart Contracts

```bash
# Compile contracts
npm run compile

# Deploy AgencyRegistry
node scripts/deployAgencyRegistry.js

# Update your .env file with the contract address
echo "AGENCY_REGISTRY_ADDRESS=<deployed_address>" >> .env
```

### 4. Environment Variables

Add these to your `.env` file:

```env
# Trust Score Configuration
TRUST_SCORE_ALPHA_FACTOR=1.0
TRUST_SCORE_BETA_FACTOR=10.0
TRUST_SCORE_CALCULATION_SCHEDULE="0 0 * * *"

# ZKP Configuration (optional - defaults provided)
ZKP_CIRCUIT_PATH="./zkp/circuits"
ZKP_BUILD_PATH="./zkp/build"
ZKP_KEYS_PATH="./zkp/keys"

# Agency Registry Contract
AGENCY_REGISTRY_ADDRESS=<your_deployed_address>
```

## Usage Examples

### 1. Trust Score Management

#### Register an Agency (Regulator):
```javascript
// Register agency on blockchain
const tx = await agencyRegistry.registerAgency(
  "0x1234...", // agency address
  "ABC Recruitment", // agency name
  "did:ethr:besu:0x1234..." // agency DID
);
```

#### Record Trust Score Event:
```bash
curl -X POST http://localhost:3001/api/trust-scores/events \
  -H "Authorization: Bearer <regulator_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "agency_address": "did:ethr:besu:0x1234...",
    "event_type": "successful_placement",
    "impact_score": 10,
    "event_data": {"contract_id": "contract_123"}
  }'
```

#### Get Agency Trust Score:
```bash
curl http://localhost:3001/api/trust-scores/agencies/did:ethr:besu:0x1234...
```

### 2. ZKP License Verification

#### Create License Registry (Regulator):
```bash
curl -X POST http://localhost:3001/api/zkp/create-merkle-tree \
  -H "Authorization: Bearer <regulator_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "license_numbers": ["LICENSE001", "LICENSE002", "LICENSE003"]
  }'
```

#### Generate License Proof (Agency):
```bash
curl -X POST http://localhost:3001/api/zkp/generate-license-proof \
  -H "Authorization: Bearer <agency_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "license_number": "LICENSE001"
  }'
```

#### Verify Proof (Public):
```bash
curl -X POST http://localhost:3001/api/zkp/verify-license-proof \
  -H "Content-Type: application/json" \
  -d '{
    "proof": {...},
    "publicSignals": [...]
  }'
```

## Testing

### Run Phase 6 Tests

```bash
# Start the services
npm run start:all
npm run api:dev

# Run comprehensive tests
node test-phase6.js
```

### Test Coverage

The test suite covers:
- ✅ Trust score calculation and updates
- ✅ ZKP proof generation and verification
- ✅ Merkle tree management
- ✅ API endpoint functionality
- ✅ Integration workflows
- ✅ Role-based access control

## Integration with Existing System

### Employment Contract Integration

The trust score system automatically monitors `EmploymentContract` events:

- **Contract Completion** → Successful placement (+1 point)
- **Dispute Resolution** → Verified complaint (-10 points)
- **Contract Cancellation** → Neutral (no score change)

### DID System Integration

- Trust scores are linked to agency DIDs
- ZKP proofs reference agency identities
- Maintains compatibility with existing identity system

### Blockchain Service Integration

- AgencyRegistry contract integrated with existing blockchain service
- Automatic contract registration and method calls
- Event listening for real-time updates

## Security Considerations

### Trust Score Security

- Only regulators can update trust scores
- All score changes are logged and auditable
- Configurable parameters prevent manipulation
- Blockchain storage ensures immutability

### ZKP Security

- Private license numbers never exposed
- Cryptographic proofs ensure validity
- Public verification without data leakage
- Secure key management for circuits

### Access Control

- Role-based API access (Worker, AgencyAdmin, Regulator)
- JWT token authentication
- Row-level security in database
- Input validation and sanitization

## Performance Considerations

### Trust Score Performance

- Scheduled calculations (default: daily)
- Efficient database queries with indexes
- Configurable calculation frequency
- Event-driven updates for real-time scoring

### ZKP Performance

- Merkle tree optimization for large license sets
- Efficient proof generation and verification
- Cached verification keys
- Optimized circuit design

## Monitoring & Maintenance

### Trust Score Monitoring

- Automated calculation scheduling
- Event emission for score changes
- Error handling and retry logic
- Performance metrics tracking

### ZKP Monitoring

- Proof generation success rates
- Verification performance metrics
- Merkle tree update tracking
- Key rotation management

## Future Enhancements

### Planned Features

1. **Advanced Analytics**: Trust score trends and predictions
2. **Multi-Factor Scoring**: Additional performance metrics
3. **ZKP Circuit Upgrades**: More complex verification logic
4. **Mobile Integration**: Native mobile app support
5. **Cross-Chain ZKP**: Multi-blockchain proof verification

### Scalability Improvements

1. **Batch Processing**: Multiple proof generation
2. **Caching Layer**: Redis for frequently accessed data
3. **Database Optimization**: Query performance improvements
4. **Load Balancing**: Horizontal scaling support

## Troubleshooting

### Common Issues

#### Trust Score Not Updating
- Check if trust score service is running
- Verify database connectivity
- Ensure events are being recorded
- Check configuration parameters

#### ZKP Proof Generation Fails
- Verify Merkle tree exists and is current
- Check license number is in registry
- Ensure circuit files are accessible
- Validate proving key availability

#### API Authentication Issues
- Verify JWT token validity
- Check user role permissions
- Ensure proper Authorization header
- Validate API endpoint access

### Debug Commands

```bash
# Check trust score service status
curl http://localhost:3001/api/trust-scores/statistics

# Verify ZKP system status
curl http://localhost:3001/api/zkp/current-merkle-root

# Test API health
curl http://localhost:3001/health

# Check blockchain connectivity
curl http://localhost:3001/api/blockchain/status
```

## Support

For technical support or questions about Phase 6 implementation:

1. Check the troubleshooting section above
2. Review the test suite for usage examples
3. Examine the API endpoint documentation
4. Consult the database schema for data structure

## Conclusion

Phase 6 successfully introduces advanced intelligence, incentive, and privacy features to the SafePass system while maintaining full compatibility with existing functionality. The implementation provides a solid foundation for future enhancements and scalability improvements.
