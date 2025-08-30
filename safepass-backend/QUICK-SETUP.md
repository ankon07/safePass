# SafePass API Gateway - Quick Setup Guide

## 🚀 Complete Setup in 3 Steps

### Step 1: Create Database Table
Go to your **Supabase Dashboard** → **SQL Editor** and run this SQL:

```sql
-- Create users table
CREATE TABLE IF NOT EXISTS users (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    name VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL CHECK (role IN ('Worker', 'AgencyAdmin', 'Regulator')),
    did VARCHAR(255) UNIQUE NOT NULL,
    encrypted_private_key_hex TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_did ON users(did);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
```

### Step 2: Test the API
Run the comprehensive API test:
```bash
npm run test:api
```

### Step 3: Start Using the API
Your SafePass API Gateway is now ready! 🎉

## 📚 Available API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user with DID
- `POST /api/auth/login` - Login and get JWT token
- `GET /api/auth/me` - Get current user profile

### User Management (Admin/Regulator only)
- `GET /api/users` - Get all users
- `GET /api/users/workers` - Get all workers
- `GET /api/users/:id` - Get user by ID
- `GET /api/users/stats/overview` - Get user statistics

### Health Check
- `GET /health` - Server status

## 🧪 Example Usage

### Register a new user:
```bash
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "password": "password123",
    "role": "Worker"
  }'
```

### Login:
```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "password123"
  }'
```

### Get profile (with JWT token):
```bash
curl -X GET http://localhost:3001/api/auth/me \
  -H "Authorization: Bearer YOUR_JWT_TOKEN_HERE"
```

## 🔧 Available Scripts

```bash
# Start API server in development mode
npm run api:dev

# Run database setup script
npm run setup:db

# Test all API endpoints
npm run test:api

# Start Besu blockchain
npm run start:besu

# Start all services (Besu + IPFS)
npm run start:all
```

## ✅ What's Working

- ✅ **User Registration** with automatic DID creation
- ✅ **JWT Authentication** with secure token management
- ✅ **Password Hashing** using bcrypt
- ✅ **Private Key Encryption** for DID keys
- ✅ **Role-based Access Control** (Worker, AgencyAdmin, Regulator)
- ✅ **Supabase Database Integration**
- ✅ **Hyperledger Besu DID Creation**
- ✅ **Comprehensive API Testing**

## 🎯 Next Steps

After successful setup, you can:
1. **Integrate with Frontend** - Connect React/Vue.js applications
2. **Add More Features** - Implement credential management
3. **Deploy to Production** - Set up proper environment variables
4. **Scale the System** - Add rate limiting, monitoring, etc.

---

**Need Help?** Check the detailed documentation in `API-GATEWAY-README.md`
