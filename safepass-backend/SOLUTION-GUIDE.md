# SafePass Database Setup Solution Guide

## Problem Summary
The document upload functionality is failing due to Row-Level Security (RLS) policies in Supabase that are incompatible with the custom JWT authentication system used by SafePass.

## Root Cause
- The application uses custom JWT tokens for authentication
- Supabase RLS policies expect `auth.uid()` from Supabase Auth
- The `document_uploads` table has RLS enabled with policies that block inserts

## Solution Steps

### Step 1: Execute SQL Setup in Supabase Dashboard

1. **Go to your Supabase Dashboard**: https://supabase.com/dashboard
2. **Navigate to**: Your Project → SQL Editor
3. **Copy and paste the entire contents** of `supabase-setup.sql` into the SQL Editor
4. **Click "Run"** to execute the script

The script will:
- Drop and recreate all tables with proper structure
- Disable Row-Level Security for custom authentication
- Grant necessary permissions
- Create proper indexes

### Step 2: Verify Database Setup

After running the SQL script, run this command to verify:

```bash
node test-supabase-direct.js
```

You should see:
- ✅ document_uploads table is accessible
- ✅ Insert test successful

### Step 3: Test Document Upload

Run the Phase 4 test to verify document upload works:

```bash
node test-phase4.js
```

## Alternative: Use Service Role Key

If you have a Supabase Service Role Key, add it to your `.env` file:

```env
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

Then modify `src/config/supabase.ts` to use the service role key for backend operations.

## Manual SQL Script Content

If you need to execute the SQL manually, here's the essential part:

```sql
-- Disable RLS for custom authentication
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE document_uploads DISABLE ROW LEVEL SECURITY;
ALTER TABLE verifiable_credentials DISABLE ROW LEVEL SECURITY;

-- Grant necessary permissions
GRANT ALL ON users TO authenticated;
GRANT ALL ON users TO anon;
GRANT ALL ON document_uploads TO authenticated;
GRANT ALL ON document_uploads TO anon;
GRANT ALL ON verifiable_credentials TO authenticated;
GRANT ALL ON verifiable_credentials TO anon;
```

## Security Note

Disabling RLS is acceptable for this development setup since:
1. The application implements its own authentication and authorization
2. API endpoints have proper role-based access control
3. This is a development/demo environment

For production, you would want to:
1. Use Supabase Auth instead of custom JWT
2. Or implement proper RLS policies that work with custom auth
3. Or use service role key for backend operations with application-level security

## Verification Commands

```bash
# Test database connection
node test-supabase-direct.js

# Test full Phase 4 workflow
node test-phase4.js

# Check API server status
curl http://localhost:3001/health
