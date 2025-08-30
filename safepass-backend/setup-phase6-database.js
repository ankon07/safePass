const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
require('dotenv').config();

async function setupPhase6Database() {
  console.log('🗄️ Setting up Phase 6 database schema...');

  // Initialize Supabase client
  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY
  );

  try {
    // Read the Phase 6 schema file
    const schemaSQL = fs.readFileSync('phase6-database-schema.sql', 'utf8');
    
    // Split the schema into individual statements
    const statements = schemaSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

    console.log(`Found ${statements.length} SQL statements to execute`);

    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      
      // Skip comments and empty statements
      if (statement.startsWith('--') || statement.length < 10) {
        continue;
      }

      try {
        console.log(`Executing statement ${i + 1}/${statements.length}...`);
        
        // Use rpc to execute raw SQL
        const { data, error } = await supabase.rpc('exec_sql', {
          sql_query: statement
        });

        if (error) {
          // Some errors are expected (like table already exists)
          if (error.message.includes('already exists') || 
              error.message.includes('duplicate key') ||
              error.message.includes('does not exist')) {
            console.log(`⚠️  Statement ${i + 1}: ${error.message} (continuing...)`);
          } else {
            console.error(`❌ Error in statement ${i + 1}:`, error.message);
            console.log('Statement:', statement.substring(0, 100) + '...');
          }
        } else {
          console.log(`✅ Statement ${i + 1} executed successfully`);
        }
      } catch (err) {
        console.error(`❌ Exception in statement ${i + 1}:`, err.message);
      }
    }

    // Try to create the tables directly using Supabase client
    console.log('\n🔧 Creating tables using direct SQL execution...');
    
    // Create tables one by one
    const createTableStatements = [
      `CREATE TABLE IF NOT EXISTS agency_trust_scores (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        agency_address VARCHAR(255) NOT NULL,
        agency_did VARCHAR(255),
        trust_score INTEGER NOT NULL DEFAULT 1000,
        calculated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        successful_placements INTEGER DEFAULT 0,
        verified_complaints INTEGER DEFAULT 0,
        score_change INTEGER DEFAULT 0,
        calculation_details JSONB,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )`,
      
      `CREATE TABLE IF NOT EXISTS trust_score_events (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        agency_address VARCHAR(255) NOT NULL,
        event_type VARCHAR(50) NOT NULL CHECK (event_type IN ('successful_placement', 'verified_complaint', 'manual_adjustment', 'initial_score')),
        contract_address VARCHAR(255),
        employment_contract_id UUID,
        impact_score INTEGER NOT NULL,
        event_data JSONB,
        processed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )`,
      
      `CREATE TABLE IF NOT EXISTS trust_score_config (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        parameter_name VARCHAR(50) UNIQUE NOT NULL,
        parameter_value DECIMAL(10,2) NOT NULL,
        description TEXT,
        updated_by UUID,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )`,
      
      `INSERT INTO trust_score_config (parameter_name, parameter_value, description) VALUES
        ('alpha_successful_placement', 1.0, 'Points added for each successful employment placement'),
        ('beta_verified_complaint', 10.0, 'Points deducted for each verified complaint'),
        ('gamma_dispute_resolution', 5.0, 'Points deducted for disputes resolved against agency'),
        ('min_trust_score', 0.0, 'Minimum possible trust score'),
        ('max_trust_score', 200.0, 'Maximum possible trust score'),
        ('default_trust_score', 100.0, 'Default trust score for new agencies'),
        ('calculation_frequency_hours', 24.0, 'How often to recalculate trust scores (in hours)')
      ON CONFLICT (parameter_name) DO NOTHING`,
      
      `CREATE TABLE IF NOT EXISTS zkp_license_proofs (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        agency_id UUID,
        agency_address VARCHAR(255) NOT NULL,
        proof_data JSONB NOT NULL,
        public_signals JSONB NOT NULL,
        merkle_root VARCHAR(255) NOT NULL,
        circuit_type VARCHAR(50) DEFAULT 'license_verification',
        is_valid BOOLEAN DEFAULT true,
        verified_at TIMESTAMP WITH TIME ZONE,
        expires_at TIMESTAMP WITH TIME ZONE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )`,
      
      `CREATE TABLE IF NOT EXISTS zkp_verification_keys (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        circuit_name VARCHAR(100) NOT NULL,
        key_type VARCHAR(50) NOT NULL CHECK (key_type IN ('proving_key', 'verification_key')),
        key_data JSONB NOT NULL,
        circuit_hash VARCHAR(255),
        version VARCHAR(20) DEFAULT '1.0.0',
        is_active BOOLEAN DEFAULT true,
        created_by UUID,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )`,
      
      `CREATE TABLE IF NOT EXISTS zkp_merkle_trees (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        tree_name VARCHAR(100) NOT NULL,
        merkle_root VARCHAR(255) NOT NULL,
        tree_data JSONB NOT NULL,
        leaf_count INTEGER NOT NULL,
        tree_height INTEGER NOT NULL,
        is_current BOOLEAN DEFAULT true,
        created_by UUID,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )`
    ];

    for (let i = 0; i < createTableStatements.length; i++) {
      const statement = createTableStatements[i];
      console.log(`Creating table/data ${i + 1}/${createTableStatements.length}...`);
      
      try {
        // Execute using raw SQL
        const { error } = await supabase.rpc('exec_sql', {
          sql_query: statement
        });

        if (error) {
          console.log(`⚠️  Table creation ${i + 1}: ${error.message}`);
        } else {
          console.log(`✅ Table/data ${i + 1} created successfully`);
        }
      } catch (err) {
        console.log(`⚠️  Table creation ${i + 1}: ${err.message}`);
      }
    }

    // Test the setup by querying the trust_score_config table
    console.log('\n🧪 Testing database setup...');
    const { data: configData, error: configError } = await supabase
      .from('trust_score_config')
      .select('parameter_name, parameter_value')
      .limit(3);

    if (configError) {
      console.error('❌ Error testing trust_score_config:', configError);
    } else {
      console.log('✅ Trust score config table is working!');
      console.log('Sample config:', configData);
    }

    console.log('\n🎉 Phase 6 database setup completed!');
    console.log('You can now start the API server with: npm run api:dev');

  } catch (error) {
    console.error('❌ Error setting up Phase 6 database:', error);
  }
}

// Run the setup
setupPhase6Database();
