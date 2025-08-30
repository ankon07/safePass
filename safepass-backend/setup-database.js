const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase configuration in .env file');
  console.error('Please ensure SUPABASE_URL and SUPABASE_ANON_KEY are set');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function setupDatabase() {
  console.log('🚀 Setting up SafePass database...\n');

  try {
    // Create the users table
    console.log('1. Creating users table...');
    
    const createTableQuery = `
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
      CREATE TRIGGER update_document_uploads_updated_at 
          BEFORE UPDATE ON document_uploads 
          FOR EACH ROW 
          EXECUTE FUNCTION update_updated_at_column();
    `;

    const { error: createError } = await supabase.rpc('exec_sql', { 
      sql: createTableQuery 
    });

    if (createError) {
      // Try alternative method using direct SQL execution
      console.log('Trying alternative table creation method...');
      
      // Use the REST API to execute SQL
      const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': supabaseAnonKey,
          'Authorization': `Bearer ${supabaseAnonKey}`
        },
        body: JSON.stringify({ sql: createTableQuery })
      });

      if (!response.ok) {
        console.log('⚠️  Direct SQL execution not available. Please create the table manually.');
        console.log('📋 Copy and paste this SQL in your Supabase SQL Editor:');
        console.log('\n' + '='.repeat(60));
        console.log(createTableQuery);
        console.log('\n-- Create indexes for better performance');
        console.log('CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);');
        console.log('CREATE INDEX IF NOT EXISTS idx_users_did ON users(did);');
        console.log('CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);');
        console.log('='.repeat(60) + '\n');
        
        console.log('After creating the table manually, run: node test-api.js');
        return;
      }
    }

    console.log('✅ Users table created successfully');

    // Create indexes
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
        await supabase.rpc('exec_sql', { sql: indexQuery });
      } catch (indexError) {
        console.log(`⚠️  Index creation skipped: ${indexError.message}`);
      }
    }

    console.log('✅ Database indexes created');

    // Test database connection
    console.log('3. Testing database connection...');
    
    const { data, error: testError } = await supabase
      .from('users')
      .select('count(*)')
      .limit(1);

    if (testError) {
      console.error('❌ Database connection test failed:', testError.message);
      console.log('\n📋 Please create the table manually in Supabase SQL Editor:');
      console.log('\n' + createTableQuery);
      console.log('\n-- Create indexes');
      indexQueries.forEach(query => console.log(query));
      return;
    }

    console.log('✅ Database connection test passed');
    console.log('\n🎉 Database setup completed successfully!');
    console.log('\n🧪 Now running API tests...\n');

    // Run the API tests
    const { spawn } = require('child_process');
    const testProcess = spawn('node', ['test-api.js'], { stdio: 'inherit' });
    
    testProcess.on('close', (code) => {
      if (code === 0) {
        console.log('\n🎉 All tests passed! SafePass API Gateway is ready to use.');
      } else {
        console.log('\n⚠️  Some tests failed. Check the output above for details.');
      }
    });

  } catch (error) {
    console.error('❌ Database setup failed:', error.message);
    console.log('\n📋 Please create the table manually in Supabase SQL Editor:');
    console.log('\n-- SafePass Users Table');
    console.log(`CREATE TABLE IF NOT EXISTS users (
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
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);`);
    
    console.log('\nAfter creating the table, run: node test-api.js');
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
