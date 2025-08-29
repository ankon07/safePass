const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

async function setupPhase6DatabaseDirect() {
  console.log('🗄️ Setting up Phase 6 database schema (direct SQL approach)...');

  // Initialize Supabase client with service role key
  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY
  );

  // SQL statements to create all Phase 6 tables
  const sqlStatements = [
    // 1. Trust Score Config Table
    `
    CREATE TABLE IF NOT EXISTS trust_score_config (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      parameter_name VARCHAR(50) UNIQUE NOT NULL,
      parameter_value DECIMAL(10,2) NOT NULL,
      description TEXT,
      updated_by UUID,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
    `,
    
    // 2. Agency Trust Scores Table
    `
    CREATE TABLE IF NOT EXISTS agency_trust_scores (
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
    );
    `,
    
    // 3. Trust Score Events Table
    `
    CREATE TABLE IF NOT EXISTS trust_score_events (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      agency_address VARCHAR(255) NOT NULL,
      event_type VARCHAR(50) NOT NULL,
      contract_address VARCHAR(255),
      employment_contract_id UUID,
      impact_score INTEGER NOT NULL,
      event_data JSONB,
      processed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
    `,
    
    // 4. ZKP License Proofs Table
    `
    CREATE TABLE IF NOT EXISTS zkp_license_proofs (
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
    );
    `,
    
    // 5. ZKP Verification Keys Table
    `
    CREATE TABLE IF NOT EXISTS zkp_verification_keys (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      circuit_name VARCHAR(100) NOT NULL,
      key_type VARCHAR(50) NOT NULL,
      key_data JSONB NOT NULL,
      circuit_hash VARCHAR(255),
      version VARCHAR(20) DEFAULT '1.0.0',
      is_active BOOLEAN DEFAULT true,
      created_by UUID,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
    `,
    
    // 6. ZKP Merkle Trees Table
    `
    CREATE TABLE IF NOT EXISTS zkp_merkle_trees (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      tree_name VARCHAR(100) NOT NULL,
      merkle_root VARCHAR(255) NOT NULL,
      tree_data JSONB NOT NULL,
      leaf_count INTEGER NOT NULL,
      tree_height INTEGER NOT NULL,
      is_current BOOLEAN DEFAULT true,
      created_by UUID,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
    `,
    
    // 7. Agency Performance Metrics Table
    `
    CREATE TABLE IF NOT EXISTS agency_performance_metrics (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      agency_address VARCHAR(255) NOT NULL,
      metric_type VARCHAR(50) NOT NULL,
      metric_value DECIMAL(10,2) NOT NULL,
      measurement_period VARCHAR(20) DEFAULT 'monthly',
      recorded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
    `
  ];

  try {
    // Try to execute SQL using the RPC function approach
    console.log('📝 Attempting to create tables using RPC...');
    
    for (let i = 0; i < sqlStatements.length; i++) {
      const sql = sqlStatements[i];
      console.log(`Creating table ${i + 1}/7...`);
      
      try {
        // Try using the rpc function to execute SQL
        const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql });
        
        if (error) {
          console.log(`⚠️  Table ${i + 1} creation failed via RPC:`, error.message);
        } else {
          console.log(`✅ Table ${i + 1} created successfully via RPC`);
        }
      } catch (rpcError) {
        console.log(`⚠️  RPC method not available for table ${i + 1}`);
      }
    }

    // Insert configuration data
    console.log('\n📝 Setting up trust score configuration...');
    
    const configData = [
      { parameter_name: 'alpha_successful_placement', parameter_value: 1.0, description: 'Points added for each successful employment placement' },
      { parameter_name: 'beta_verified_complaint', parameter_value: 10.0, description: 'Points deducted for each verified complaint' },
      { parameter_name: 'gamma_dispute_resolution', parameter_value: 5.0, description: 'Points deducted for disputes resolved against agency' },
      { parameter_name: 'min_trust_score', parameter_value: 0.0, description: 'Minimum possible trust score' },
      { parameter_name: 'max_trust_score', parameter_value: 200.0, description: 'Maximum possible trust score' },
      { parameter_name: 'default_trust_score', parameter_value: 100.0, description: 'Default trust score for new agencies' },
      { parameter_name: 'calculation_frequency_hours', parameter_value: 24.0, description: 'How often to recalculate trust scores (in hours)' }
    ];

    // Try to insert configuration data
    for (const config of configData) {
      try {
        const { data, error } = await supabase
          .from('trust_score_config')
          .upsert(config, { onConflict: 'parameter_name' });

        if (error) {
          console.log(`⚠️  Config ${config.parameter_name}: ${error.message}`);
        } else {
          console.log(`✅ Config ${config.parameter_name} set successfully`);
        }
      } catch (configError) {
        console.log(`⚠️  Config ${config.parameter_name} failed:`, configError.message);
      }
    }

    // Test the setup
    console.log('\n🧪 Testing database setup...');
    const { data: configTestData, error: configError } = await supabase
      .from('trust_score_config')
      .select('parameter_name, parameter_value')
      .limit(3);

    if (configError) {
      console.error('❌ Tables still not accessible via Supabase client');
      console.log('\n📋 Manual Setup Required:');
      console.log('Please execute the following SQL in your Supabase SQL Editor:');
      console.log('\n' + '='.repeat(80));
      
      sqlStatements.forEach((sql, index) => {
        console.log(`-- Table ${index + 1}`);
        console.log(sql.trim());
        console.log('');
      });
      
      console.log('-- Configuration Data');
      configData.forEach(config => {
        console.log(`INSERT INTO trust_score_config (parameter_name, parameter_value, description) VALUES ('${config.parameter_name}', ${config.parameter_value}, '${config.description}') ON CONFLICT (parameter_name) DO NOTHING;`);
      });
      
      console.log('\n' + '='.repeat(80));
      console.log('\n📝 After running the SQL above, restart the API server with: npm run api:dev');
      
    } else {
      console.log('✅ Database setup successful!');
      console.log('Sample config:', configTestData);
      console.log('\n🎉 Phase 6 database is ready!');
      console.log('You can now start the API server with: npm run api:dev');
    }

  } catch (error) {
    console.error('❌ Error setting up Phase 6 database:', error);
    console.log('\n📋 Please manually create the tables in Supabase dashboard');
  }
}

// Run the setup
setupPhase6DatabaseDirect();
