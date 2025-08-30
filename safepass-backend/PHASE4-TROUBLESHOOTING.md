# Phase 4 Troubleshooting Guide

This guide helps you resolve common issues when testing the Phase 4 Verifiable Credential Ecosystem.

## 🚀 Quick Setup Checklist

Before running the Phase 4 test, ensure all services are running:

### 1. Start IPFS Node
```bash
npm run start:ipfs
```

Wait for the IPFS node to be ready. You should see logs indicating the daemon is running.

### 2. Test IPFS Connection
```bash
npm run test:ipfs
```

Expected output:
```
✅ IPFS node is online and accessible
✅ Test file uploaded successfully. CID: QmXXX...
✅ Test file retrieved successfully. Content: Hello IPFS test
```

### 3. Update Database Schema
```bash
npm run setup:db
```

### 4. Start API Server
```bash
npm run api:dev
```

Expected output:
```
🚀 SafePass API Gateway running on port 3001
📊 Health check: http://localhost:3001/health
🔐 Auth endpoints: http://localhost:3001/api/auth
🌐 Environment: development
```

### 5. Run Phase 4 Test
```bash
npm run test:phase4
```

## 🔧 Common Issues and Solutions

### Issue 1: "IPFS service is not available"

**Error Message:**
```
Error in POST /worker/documents: {
  error: 'IPFS service is not available. Please ensure IPFS node is running.',
  hint: 'Run: npm run start:ipfs'
}
```

**Solution:**
1. Check if IPFS container is running:
   ```bash
   docker ps | grep ipfs
   ```

2. If not running, start IPFS:
   ```bash
   npm run start:ipfs
   ```

3. Wait for IPFS to be ready (check logs):
   ```bash
   docker logs safepass-ipfs-node-1
   ```

4. Test IPFS connection:
   ```bash
   npm run test:ipfs
   ```

### Issue 2: "Invalid file type" Error

**Error Message:**
```
Error in POST /worker/documents: {
  error: 'Internal server error',
  message: 'Invalid file type. Only images (JPEG, PNG, GIF) and PDF files are allowed.'
}
```

**Solution:**
The test script creates a valid PNG file. If you're still getting this error:

1. Check the server logs for more details
2. Ensure the API server is running the latest code
3. Restart the API server:
   ```bash
   # Stop the server (Ctrl+C) and restart
   npm run api:dev
   ```

### Issue 3: "Cannot read properties of undefined (reading 'token')"

**Error Message:**
```
❌ Test failed: Cannot read properties of undefined (reading 'token')
```

**Solution:**
This indicates the login response structure is incorrect. Check:

1. Ensure the API server is running
2. Check if the auth endpoints are working:
   ```bash
   curl http://localhost:3001/health
   ```

3. Verify user registration worked by checking the server logs

### Issue 4: Database Connection Issues

**Error Message:**
```
Failed to save document upload record.
```

**Solution:**
1. Check your `.env` file has correct Supabase credentials:
   ```bash
   SUPABASE_URL=your_supabase_url
   SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

2. Ensure the database schema is updated:
   ```bash
   npm run setup:db
   ```

3. Check if the new tables exist in your Supabase dashboard:
   - `document_uploads`
   - `verifiable_credentials`

### Issue 5: Docker Issues

**Error Message:**
```
❌ IPFS connection test failed: connect ECONNREFUSED 127.0.0.1:5001
```

**Solution:**
1. Check if Docker is running:
   ```bash
   docker --version
   docker ps
   ```

2. Check if IPFS container is running:
   ```bash
   docker ps | grep ipfs
   ```

3. If container is not running, start it:
   ```bash
   npm run start:ipfs
   ```

4. If container fails to start, check logs:
   ```bash
   docker logs safepass-ipfs-node-1
   ```

5. If port 5001 is in use, you may need to stop other IPFS instances:
   ```bash
   docker stop $(docker ps -q --filter "ancestor=ipfs/go-ipfs")
   ```

### Issue 6: Port Already in Use

**Error Message:**
```
Error: listen EADDRINUSE: address already in use :::3001
```

**Solution:**
1. Find what's using port 3001:
   ```bash
   lsof -i :3001
   ```

2. Kill the process or use a different port:
   ```bash
   PORT=3002 npm run api:dev
   ```

3. Update the test script API_BASE if using a different port

## 🔍 Debugging Steps

### 1. Check Service Status

```bash
# Check IPFS
npm run test:ipfs

# Check API health
curl http://localhost:3001/health

# Check Docker containers
docker ps
```

### 2. Check Logs

```bash
# IPFS logs
docker logs safepass-ipfs-node-1

# API server logs (check the terminal where you ran npm run api:dev)
```

### 3. Manual API Testing

Test individual endpoints:

```bash
# Health check
curl http://localhost:3001/health

# Register user
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123",
    "name": "Test User",
    "role": "Worker"
  }'

# Login
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'
```

### 4. Environment Variables

Ensure your `.env` file contains:

```bash
# Supabase
SUPABASE_URL=your_supabase_project_url
SUPABASE_ANON_KEY=your_supabase_anon_key

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-in-production

# Veramo
MASTER_KEY=your-master-encryption-key-change-in-production

# Besu (if using local blockchain)
BESU_RPC_URL=http://localhost:8545

# IPFS
IPFS_API_URL=http://localhost:5001
```

## 📋 Complete Test Sequence

Run these commands in order:

```bash
# 1. Start services
npm run start:ipfs
# Wait for IPFS to be ready

# 2. Test IPFS
npm run test:ipfs
# Should show ✅ success messages

# 3. Update database
npm run setup:db

# 4. Start API server (in new terminal)
npm run api:dev
# Should show server running on port 3001

# 5. Run Phase 4 test (in another terminal)
npm run test:phase4
# Should complete successfully
```

## 🆘 Still Having Issues?

If you're still experiencing problems:

1. **Check the server logs** - The API server terminal will show detailed error messages
2. **Verify all dependencies** - Run `npm install` to ensure all packages are installed
3. **Check Docker** - Ensure Docker Desktop is running and has sufficient resources
4. **Database permissions** - Verify your Supabase project has the correct RLS policies
5. **Network issues** - Ensure ports 3001 and 5001 are not blocked by firewall

## 📞 Getting Help

When reporting issues, please include:

1. **Error message** - Full error output
2. **Environment** - OS, Node.js version, Docker version
3. **Logs** - Server logs and Docker container logs
4. **Steps taken** - What you tried before the error occurred

Example issue report:
```
**Error:** IPFS connection failed
**Environment:** Ubuntu 20.04, Node.js 18.17.0, Docker 24.0.5
**Steps:** 
1. Ran npm run start:ipfs
2. Ran npm run test:ipfs
3. Got connection refused error

**Logs:**
Docker logs show: "Error: bind: address already in use"
```

This helps identify the root cause quickly and provide targeted solutions.
