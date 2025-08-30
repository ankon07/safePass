const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

async function setupPhase6Database() {
  console.log('🗄️ Setting up Phase 6 database schema (simplified approach)...');

  // Initialize Supabase client with service role key if available, otherwise anon key
  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY
  );

  try {
    // First, let's try to insert the trust score configuration data
    console.log('📝 Setting up trust score configuration...');
    
    const configData = [
      { parameter_name: 'alpha_successful_placement', parameter_value: 1.0, description: 'Points added for each successful employment placement' },
      { parameter_name: 'beta_verified_complaint', parameter_value: 10.0, description: 'Points deducted for each verified complaint' },
      { parameter_name: 'gamma_dispute_resolution', parameter_value: 5.0, description: 'Points deducted for disputes resolved against agency' },
      { parameter_name: 'min_trust_score', parameter_value: 0.0, description: 'Minimum possible trust score' },
      { parameter_name: 'max_trust_score', parameter_value: 200.0, description: 'Maximum possible trust score' },
      { parameter_name: 'default_trust_score', parameter_value: 100.0, description: 'Default trust score for new agencies' },
      { parameter_name: 'calculation_frequency_hours', parameter_value: 24.0, description: 'How often to recalculate trust scores (in hours)' }
    ];

    // Try to create the trust_score_config table by inserting data
    for (const config of configData) {
      const { data, error } = await supabase
        .from('trust_score_config')
        .upsert(config, { onConflict: 'parameter_name' });

      if (error) {
        console.log(`⚠️  Config ${config.parameter_name}: ${error.message}`);
      } else {
        console.log(`✅ Config ${config.parameter_name} set successfully`);
      }
    }

    // Test the setup by querying the trust_score_config table
    console.log('\n🧪 Testing database setup...');
    const { data: configTestData, error: configError } = await supabase
      .from('trust_score_config')
      .select('parameter_name, parameter_value')
      .limit(3);

    if (configError) {
      console.error('❌ Error testing trust_score_config:', configError);
      console.log('\n📋 Manual Setup Required:');
      console.log('Please go to your Supabase dashboard and create the following tables:');
      console.log('\n1. trust_score_config table:');
      console.log(`
CREATE TABLE trust_score_config (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  parameter_name VARCHAR(50) UNIQUE NOT NULL,
  parameter_value DECIMAL(10,2) NOT NULL,
  description TEXT,
  updated_by UUID,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
      `);
      
      console.log('\n2. agency_trust_scores table:');
      console.log(`
CREATE TABLE agency_trust_scores (
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
      `);

      console.log('\n3. trust_score_events table:');
      console.log(`
CREATE TABLE trust_score_events (
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
      `);

      console.log('\n4. zkp_license_proofs table:');
      console.log(`
CREATE TABLE zkp_license_proofs (
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
      `);

      console.log('\n5. zkp_verification_keys table:');
      console.log(`
CREATE TABLE zkp_verification_keys (
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
      `);

      console.log('\n6. zkp_merkle_trees table:');
      console.log(`
CREATE TABLE zkp_merkle_trees (
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
      `);

      console.log('\nThen insert the configuration data:');
      configData.forEach(config => {
        console.log(`INSERT INTO trust_score_config (parameter_name, parameter_value, description) VALUES ('${config.parameter_name}', ${config.parameter_value}, '${config.description}');`);
      });

    } else {
      console.log('✅ Trust score config table is working!');
      console.log('Sample config:', configTestData);
      
      // Test other tables
      const tables = [
        'agency_trust_scores',
        'trust_score_events', 
        'zkp_license_proofs',
        'zkp_verification_keys',
        'zkp_merkle_trees'
      ];

      for (const table of tables) {
        const { data, error } = await supabase
          .from(table)
          .select('*')
          .limit(1);

        if (error) {
          console.log(`⚠️  Table ${table}: ${error.message}`);
        } else {
          console.log(`✅ Table ${table} is accessible`);
        }
      }
    }

    console.log('\n🎉 Phase 6 database setup completed!');
    console.log('You can now start the API server with: npm run api:dev');

  } catch (error) {
    console.error('❌ Error setting up Phase 6 database:', error);
  }
}

// Run the setup
setupPhase6Database();
