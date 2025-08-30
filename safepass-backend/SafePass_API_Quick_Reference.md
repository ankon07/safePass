# SafePass API Quick Reference

## Base Configuration
- **Base URL**: `http://localhost:3001`
- **Authentication**: JWT Bearer Token
- **Total Endpoints**: 39

## Authentication Headers
```json
{
  "Authorization": "Bearer <jwt_token>",
  "Content-Type": "application/json"
}
```

## Quick Endpoint List

### 🔐 Authentication (3 endpoints)
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/register` | None | Register new user |
| POST | `/api/auth/login` | None | Login user |
| GET | `/api/auth/me` | JWT | Get current user profile |

### 👥 User Management (4 endpoints)
| Method | Endpoint | Auth | Role | Description |
|--------|----------|------|------|-------------|
| GET | `/api/users` | JWT | Admin/Regulator | Get all users |
| GET | `/api/users/workers` | JWT | Admin/Regulator | Get all workers |
| GET | `/api/users/:id` | JWT | Own/Admin/Regulator | Get user by ID |
| GET | `/api/users/stats/overview` | JWT | Admin/Regulator | Get user statistics |

### 📄 Document Management (3 endpoints)
| Method | Endpoint | Auth | Role | Description |
|--------|----------|------|------|-------------|
| POST | `/api/worker/documents` | JWT | Worker | Upload document |
| GET | `/api/worker/documents` | JWT | Worker | Get own documents |
| GET | `/api/regulator/documents/pending` | JWT | Regulator | Get pending documents |

### 🎓 Credential Management (4 endpoints)
| Method | Endpoint | Auth | Role | Description |
|--------|----------|------|------|-------------|
| POST | `/api/regulator/issue-credential` | JWT | Regulator | Issue verifiable credential |
| POST | `/api/regulator/reject-document` | JWT | Regulator | Reject document |
| GET | `/api/worker/me/credentials` | JWT | Worker | Get own credentials |
| GET | `/api/credentials/verify/:jwt` | None | Public | Verify credential |

### ⛓️ Blockchain (8 endpoints)
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/blockchain/status` | None | Get blockchain status |
| POST | `/api/blockchain/credentials/issue` | None | Issue credential on blockchain |
| PUT | `/api/blockchain/credentials/:id/status` | JWT | Update credential status |
| GET | `/api/blockchain/credentials/:id` | None | Get credential info |
| GET | `/api/blockchain/workers/:did/credentials` | None | Get worker credentials |
| GET | `/api/blockchain/events/:contract/:event` | None | Get contract events |
| POST | `/api/blockchain/contracts/register` | JWT | Register contract |
| POST | `/api/blockchain/contracts/deploy` | JWT | Deploy contract |

### 🏆 Trust Score (6 endpoints)
| Method | Endpoint | Auth | Role | Description |
|--------|----------|------|------|-------------|
| GET | `/api/trust-scores/agencies/:address` | None | Public | Get agency trust score |
| GET | `/api/trust-scores/statistics` | None | Public | Get trust score statistics |
| GET | `/api/trust-scores/top-agencies` | None | Public | Get top agencies |
| POST | `/api/trust-scores/calculate` | JWT | Regulator | Calculate trust scores |
| POST | `/api/trust-scores/events` | JWT | Regulator | Record trust score event |
| GET | `/api/trust-scores/events/:address` | None | Public | Get trust score events |

### 🔒 Zero-Knowledge Proof (8 endpoints)
| Method | Endpoint | Auth | Role | Description |
|--------|----------|------|------|-------------|
| POST | `/api/zkp/generate-license-proof` | JWT | AgencyAdmin | Generate license proof |
| POST | `/api/zkp/verify-license-proof` | None | Public | Verify license proof |
| GET | `/api/zkp/my-proofs` | JWT | AgencyAdmin | Get agency's ZKP proofs |
| POST | `/api/zkp/update-valid-licenses` | JWT | Regulator | Update valid licenses |
| GET | `/api/zkp/valid-licenses` | None | Public | Get valid licenses |
| GET | `/api/zkp/proof/:id/validate` | None | Public | Validate proof exists |
| POST | `/api/zkp/initialize` | JWT | Regulator | Initialize ZKP system |
| GET | `/api/zkp/system-status` | None | Public | Check ZKP system status |

### ❤️ Health Check (1 endpoint)
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/health` | None | Check API status |

## Role-Based Access Summary

### 🔓 Public (No Auth Required) - 15 endpoints
- Health check
- User registration/login
- Credential verification
- ZKP proof verification
- Trust score viewing
- Blockchain status/info

### 👷 Worker Role - 4 endpoints
- Document upload/viewing
- Credential viewing
- Profile management

### 🏢 Agency Admin Role - 2 additional endpoints
- ZKP proof generation
- View own proofs

### 🏛️ Regulator Role - 8 additional endpoints
- User management
- Document review/approval
- Credential issuance
- Trust score management
- License management
- System initialization

## Common Request Bodies

### User Registration
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "role": "Worker"
}
```

### User Login
```json
{
  "email": "john@example.com",
  "password": "password123"
}
```

### Document Upload (Form Data)
- `file`: Document file (PDF, JPEG, PNG, GIF - max 10MB)
- `documentType`: "Passport" | "NID" | "TrainingCertificate" | "EducationCertificate" | "SkillsCertificate" | "WorkPermit"

### Issue Credential
```json
{
  "documentUploadId": "uuid",
  "holderDid": "did:ethr:0x...",
  "claims": {
    "degree": "Bachelor of Science",
    "institution": "University Name"
  }
}
```

### Generate ZKP Proof
```json
{
  "license_number": "LIC123456"
}
```

### Record Trust Score Event
```json
{
  "agency_address": "0x...",
  "event_type": "successful_placement",
  "impact_score": 10
}
```

## Common Response Formats

### Success Response
```json
{
  "message": "Operation successful",
  "data": { /* response data */ }
}
```

### Error Response
```json
{
  "error": "Error message",
  "details": "Additional error details (dev mode)"
}
```

### Login Response
```json
{
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "User Name",
    "role": "Worker",
    "did": "did:ethr:0x..."
  }
}
```

## HTTP Status Codes
- **200**: Success
- **201**: Created
- **202**: Accepted (async operation)
- **400**: Bad Request
- **401**: Unauthorized
- **403**: Forbidden
- **404**: Not Found
- **500**: Internal Server Error
- **503**: Service Unavailable

## Data Types & Enums

### User Roles
- `"Worker"`
- `"AgencyAdmin"`
- `"Regulator"`

### Document Types
- `"Passport"`
- `"NID"`
- `"TrainingCertificate"`
- `"EducationCertificate"`
- `"SkillsCertificate"`
- `"WorkPermit"`

### Document Status
- `"PendingVerification"`
- `"Approved"`
- `"Rejected"`

### Trust Score Event Types
- `"successful_placement"`
- `"verified_complaint"`
- `"manual_adjustment"`
- `"initial_score"`

## Frontend Integration Checklist

### ✅ Authentication
- [ ] Implement user registration
- [ ] Implement user login
- [ ] Store JWT token securely
- [ ] Add token to API requests
- [ ] Handle token expiration (24h)
- [ ] Implement logout functionality

### ✅ Role-Based Access
- [ ] Implement route guards
- [ ] Show/hide UI based on user role
- [ ] Handle 403 Forbidden responses

### ✅ File Upload
- [ ] Implement multipart/form-data upload
- [ ] Validate file types and sizes
- [ ] Show upload progress
- [ ] Handle upload errors

### ✅ Error Handling
- [ ] Implement global error handler
- [ ] Show user-friendly error messages
- [ ] Handle network failures
- [ ] Log errors for debugging

### ✅ State Management
- [ ] Manage authentication state
- [ ] Manage user profile data
- [ ] Handle loading states
- [ ] Cache API responses where appropriate

## Testing Endpoints

### Using cURL
```bash
# Health check
curl http://localhost:3001/health

# Register user
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","email":"test@example.com","password":"password123","role":"Worker"}'

# Login
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'

# Get profile (replace TOKEN)
curl -X GET http://localhost:3001/api/auth/me \
  -H "Authorization: Bearer TOKEN"
```

### Using JavaScript Fetch
```javascript
// Login example
const login = async (email, password) => {
  const response = await fetch('http://localhost:3001/api/auth/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, password }),
  });
  
  const data = await response.json();
  
  if (response.ok) {
    localStorage.setItem('jwt_token', data.token);
    return data;
  } else {
    throw new Error(data.error);
  }
};
```

---

**For complete documentation with detailed request/response examples, see `SafePass_API_Documentation.md`**
