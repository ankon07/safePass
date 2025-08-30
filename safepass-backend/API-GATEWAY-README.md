# SafePass API Gateway - Phase 3 Implementation

This document provides comprehensive setup and usage instructions for the SafePass API Gateway, which serves as the secure backend entry point for all user authentication and decentralized identity management.

## 🏗️ Architecture Overview

The API Gateway consists of:

- **Express.js Server**: RESTful API handling HTTP requests
- **Supabase Database**: PostgreSQL database for user data storage
- **Veramo Identity Service**: Decentralized Identity (DID) management
- **JWT Authentication**: Secure session management
- **Hyperledger Besu Integration**: Blockchain connectivity for DIDs

## 📋 Prerequisites

1. **Node.js** (v18 or higher)
2. **Supabase Account** with project setup
3. **Hyperledger Besu Node** running locally (for DID creation)
4. **Environment Variables** properly configured

## 🚀 Quick Start

### 1. Database Setup

First, set up your Supabase database:

1. Go to your Supabase project dashboard
2. Navigate to the SQL Editor
3. Run the SQL commands from `database-schema.sql`
4. Get your Supabase URL and anon key from Project Settings > API

### 2. Environment Configuration

Update your `.env` file with the required values:

```bash
# Required: Get these from your Supabase project
SUPABASE_URL=https://oirxwprqvcqmnsxmrcyq.supabase.co
SUPABASE_ANON_KEY=your-actual-supabase-anon-key

# Security: Generate strong secrets for production
JWT_SECRET=your-super-secret-jwt-key-change-in-production
MASTER_KEY=your-master-encryption-key-change-in-production

# Optional: Customize if needed
PORT=3001
BESU_RPC_URL=http://localhost:8545
```

### 3. Start the Services

```bash
# Start Hyperledger Besu (required for DID creation)
npm run start:besu

# Install dependencies (if not already done)
npm install

# Start the API Gateway in development mode
npm run api:dev
```

The API will be available at `http://localhost:3001`

## 📚 API Endpoints

### Health Check
```
GET /health
```
Returns server status and basic information.

### Authentication Endpoints

#### Register New User
```
POST /api/auth/register
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john.doe@example.com",
  "password": "strongPassword123",
  "role": "Worker"
}
```

**Response (201 Created):**
```json
{
  "message": "User created successfully",
  "user": {
    "id": "uuid-here",
    "email": "john.doe@example.com",
    "name": "John Doe",
    "role": "Worker",
    "did": "did:ethr:besu:0x...",
    "created_at": "2024-01-01T00:00:00.000Z"
  }
}
```

#### Login
```
POST /api/auth/login
Content-Type: application/json

{
  "email": "john.doe@example.com",
  "password": "strongPassword123"
}
```

**Response (200 OK):**
```json
{
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid-here",
    "email": "john.doe@example.com",
    "name": "John Doe",
    "role": "Worker",
    "did": "did:ethr:besu:0x..."
  }
}
```

#### Get Current User Profile (Protected)
```
GET /api/auth/me
Authorization: Bearer <jwt-token>
```

**Response (200 OK):**
```json
{
  "user": {
    "id": "uuid-here",
    "email": "john.doe@example.com",
    "name": "John Doe",
    "role": "Worker",
    "did": "did:ethr:besu:0x...",
    "created_at": "2024-01-01T00:00:00.000Z"
  }
}
```

## 🔐 Security Features

### Password Security
- Passwords are hashed using bcrypt with 12 salt rounds
- Minimum 8 character password requirement
- Never stored in plain text

### JWT Authentication
- 24-hour token expiration
- Tokens include user ID, email, role, and DID
- Middleware validates tokens on protected routes

### Private Key Encryption
- User private keys are encrypted using AES-256-CBC
- Master key derived using scrypt for additional security
- Keys stored encrypted in database, never in plain text

### Database Security
- Row Level Security (RLS) enabled on Supabase
- Users can only access their own data
- Sensitive fields excluded from public views

## 🆔 Decentralized Identity (DID) Integration

### How It Works
1. **Registration**: New users automatically get a DID created on Besu
2. **Key Management**: Private keys encrypted and stored securely
3. **Blockchain Integration**: DIDs are Ethereum-compatible (`did:ethr:besu:0x...`)
4. **Future-Ready**: Foundation for credential issuance and verification

### DID Format
```
did:ethr:besu:0x1234567890abcdef1234567890abcdef12345678
```

## 🧪 Testing the API

### Using curl

**Register a user:**
```bash
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "password": "testpassword123",
    "role": "Worker"
  }'
```

**Login:**
```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "testpassword123"
  }'
```

**Get profile (replace TOKEN with actual JWT):**
```bash
curl -X GET http://localhost:3001/api/auth/me \
  -H "Authorization: Bearer TOKEN"
```

### Using Postman/Insomnia

1. Import the API endpoints
2. Set base URL to `http://localhost:3001`
3. For protected routes, add `Authorization: Bearer <token>` header

## 🗂️ Project Structure

```
src/
├── api/
│   └── auth.ts          # Authentication routes
├── config/
│   ├── environment.ts   # Environment configuration
│   └── supabase.ts      # Database client and types
├── middleware/
│   └── auth.ts          # JWT authentication middleware
├── services/
│   └── identityService.ts # Veramo DID management
└── server.ts            # Express server setup

database-schema.sql      # Supabase database schema
API-GATEWAY-README.md    # This documentation
```

## 🚨 Error Handling

The API returns consistent error responses:

```json
{
  "error": "Error message description"
}
```

Common HTTP status codes:
- `400`: Bad Request (validation errors)
- `401`: Unauthorized (invalid credentials/token)
- `403`: Forbidden (insufficient permissions)
- `404`: Not Found
- `409`: Conflict (duplicate email)
- `500`: Internal Server Error

## 🔧 Development Scripts

```bash
# Development with auto-reload
npm run api:dev

# Build TypeScript to JavaScript
npm run api:build

# Run production build
npm run api:start

# Start Besu blockchain
npm run start:besu

# Start all services (Besu + IPFS)
npm run start:all
```

## 🚀 Production Deployment

### Environment Variables for Production

```bash
NODE_ENV=production
JWT_SECRET=<generate-strong-secret>
MASTER_KEY=<generate-strong-secret>
SUPABASE_URL=<your-production-supabase-url>
SUPABASE_ANON_KEY=<your-production-supabase-key>
BESU_RPC_URL=<your-production-besu-node>
```

### Security Checklist

- [ ] Generate strong, unique JWT_SECRET and MASTER_KEY
- [ ] Use production Supabase project
- [ ] Enable HTTPS in production
- [ ] Set up proper CORS origins
- [ ] Configure rate limiting
- [ ] Set up monitoring and logging
- [ ] Regular security audits

## 🐛 Troubleshooting

### Common Issues

**1. "Cannot connect to Besu node"**
- Ensure Besu is running: `npm run start:besu`
- Check BESU_RPC_URL in .env file
- Verify port 8545 is accessible

**2. "Supabase connection failed"**
- Verify SUPABASE_URL and SUPABASE_ANON_KEY
- Check Supabase project status
- Ensure database schema is created

**3. "JWT token invalid"**
- Check JWT_SECRET matches between requests
- Verify token hasn't expired (24h limit)
- Ensure proper Authorization header format

**4. "DID creation failed"**
- Besu node must be running and accessible
- Check network connectivity
- Verify Veramo configuration

### Debug Mode

Set `NODE_ENV=development` for detailed error messages and logging.

## 📞 Support

For issues and questions:
1. Check this documentation
2. Review error logs in console
3. Verify environment configuration
4. Test with provided curl examples

## 🔄 Next Steps

After successful Phase 3 implementation:
1. **Frontend Integration**: Connect React/Vue.js frontend
2. **Role-Based Access**: Implement agency and regulator features
3. **Credential Management**: Add verifiable credential issuance
4. **Smart Contract Integration**: Connect with employment contracts
5. **Advanced Security**: Add 2FA, rate limiting, audit logging
    