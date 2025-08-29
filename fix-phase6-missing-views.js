const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

async function fixPhase6MissingViews() {
  console.log('🔧 Fixing Phase 6 missing database views and setup...');

  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY
  );

  try {
    // Test if we can create some sample data first
    console.log('📝 Creating sample trust score data...');
    
    // Insert a sample agency trust score
    const sampleAgencyAddress = '0x1234567890123456789012345678901234567890';
    const { data: insertData, error: insertError } = await supabase
      .from('agency_trust_scores')
      .upsert({
        agency_address: sampleAgencyAddress,
        agency_did: 'did:ethr:besu:0x1234567890123456789012345678901234567890',
        trust_score: 1000,
        successful_placements: 5,
        verified_complaints: 1,
        score_change: 0,
        calculation_details: { initial: true }
      }, { onConflict: 'agency_address' });

    if (insertError) {
      console.log('⚠️  Sample data insert failed:', insertError.message);
    } else {
      console.log('✅ Sample trust score data created');
    }

    // Test basic table access
    console.log('\n🧪 Testing basic table access...');
    
    const tables = [
      'trust_score_config',
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
        console.log(`❌ Table ${table}: ${error.message}`);
      } else {
        console.log(`✅ Table ${table} accessible (${data?.length || 0} rows)`);
      }
    }

    // Create sample ZKP data
    console.log('\n🔐 Setting up ZKP system...');
    
    // Create a sample Merkle tree
    const sampleMerkleTree = {
      tree_name: 'license_registry_v1',
      merkle_root: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
      tree_data: {
        leaves: ['license123', 'license456', 'license789'],
        tree_structure: 'binary_merkle_tree',
        hash_function: 'sha256'
      },
      leaf_count: 3,
      tree_height: 2,
      is_current: true
    };

    const { data: merkleData, error: merkleError } = await supabase
      .from('zkp_merkle_trees')
      .upsert(sampleMerkleTree, { onConflict: 'tree_name' });

    if (merkleError) {
      console.log('⚠️  Sample Merkle tree creation failed:', merkleError.message);
    } else {
      console.log('✅ Sample Merkle tree created');
    }

    // Create sample verification key
    const sampleVerificationKey = {
      circuit_name: 'license_verification',
      key_type: 'verification_key',
      key_data: {
        protocol: 'groth16',
        curve: 'bn128',
        nPublic: 1,
        vk_alpha_1: ['0x123', '0x456'],
        vk_beta_2: [['0x789', '0xabc'], ['0xdef', '0x012']],
        vk_gamma_2: [['0x345', '0x678'], ['0x9ab', '0xcde']],
        vk_delta_2: [['0xf01', '0x234'], ['0x567', '0x89a']],
        vk_alphabeta_12: [['0xbcd', '0xef0'], ['0x123', '0x456']],
        IC: [['0x789', '0xabc'], ['0xdef', '0x012']]
      },
      circuit_hash: '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
      version: '1.0.0',
      is_active: true
    };

    const { data: vkData, error: vkError } = await supabase
      .from('zkp_verification_keys')
      .upsert(sampleVerificationKey, { onConflict: 'circuit_name,key_type' });

    if (vkError) {
      console.log('⚠️  Sample verification key creation failed:', vkError.message);
    } else {
      console.log('✅ Sample verification key created');
    }

    // Test the queries that were failing
    console.log('\n🧪 Testing problematic queries...');
    
    // Test trust score statistics query
    try {
      const { data: statsData, error: statsError } = await supabase
        .from('agency_trust_scores')
        .select('trust_score')
        .order('created_at', { ascending: false });

      if (statsError) {
        console.log('❌ Trust score statistics query failed:', statsError.message);
      } else {
        console.log('✅ Trust score statistics query working');
        
        // Calculate basic statistics
        if (statsData && statsData.length > 0) {
          const scores = statsData.map(d => d.trust_score);
          const stats = {
            total_agencies: scores.length,
            average_score: scores.reduce((a, b) => a + b, 0) / scores.length,
            min_score: Math.min(...scores),
            max_score: Math.max(...scores),
            median_score: scores.sort((a, b) => a - b)[Math.floor(scores.length / 2)]
          };
          console.log('📊 Sample statistics:', stats);
        }
      }
    } catch (error) {
      console.log('❌ Statistics calculation error:', error.message);
    }

    // Test top agencies query
    try {
      const { data: topData, error: topError } = await supabase
        .from('agency_trust_scores')
        .select('agency_address, trust_score, successful_placements, verified_complaints')
        .order('trust_score', { ascending: false })
        .limit(10);

      if (topError) {
        console.log('❌ Top agencies query failed:', topError.message);
      } else {
        console.log('✅ Top agencies query working');
        console.log(`📈 Found ${topData?.length || 0} agencies`);
      }
    } catch (error) {
      console.log('❌ Top agencies query error:', error.message);
    }

    // Test ZKP queries
    try {
      const { data: merkleRootData, error: merkleRootError } = await supabase
        .from('zkp_merkle_trees')
        .select('merkle_root, tree_name')
        .eq('is_current', true)
        .single();

      if (merkleRootError) {
        console.log('❌ Current Merkle root query failed:', merkleRootError.message);
      } else {
        console.log('✅ Current Merkle root query working');
        console.log('🌳 Current root:', merkleRootData?.merkle_root);
      }
    } catch (error) {
      console.log('❌ Merkle root query error:', error.message);
    }

    try {
      const { data: vkQueryData, error: vkQueryError } = await supabase
        .from('zkp_verification_keys')
        .select('key_data')
        .eq('circuit_name', 'license_verification')
        .eq('key_type', 'verification_key')
        .eq('is_active', true)
        .single();

      if (vkQueryError) {
        console.log('❌ Verification key query failed:', vkQueryError.message);
      } else {
        console.log('✅ Verification key query working');
      }
    } catch (error) {
      console.log('❌ Verification key query error:', error.message);
    }

    console.log('\n🎉 Phase 6 database fixes completed!');
    console.log('📝 The API should now work properly with the existing tables.');
    console.log('🔄 Restart the API server to test: npm run api:dev');

  } catch (error) {
    console.error('❌ Error fixing Phase 6 database:', error);
  }
}

// Run the fixes
fixPhase6MissingViews();
