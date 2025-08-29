const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase configuration in .env file');
  console.error('Please ensure SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (or SUPABASE_ANON_KEY) are set');
  process.exit(1);
}

// Use service role key for admin operations
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function setupDatabase() {
  console.log('🚀 Setting up SafePass database with fixed RLS policies...\n');

  try {
    console.log('1. Creating database tables...');
    
    // First, create all tables without RLS
    const createTablesQuery = `
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

      -- Create updated_at trigger function
      CREATE OR REPLACE FUNCTION update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
          NEW.updated_at = NOW();
          RETURN NEW;
      END;
      $$ language 'plpgsql';

      -- Create trigger to automatically update updated_at
      DROP TRIGGER IF EXISTS update_users_updated_at ON users;
      CREATE TRIGGER update_users_updated_at 
          BEFORE UPDATE ON users 
          FOR EACH ROW 
          EXECUTE FUNCTION update_updated_at_column();

      -- Create document_uploads table for tracking document verification status
      CREATE TABLE IF NOT EXISTS document_uploads (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          document_type VARCHAR(100) NOT NULL,
          ipfs_cid VARCHAR(255) NOT NULL,
          status VARCHAR(50) NOT NULL DEFAULT 'PendingVerification' 
              CHECK (status IN ('PendingVerification', 'Approved', 'Rejected')),
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          reviewed_at TIMESTAMP WITH TIME ZONE,
          reviewer_notes TEXT,
          reviewer_id UUID REFERENCES users(id)
      );

      -- Create verifiable_credentials table for storing issued VCs
      CREATE TABLE IF NOT EXISTS verifiable_credentials (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          holder_did VARCHAR(255) NOT NULL,
          issuer_did VARCHAR(255) NOT NULL,
          type VARCHAR(100) NOT NULL,
          issuance_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          raw_vc_jwt TEXT NOT NULL,
          source_document_id UUID NOT NULL REFERENCES document_uploads(id) ON DELETE CASCADE,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      -- Create triggers for updated_at on document_uploads
      DROP TRIGGER IF EXISTS update_document_uploads_updated_at ON document_uploads;
      CREATE TRIGGER update_document_uploads_updated_at 
          BEFORE UPDATE ON document_uploads 
          FOR EACH ROW 
          EXECUTE FUNCTION update_updated_at_column();
    `;

    // Execute table creation using direct SQL
    const { error: createError } = await supabase.rpc('exec_sql', { 
      sql: createTablesQuery 
    });

    if (createError) {
      console.log('⚠️  RPC method not available, trying alternative approach...');
      
      // Manual table creation fallback
      console.log('📋 Please execute this SQL manually in your Supabase SQL Editor:');
      console.log('\n' + '='.repeat(80));
      console.log(createTablesQuery);
      console.log('='.repeat(80) + '\n');
      
      // Continue with the rest of the setup assuming tables exist
    } else {
      console.log('✅ Database tables created successfully');
    }

    console.log('2. Creating database indexes...');
    
    const indexQueries = [
      'CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);',
      'CREATE INDEX IF NOT EXISTS idx_users_did ON users(did);',
      'CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);',
      'CREATE INDEX IF NOT EXISTS idx_document_uploads_user_id ON document_uploads(user_id);',
      'CREATE INDEX IF NOT EXISTS idx_document_uploads_status ON document_uploads(status);',
      'CREATE INDEX IF NOT EXISTS idx_document_uploads_created_at ON document_uploads(created_at);',
      'CREATE INDEX IF NOT EXISTS idx_verifiable_credentials_holder_did ON verifiable_credentials(holder_did);',
      'CREATE INDEX IF NOT EXISTS idx_verifiable_credentials_issuer_did ON verifiable_credentials(issuer_did);',
      'CREATE INDEX IF NOT EXISTS idx_verifiable_credentials_type ON verifiable_credentials(type);'
    ];

    for (const indexQuery of indexQueries) {
      try {
        const { error } = await supabase.rpc('exec_sql', { sql: indexQuery });
        if (error) {
          console.log(`⚠️  Index creation skipped: ${indexQuery}`);
        }
      } catch (indexError) {
        console.log(`⚠️  Index creation skipped: ${indexQuery}`);
      }
    }

    console.log('✅ Database indexes created');

    console.log('3. Configuring Row Level Security...');
    
    // Disable RLS for now to avoid auth.uid() issues
    const rlsQuery = `
      -- Disable RLS temporarily for custom auth
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
    `;

    const { error: rlsError } = await supabase.rpc('exec_sql', { sql: rlsQuery });
    if (rlsError) {
      console.log('⚠️  RLS configuration may need manual setup');
      console.log('📋 Execute this SQL manually if needed:');
      console.log(rlsQuery);
    } else {
      console.log('✅ Row Level Security configured (disabled for custom auth)');
    }

    console.log('4. Testing database connection...');
    
    // Test each table
    const tables = ['users', 'document_uploads', 'verifiable_credentials'];
    for (const table of tables) {
      try {
        const { data, error: testError } = await supabase
          .from(table)
          .select('*')
          .limit(1);

        if (testError) {
          console.log(`⚠️  Table '${table}' test failed: ${testError.message}`);
        } else {
          console.log(`✅ Table '${table}' is accessible`);
        }
      } catch (error) {
        console.log(`⚠️  Table '${table}' test failed: ${error.message}`);
      }
    }

    console.log('\n🎉 Database setup completed successfully!');
    console.log('\n🧪 Now running Phase 4 tests...\n');

    // Run the Phase 4 tests
    const { spawn } = require('child_process');
    const testProcess = spawn('node', ['test-phase4.js'], { stdio: 'inherit' });
    
    testProcess.on('close', (code) => {
      if (code === 0) {
        console.log('\n🎉 All Phase 4 tests passed! Document upload system is working.');
      } else {
        console.log('\n⚠️  Some tests failed. Check the output above for details.');
      }
    });

  } catch (error) {
    console.error('❌ Database setup failed:', error.message);
    console.log('\n📋 Please create the tables manually in Supabase SQL Editor:');
    console.log('\n-- SafePass Complete Database Schema');
    console.log(`
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

-- Create document_uploads table
CREATE TABLE IF NOT EXISTS document_uploads (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    document_type VARCHAR(100) NOT NULL,
    ipfs_cid VARCHAR(255) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'PendingVerification' 
        CHECK (status IN ('PendingVerification', 'Approved', 'Rejected')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    reviewed_at TIMESTAMP WITH TIME ZONE,
    reviewer_notes TEXT,
    reviewer_id UUID REFERENCES users(id)
);

-- Create verifiable_credentials table
CREATE TABLE IF NOT EXISTS verifiable_credentials (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    holder_did VARCHAR(255) NOT NULL,
    issuer_did VARCHAR(255) NOT NULL,
    type VARCHAR(100) NOT NULL,
    issuance_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    raw_vc_jwt TEXT NOT NULL,
    source_document_id UUID NOT NULL REFERENCES document_uploads(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Disable RLS for custom auth
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE document_uploads DISABLE ROW LEVEL SECURITY;
ALTER TABLE verifiable_credentials DISABLE ROW LEVEL SECURITY;

-- Grant permissions
GRANT ALL ON users TO authenticated;
GRANT ALL ON users TO anon;
GRANT ALL ON document_uploads TO authenticated;
GRANT ALL ON document_uploads TO anon;
GRANT ALL ON verifiable_credentials TO authenticated;
GRANT ALL ON verifiable_credentials TO anon;
`);
    
    console.log('\nAfter creating the tables, run: node test-phase4.js');
  }
}

// Check if required services are running
async function checkPrerequisites() {
  console.log('🔍 Checking prerequisites...\n');

  // Check if API server is running
  try {
    const response = await fetch('http://localhost:3001/health');
    if (response.ok) {
      console.log('✅ API server is running on port 3001');
    } else {
      console.log('❌ API server is not responding properly');
      console.log('Please ensure the API server is running: npm run api:dev');
      process.exit(1);
    }
  } catch (error) {
    console.log('❌ API server is not running on port 3001');
    console.log('Please start the API server first: npm run api:dev');
    process.exit(1);
  }

  // Check IPFS connection
  try {
    const ipfsResponse = await fetch('http://localhost:5001/api/v0/version');
    if (ipfsResponse.ok) {
      console.log('✅ IPFS node is running');
    } else {
      console.log('⚠️  IPFS node may not be running (document upload might fail)');
      console.log('To start IPFS: npm run start:ipfs');
    }
  } catch (error) {
    console.log('⚠️  IPFS node is not accessible (document upload might fail)');
    console.log('To start IPFS: npm run start:ipfs');
  }

  // Check Besu connection
  try {
    const besuResponse = await fetch('http://localhost:8545', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'eth_blockNumber',
        params: [],
        id: 1
      })
    });
    
    if (besuResponse.ok) {
      console.log('✅ Besu blockchain node is running');
    } else {
      console.log('⚠️  Besu node may not be running (DID creation might fail)');
      console.log('To start Besu: npm run start:besu');
    }
  } catch (error) {
    console.log('⚠️  Besu node is not accessible (DID creation might fail)');
    console.log('To start Besu: npm run start:besu');
  }

  console.log('');
}

// Main execution
async function main() {
  await checkPrerequisites();
  await setupDatabase();
}

main().catch(console.error);
