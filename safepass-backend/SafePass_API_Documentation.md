# SafePass API Documentation for Frontend Integration

## Overview
This document provides complete API documentation for the SafePass system, including all endpoints, request/response formats, authentication requirements, and integration guidelines for frontend developers.

## Base Configuration
- **Base URL**: `http://localhost:3001`
- **API Version**: v1
- **Authentication**: JWT Bearer Token
- **Content-Type**: `application/json` (unless specified otherwise)

## Authentication Flow

### JWT Token Usage
After successful login, include the JWT token in the Authorization header for protected endpoints:
```
Authorization: Bearer <jwt_token>
```

### Token Storage
Store the JWT token securely (localStorage, sessionStorage, or secure cookies) and include it in API requests.

---

## API Endpoints

### 1. Health Check

#### Check API Status
- **Endpoint**: `GET /health`
- **Authentication**: None
- **Headers**: None
- **Body**: None
- **Response**:
```json
{
  "status": "OK",
  "timestamp": "2025-01-01T00:00:00.000Z",
  "service": "SafePass API Gateway"
}
```

---

## 2. Authentication Endpoints

### 2.1 User Registration
- **Endpoint**: `POST /api/auth/register`
- **Authentication**: None
- **Headers**:
```json
{
  "Content-Type": "application/json"
}
```
- **Body**:
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "role": "Worker"
}
```
- **Role Options**: `"Worker"`, `"AgencyAdmin"`, `"Regulator"`
- **Success Response (201)**:
```json
{
  "message": "User created successfully",
  "user": {
    "id": "uuid",
    "email": "john@example.com",
    "name": "John Doe",
    "role": "Worker",
    "did": "did:ethr:0x...",
    "created_at": "2025-01-01T00:00:00.000Z"
  }
}
```
- **Error Response (400)**:
```json
{
  "error": "All fields are required: name, email, password, role"
}
```

### 2.2 User Login
- **Endpoint**: `POST /api/auth/login`
- **Authentication**: None
- **Headers**:
```json
{
  "Content-Type": "application/json"
}
```
- **Body**:
```json
{
  "email": "john@example.com",
  "password": "password123"
}
```
- **Success Response (200)**:
```json
{
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid",
    "email": "john@example.com",
    "name": "John Doe",
    "role": "Worker",
    "did": "did:ethr:0x..."
  }
}
```
- **Error Response (401)**:
```json
{
  "error": "Invalid email or password"
}
```

### 2.3 Get Current User Profile
- **Endpoint**: `GET /api/auth/me`
- **Authentication**: Required (JWT)
- **Headers**:
```json
{
  "Authorization": "Bearer <jwt_token>"
}
```
- **Body**: None
- **Success Response (200)**:
```json
{
  "user": {
    "id": "uuid",
    "email": "john@example.com",
    "name": "John Doe",
    "role": "Worker",
    "did": "did:ethr:0x...",
    "created_at": "2025-01-01T00:00:00.000Z"
  }
}
```

---

## 3. User Management Endpoints

### 3.1 Get All Users (Admin/Regulator Only)
- **Endpoint**: `GET /api/users`
- **Authentication**: Required (JWT) - AgencyAdmin or Regulator only
- **Headers**:
```json
{
  "Authorization": "Bearer <jwt_token>"
}
```
- **Body**: None
- **Success Response (200)**:
```json
{
  "users": [
    {
      "id": "uuid",
      "email": "user@example.com",
      "name": "User Name",
      "role": "Worker",
      "did": "did:ethr:0x...",
      "created_at": "2025-01-01T00:00:00.000Z"
    }
  ],
  "total": 1
}
```

### 3.2 Get All Workers (Admin/Regulator Only)
- **Endpoint**: `GET /api/users/workers`
- **Authentication**: Required (JWT) - AgencyAdmin or Regulator only
- **Headers**:
```json
{
  "Authorization": "Bearer <jwt_token>"
}
```
- **Body**: None
- **Success Response (200)**:
```json
{
  "workers": [
    {
      "id": "uuid",
      "email": "worker@example.com",
      "name": "Worker Name",
      "role": "Worker",
      "did": "did:ethr:0x...",
      "created_at": "2025-01-01T00:00:00.000Z"
    }
  ],
  "total": 1
}
```

### 3.3 Get User by ID
- **Endpoint**: `GET /api/users/:id`
- **Authentication**: Required (JWT) - Own profile or Admin/Regulator
- **Headers**:
```json
{
  "Authorization": "Bearer <jwt_token>"
}
```
- **Body**: None
- **URL Parameters**: `id` - User UUID
- **Success Response (200)**:
```json
{
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "User Name",
    "role": "Worker",
    "did": "did:ethr:0x...",
    "created_at": "2025-01-01T00:00:00.000Z"
  }
}
```

### 3.4 Get User Statistics (Admin/Regulator Only)
- **Endpoint**: `GET /api/users/stats/overview`
- **Authentication**: Required (JWT) - AgencyAdmin or Regulator only
- **Headers**:
```json
{
  "Authorization": "Bearer <jwt_token>"
}
```
- **Body**: None
- **Success Response (200)**:
```json
{
  "totalUsers": 100,
  "roleBreakdown": {
    "workers": 80,
    "agencyAdmins": 15,
    "regulators": 5
  },
  "statistics": {
    "Worker": 80,
    "AgencyAdmin": 15,
    "Regulator": 5
  }
}
```

---

## 4. Document Management Endpoints

### 4.1 Upload Document (Worker Only)
- **Endpoint**: `POST /api/worker/documents`
- **Authentication**: Required (JWT) - Worker only
- **Headers**:
```json
{
  "Authorization": "Bearer <jwt_token>",
  "Content-Type": "multipart/form-data"
}
```
- **Body**: Form Data
  - `file`: Document file (PDF, JPEG, PNG, GIF - max 10MB)
  - `documentType`: String - One of: `"Passport"`, `"NID"`, `"TrainingCertificate"`, `"EducationCertificate"`, `"SkillsCertificate"`, `"WorkPermit"`
- **Success Response (202)**:
```json
{
  "message": "Document uploaded successfully and is awaiting verification.",
  "data": {
    "id": "uuid",
    "documentType": "Passport",
    "ipfsCid": "QmXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
    "status": "PendingVerification",
    "createdAt": "2025-01-01T00:00:00.000Z"
  }
}
```
- **Error Response (400)**:
```json
{
  "error": "Invalid file type. Only images (JPEG, PNG, GIF) and PDF files are allowed."
}
```

### 4.2 Get Worker's Documents (Worker Only)
- **Endpoint**: `GET /api/worker/documents`
- **Authentication**: Required (JWT) - Worker only
- **Headers**:
```json
{
  "Authorization": "Bearer <jwt_token>"
}
```
- **Body**: None
- **Success Response (200)**:
```json
{
  "message": "Documents retrieved successfully.",
  "data": [
    {
      "id": "uuid",
      "documentType": "Passport",
      "ipfsCid": "QmXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
      "status": "PendingVerification",
      "createdAt": "2025-01-01T00:00:00.000Z",
      "reviewedAt": null,
      "reviewerNotes": null
    }
  ]
}
```

### 4.3 Get Pending Documents for Review (Regulator Only)
- **Endpoint**: `GET /api/regulator/documents/pending`
- **Authentication**: Required (JWT) - Regulator only
- **Headers**:
```json
{
  "Authorization": "Bearer <jwt_token>"
}
```
- **Body**: None
- **Success Response (200)**:
```json
{
  "message": "Pending documents retrieved successfully.",
  "data": [
    {
      "id": "uuid",
      "documentType": "Passport",
      "ipfsCid": "QmXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
      "status": "PendingVerification",
      "createdAt": "2025-01-01T00:00:00.000Z",
      "worker": {
        "id": "uuid",
        "name": "Worker Name",
        "email": "worker@example.com",
        "did": "did:ethr:0x..."
      }
    }
  ]
}
```

---

## 5. Credential Management Endpoints

### 5.1 Issue Verifiable Credential (Regulator Only)
- **Endpoint**: `POST /api/regulator/issue-credential`
- **Authentication**: Required (JWT) - Regulator only
- **Headers**:
```json
{
  "Authorization": "Bearer <jwt_token>",
  "Content-Type": "application/json"
}
```
- **Body**:
```json
{
  "documentUploadId": "uuid",
  "holderDid": "did:ethr:0x...",
  "claims": {
    "degree": "Bachelor of Science",
    "institution": "University Name",
    "graduationYear": "2020"
  }
}
```
- **Success Response (201)**:
```json
{
  "message": "Verifiable credential issued successfully.",
  "data": {
    "credentialId": "uuid",
    "holderDid": "did:ethr:0x...",
    "issuerDid": "did:ethr:0x...",
    "type": "VerifiedEducationCredential",
    "issuanceDate": "2025-01-01T00:00:00.000Z",
    "jwt": "eyJhbGciOiJFUzI1NksiLCJ0eXAiOiJKV1QifQ..."
  }
}
```

### 5.2 Reject Document (Regulator Only)
- **Endpoint**: `POST /api/regulator/reject-document`
- **Authentication**: Required (JWT) - Regulator only
- **Headers**:
```json
{
  "Authorization": "Bearer <jwt_token>",
  "Content-Type": "application/json"
}
```
- **Body**:
```json
{
  "documentUploadId": "uuid",
  "reviewerNotes": "Document quality is insufficient for verification"
}
```
- **Success Response (200)**:
```json
{
  "message": "Document rejected successfully.",
  "data": {
    "id": "uuid",
    "status": "Rejected",
    "reviewedAt": "2025-01-01T00:00:00.000Z",
    "reviewerNotes": "Document quality is insufficient for verification"
  }
}
```

### 5.3 Get Worker's Credentials (Worker Only)
- **Endpoint**: `GET /api/worker/me/credentials`
- **Authentication**: Required (JWT) - Worker only
- **Headers**:
```json
{
  "Authorization": "Bearer <jwt_token>"
}
```
- **Body**: None
- **Success Response (200)**:
```json
{
  "message": "Credentials retrieved successfully.",
  "data": [
    {
      "id": "uuid",
      "type": "VerifiedEducationCredential",
      "issuanceDate": "2025-01-01T00:00:00.000Z",
      "issuerDid": "did:ethr:0x...",
      "jwt": "eyJhbGciOiJFUzI1NksiLCJ0eXAiOiJKV1QifQ...",
      "sourceDocument": {
        "type": "EducationCertificate",
        "ipfsCid": "QmXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
        "uploadedAt": "2025-01-01T00:00:00.000Z"
      }
    }
  ]
}
```

### 5.4 Verify Credential (Public)
- **Endpoint**: `GET /api/credentials/verify/:jwt`
- **Authentication**: None
- **Headers**: None
- **Body**: None
- **URL Parameters**: `jwt` - The JWT credential token
- **Success Response (200)**:
```json
{
  "message": "Credential verification completed.",
  "data": {
    "verified": true,
    "issuer": "did:ethr:0x...",
    "credentialSubject": {
      "id": "did:ethr:0x...",
      "documentType": "EducationCertificate",
      "degree": "Bachelor of Science",
      "institution": "University Name"
    },
    "issuanceDate": "2025-01-01T00:00:00.000Z",
    "type": ["VerifiableCredential", "VerifiedEducationCredential"]
  }
}
```

---

## 6. Blockchain Endpoints

### 6.1 Get Blockchain Status
- **Endpoint**: `GET /api/blockchain/status`
- **Authentication**: None
- **Headers**: None
- **Body**: None
- **Success Response (200)**:
```json
{
  "status": "connected",
  "walletAddress": "0x...",
  "balance": "1.5 ETH",
  "currentBlock": 12345,
  "registeredContracts": ["EmploymentContract", "DIDRegistry"]
}
```

### 6.2 Issue Credential on Blockchain
- **Endpoint**: `POST /api/blockchain/credentials/issue`
- **Authentication**: None
- **Headers**:
```json
{
  "Content-Type": "application/json"
}
```
- **Body**:
```json
{
  "action": "signContract"
}
```
- **Success Response (200)**:
```json
{
  "success": true,
  "transactionHash": "0x...",
  "action": "signContract",
  "message": "Contract signed successfully on blockchain"
}
```

### 6.3 Update Credential Status
- **Endpoint**: `PUT /api/blockchain/credentials/:credentialId/status`
- **Authentication**: Required (JWT)
- **Headers**:
```json
{
  "Authorization": "Bearer <jwt_token>",
  "Content-Type": "application/json"
}
```
- **Body**:
```json
{
  "status": "active"
}
```
- **URL Parameters**: `credentialId` - Credential identifier
- **Success Response (200)**:
```json
{
  "success": true,
  "transactionHash": "0x...",
  "credentialId": "credential_id",
  "newStatus": "active",
  "message": "Credential status updated successfully"
}
```

### 6.4 Get Credential Information
- **Endpoint**: `GET /api/blockchain/credentials/:credentialId`
- **Authentication**: None
- **Headers**: None
- **Body**: None
- **URL Parameters**: `credentialId` - Credential identifier
- **Success Response (200)**:
```json
{
  "credentialId": "credential_id",
  "status": "active",
  "issuer": "0x...",
  "holder": "0x...",
  "issuanceDate": "2025-01-01T00:00:00.000Z"
}
```

### 6.5 Get Worker Credentials
- **Endpoint**: `GET /api/blockchain/workers/:workerDid/credentials`
- **Authentication**: None
- **Headers**: None
- **Body**: None
- **URL Parameters**: `workerDid` - Worker's DID
- **Success Response (200)**:
```json
{
  "workerDid": "did:ethr:0x...",
  "credentials": [
    {
      "id": "credential_id",
      "type": "EducationCredential",
      "status": "active",
      "issuanceDate": "2025-01-01T00:00:00.000Z"
    }
  ]
}
```

### 6.6 Get Contract Events
- **Endpoint**: `GET /api/blockchain/events/:contractName/:eventName`
- **Authentication**: None
- **Headers**: None
- **Body**: None
- **URL Parameters**: 
  - `contractName` - Name of the contract
  - `eventName` - Name of the event
- **Query Parameters**: 
  - `fromBlock` (optional) - Starting block number
  - `toBlock` (optional) - Ending block number
- **Success Response (200)**:
```json
{
  "contractName": "EmploymentContract",
  "eventName": "CredentialIssued",
  "fromBlock": 0,
  "toBlock": "latest",
  "events": [
    {
      "blockNumber": "12345",
      "transactionHash": "0x...",
      "args": {
        "credentialId": "credential_id",
        "holder": "0x..."
      },
      "topics": ["0x..."]
    }
  ]
}
```

### 6.7 Register Contract
- **Endpoint**: `POST /api/blockchain/contracts/register`
- **Authentication**: Required (JWT)
- **Headers**:
```json
{
  "Authorization": "Bearer <jwt_token>",
  "Content-Type": "application/json"
}
```
- **Body**:
```json
{
  "name": "MyContract",
  "address": "0x...",
  "abi": [...]
}
```
- **Success Response (200)**:
```json
{
  "success": true,
  "message": "Contract MyContract registered successfully",
  "address": "0x..."
}
```

### 6.8 Deploy Contract
- **Endpoint**: `POST /api/blockchain/contracts/deploy`
- **Authentication**: Required (JWT)
- **Headers**:
```json
{
  "Authorization": "Bearer <jwt_token>",
  "Content-Type": "application/json"
}
```
- **Body**:
```json
{
  "name": "MyContract",
  "abi": [...],
  "bytecode": "0x...",
  "constructorArgs": []
}
```
- **Success Response (200)**:
```json
{
  "success": true,
  "message": "Contract MyContract deployed successfully",
  "address": "0x...",
  "constructorArgs": []
}
```

---

## 7. Trust Score Endpoints

### 7.1 Get Agency Trust Score
- **Endpoint**: `GET /api/trust-scores/agencies/:address`
- **Authentication**: None
- **Headers**: None
- **Body**: None
- **URL Parameters**: `address` - Agency blockchain address
- **Success Response (200)**:
```json
{
  "agency_address": "0x...",
  "trust_score": 85,
  "trust_score_display": "8.5",
  "timestamp": "2025-01-01T00:00:00.000Z"
}
```

### 7.2 Get Trust Score Statistics
- **Endpoint**: `GET /api/trust-scores/statistics`
- **Authentication**: None
- **Headers**: None
- **Body**: None
- **Success Response (200)**:
```json
{
  "total_agencies": 50,
  "average_score": "7.5",
  "min_score": "3.2",
  "max_score": "9.8",
  "median_score": "7.8"
}
```

### 7.3 Get Top Agencies
- **Endpoint**: `GET /api/trust-scores/top-agencies`
- **Authentication**: None
- **Headers**: None
- **Body**: None
- **Query Parameters**: `limit` (optional, default: 10, max: 100)
- **Success Response (200)**:
```json
{
  "agencies": [
    {
      "agency_address": "0x...",
      "trust_score": 95,
      "trust_score_display": "9.5",
      "agency_name": "Top Agency Ltd"
    }
  ],
  "count": 10,
  "timestamp": "2025-01-01T00:00:00.000Z"
}
```

### 7.4 Calculate Trust Scores (Regulator Only)
- **Endpoint**: `POST /api/trust-scores/calculate`
- **Authentication**: Required (JWT) - Regulator only
- **Headers**:
```json
{
  "Authorization": "Bearer <jwt_token>",
  "Content-Type": "application/json"
}
```
- **Body** (Optional - for specific agency):
```json
{
  "agency_address": "0x..."
}
```
- **Body** (Empty for all agencies):
```json
{}
```
- **Success Response (200)**:
```json
{
  "message": "Trust score calculated successfully",
  "agency_address": "0x...",
  "new_score": 85,
  "new_score_display": "8.5",
  "timestamp": "2025-01-01T00:00:00.000Z"
}
```

### 7.5 Record Trust Score Event (Regulator Only)
- **Endpoint**: `POST /api/trust-scores/events`
- **Authentication**: Required (JWT) - Regulator only
- **Headers**:
```json
{
  "Authorization": "Bearer <jwt_token>",
  "Content-Type": "application/json"
}
```
- **Body**:
```json
{
  "agency_address": "0x...",
  "event_type": "successful_placement",
  "impact_score": 10,
  "contract_address": "0x...",
  "employment_contract_id": "contract_id",
  "event_data": {
    "additional": "data"
  }
}
```
- **Event Types**: `"successful_placement"`, `"verified_complaint"`, `"manual_adjustment"`, `"initial_score"`
- **Success Response (200)**:
```json
{
  "message": "Trust score event recorded successfully",
  "event_type": "successful_placement",
  "agency_address": "0x...",
  "impact_score": 10,
  "timestamp": "2025-01-01T00:00:00.000Z"
}
```

### 7.6 Get Trust Score Events
- **Endpoint**: `GET /api/trust-scores/events/:agencyAddress`
- **Authentication**: None
- **Headers**: None
- **Body**: None
- **URL Parameters**: `agencyAddress` - Agency blockchain address
- **Query Parameters**: `limit` (optional, default: 50)
- **Success Response (200)**:
```json
{
  "agency_address": "0x...",
  "events": [],
  "message": "Event history endpoint - implementation pending"
}
```

---

## 8. Zero-Knowledge Proof (ZKP) Endpoints

### 8.1 Generate License Proof (Agency Admin Only)
- **Endpoint**: `POST /api/zkp/generate-license-proof`
- **Authentication**: Required (JWT) - AgencyAdmin only
- **Headers**:
```json
{
  "Authorization": "Bearer <jwt_token>",
  "Content-Type": "application/json"
}
```
- **Body**:
```json
{
  "license_number": "LIC123456"
}
```
- **Success Response (200)**:
```json
{
  "message": "License proof generated successfully",
  "proof": {
    "pi_a": ["...", "...", "1"],
    "pi_b": [["...", "..."], ["...", "..."], ["1", "0"]],
    "pi_c": ["...", "...", "1"]
  },
  "publicSignals": ["1"],
  "proofId": "uuid",
  "agency_id": "uuid",
  "timestamp": "2025-01-01T00:00:00.000Z"
}
```

### 8.2 Verify License Proof (Public)
- **Endpoint**: `POST /api/zkp/verify-license-proof`
- **Authentication**: None
- **Headers**:
```json
{
  "Content-Type": "application/json"
}
```
- **Body**:
```json
{
  "proof": {
    "pi_a": ["...", "...", "1"],
    "pi_b": [["...", "..."], ["...", "..."], ["1", "0"]],
    "pi_c": ["...", "...", "1"]
  },
  "publicSignals": ["1"]
}
```
- **Success Response (200)**:
```json
{
  "isValid": true,
  "message": "Proof is valid",
  "timestamp": "2025-01-01T00:00:00.000Z"
}
```

### 8.3 Get Agency's ZKP Proofs (Agency Admin Only)
- **Endpoint**: `GET /api/zkp/my-proofs`
- **Authentication**: Required (JWT) - AgencyAdmin only
- **Headers**:
```json
{
  "Authorization": "Bearer <jwt_token>"
}
```
- **Body**: None
- **Success Response (200)**:
```json
{
  "proofs": [
    {
      "id": "uuid",
      "circuit_type": "license_verification",
      "is_valid": true,
      "verified_at": "2025-01-01T00:00:00.000Z",
      "expires_at": "2025-12-31T23:59:59.000Z",
      "created_at": "2025-01-01T00:00:00.000Z"
    }
  ],
  "count": 1,
  "agency_id": "uuid",
  "timestamp": "2025-01-01T00:00:00.000Z"
}
```

### 8.4 Update Valid Licenses (Regulator Only)
- **Endpoint**: `POST /api/zkp/update-valid-licenses`
- **Authentication**: Required (JWT) - Regulator only
- **Headers**:
```json
{
  "Authorization": "Bearer <jwt_token>",
  "Content-Type": "application/json"
}
```
- **Body**:
```json
{
  "license_numbers": ["LIC123456", "LIC789012", "LIC345678"]
}
```
- **Success Response (200)**:
```json
{
  "message": "Valid licenses updated successfully",
  "license_count": 3,
  "updated_by": "uuid",
  "timestamp": "2025-01-01T00:00:00.000Z"
}
```

### 8.5 Get Valid Licenses (Public)
- **Endpoint**: `GET /api/zkp/valid-licenses`
- **Authentication**: None
- **Headers**: None
- **Body**: None
- **Success Response (200)**:
```json
{
  "valid_licenses": ["LIC123456", "LIC789012", "LIC345678"],
  "count": 3,
  "timestamp": "2025-01-01T00:00:00.000Z"
}
```

### 8.6 Validate Proof Exists (Public)
- **Endpoint**: `GET /api/zkp/proof/:proofId/validate`
- **Authentication**: None
- **Headers**: None
- **Body**: None
- **URL Parameters**: `proofId` - Proof identifier
- **Success Response (200)**:
```json
{
  "proof_id": "uuid",
  "exists": true,
  "is_valid": true,
  "timestamp": "2025-01-01T00:00:00.000Z"
}
```

### 8.7 Initialize ZKP System (Regulator Only)
- **Endpoint**: `POST /api/zkp/initialize`
- **Authentication**: Required (JWT) - Regulator only
- **Headers**:
```json
{
  "Authorization": "Bearer <jwt_token>"
}
```
- **Body**: None
- **Success Response (200)**:
```json
{
  "message": "ZKP system initialized successfully",
  "initialized_by": "uuid",
  "timestamp": "2025-01-01T00:00:00.000Z"
}
```

### 8.8 Check ZKP System Status (Public)
- **Endpoint**: `GET /api/zkp/system-status`
- **Authentication**: None
- **Headers**: None
- **Body**: None
- **Success Response (200)**:
```json
{
  "system_ready": true,
  "message": "ZKP system is ready",
  "timestamp": "2025-01-01T00:00:00.000Z"
}
```

---

## Error Handling

### Common Error Responses

#### 400 Bad Request
```json
{
  "error": "Validation error message"
}
```

#### 401 Unauthorized
```json
{
  "error": "Authentication required"
}
```

#### 403 Forbidden
```json
{
  "error": "Access denied. Insufficient permissions."
}
```

#### 404 Not Found
```json
{
  "error": "Resource not found"
}
```

#### 500 Internal Server Error
```json
{
  "error": "Internal server error",
  "message": "Detailed error message (in development mode)"
}
```

#### 503 Service Unavailable
```json
{
  "error": "Service temporarily unavailable",
  "details": "IPFS service is not available. Please ensure IPFS node is running."
}
```

---

## Frontend Integration Guidelines

### 1. Authentication Flow
1. **Registration**: Use `/api/auth/register` to create new users
2. **Login**: Use `/api/auth/login` to authenticate and receive JWT token
3. **Token Storage**: Store JWT securely in localStorage/sessionStorage
4. **Token Refresh**: Implement token refresh logic (tokens expire in 24 hours)
5. **Logout**: Clear stored tokens and redirect to login

### 2. Role-Based Access Control
Implement frontend route guards based on user roles:

- **Worker**: Can access document upload, view own documents and credentials
- **AgencyAdmin**: Can generate ZKP proofs, view own proofs
- **Regulator**: Can issue/reject credentials, manage trust scores, update valid licenses
- **Public**: Can verify credentials and view trust scores

### 3. File Upload Implementation
For document uploads (`/api/worker/documents`):

```javascript
const uploadDocument = async (file, documentType, token) => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('documentType', documentType);
  
  const response = await fetch('/api/worker/documents', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`
    },
    body: formData
  });
  
  return response.json();
};
```

### 4. Error Handling Best Practices
Implement consistent error handling:

```javascript
const handleApiError = (error, response) => {
  if (response.status === 401) {
    // Token expired or invalid - redirect to login
    localStorage.removeItem('jwt_token');
    window.location.href = '/login';
  } else if (response.status === 403) {
    // Insufficient permissions
    showErrorMessage('Access denied. You do not have permission to perform this action.');
  } else if (response.status >= 500) {
    // Server error
    showErrorMessage('Server error. Please try again later.');
  } else {
    // Other errors
    showErrorMessage(error.error || 'An unexpected error occurred.');
  }
};
```

### 5. API Client Implementation Example

```javascript
class SafePassAPI {
  constructor(baseURL = 'http://localhost:3001') {
    this.baseURL = baseURL;
    this.token = localStorage.getItem('jwt_token');
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    if (this.token && !options.skipAuth) {
      config.headers.Authorization = `Bearer ${this.token}`;
    }

    const response = await fetch(url, config);
    const data = await response.json();

    if (!response.ok) {
      throw { status: response.status, ...data };
    }

    return data;
  }

  // Authentication methods
  async register(userData) {
    return this.request('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
      skipAuth: true,
    });
  }

  async login(credentials) {
    const data = await this.request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
      skipAuth: true,
    });
    
    if (data.token) {
      this.token = data.token;
      localStorage.setItem('jwt_token', data.token);
    }
    
    return data;
  }

  async getCurrentUser() {
    return this.request('/api/auth/me');
  }

  // Document methods
  async uploadDocument(file, documentType) {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('documentType', documentType);

    return this.request('/api/worker/documents', {
      method: 'POST',
      headers: {}, // Remove Content-Type to let browser set it for FormData
      body: formData,
    });
  }

  async getWorkerDocuments() {
    return this.request('/api/worker/documents');
  }

  // Add more methods as needed...
}
```

### 6. State Management Recommendations
Consider using a state management solution (Redux, Zustand, Context API) to manage:

- User authentication state
- User profile information
- Document upload status
- Error states
- Loading states

### 7. Security Considerations
- Always validate user roles on the frontend before showing UI elements
- Implement CSRF protection if using cookies
- Use HTTPS in production
- Sanitize user inputs before sending to API
- Implement rate limiting on the frontend for API calls

### 8. Testing Recommendations
- Test all API endpoints with different user roles
- Test file upload functionality with various file types and sizes
- Test error scenarios (network failures, invalid tokens, etc.)
- Implement unit tests for API client methods

---

## Quick Reference

### Endpoint Summary by Role

#### Public Endpoints (No Authentication)
- `GET /health` - Health check
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/credentials/verify/:jwt` - Verify credential
- `POST /api/zkp/verify-license-proof` - Verify ZKP proof
- `GET /api/zkp/valid-licenses` - Get valid licenses
- `GET /api/zkp/proof/:proofId/validate` - Validate proof exists
- `GET /api/zkp/system-status` - Check ZKP system status
- `GET /api/trust-scores/agencies/:address` - Get agency trust score
- `GET /api/trust-scores/statistics` - Get trust score statistics
- `GET /api/trust-scores/top-agencies` - Get top agencies
- `GET /api/blockchain/status` - Get blockchain status
- All blockchain GET endpoints

#### Worker Endpoints
- `GET /api/auth/me` - Get current user profile
- `POST /api/worker/documents` - Upload document
- `GET /api/worker/documents` - Get own documents
- `GET /api/worker/me/credentials` - Get own credentials

#### Agency Admin Endpoints
- All Worker endpoints plus:
- `POST /api/zkp/generate-license-proof` - Generate license proof
- `GET /api/zkp/my-proofs` - Get own ZKP proofs

#### Regulator Endpoints
- All previous endpoints plus:
- `GET /api/users` - Get all users
- `GET /api/users/workers` - Get all workers
- `GET /api/users/stats/overview` - Get user statistics
- `GET /api/regulator/documents/pending` - Get pending documents
- `POST /api/regulator/issue-credential` - Issue credential
- `POST /api/regulator/reject-document` - Reject document
- `POST /api/trust-scores/calculate` - Calculate trust scores
- `POST /api/trust-scores/events` - Record trust score event
- `POST /api/zkp/update-valid-licenses` - Update valid licenses
- `POST /api/zkp/initialize` - Initialize ZKP system

### Document Types
- `"Passport"`
- `"NID"`
- `"TrainingCertificate"`
- `"EducationCertificate"`
- `"SkillsCertificate"`
- `"WorkPermit"`

### User Roles
- `"Worker"`
- `"AgencyAdmin"`
- `"Regulator"`

---

## Contact & Support
For technical support or questions about API integration, please refer to the project documentation or contact the development team.

**Total Endpoints**: 39
**Last Updated**: January 2025
**API Version**: v1
