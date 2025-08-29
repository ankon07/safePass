const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

async function fixPhase6Simple() {
  console.log('🔧 Fixing Phase 6 with simple inserts...');

  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY
  );

  try {
    // Insert sample trust score data
    console.log('📝 Creating sample trust score data...');
    
    const sampleAgencyAddress = '0x1234567890123456789012345678901234567890';
    const { data: insertData, error: insertError } = await supabase
      .from('agency_trust_scores')
      .insert({
        agency_address: sampleAgencyAddress,
        agency_did: 'did:ethr:besu:0x1234567890123456789012345678901234567890',
        trust_score: 1000,
        successful_placements: 5,
        verified_complaints: 1,
        score_change: 0,
        calculation_details: { initial: true }
      });

    if (insertError) {
      console.log('⚠️  Sample data insert failed:', insertError.message);
    } else {
      console.log('✅ Sample trust score data created');
    }

    // Insert sample ZKP Merkle tree
    console.log('🌳 Creating sample Merkle tree...');
    
    const { data: merkleData, error: merkleError } = await supabase
      .from('zkp_merkle_trees')
      .insert({
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
      });

    if (merkleError) {
      console.log('⚠️  Sample Merkle tree creation failed:', merkleError.message);
    } else {
      console.log('✅ Sample Merkle tree created');
    }

    // Insert sample verification key
    console.log('🔑 Creating sample verification key...');
    
    const { data: vkData, error: vkError } = await supabase
      .from('zkp_verification_keys')
      .insert({
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
      });

    if (vkError) {
      console.log('⚠️  Sample verification key creation failed:', vkError.message);
    } else {
      console.log('✅ Sample verification key created');
    }

    // Test the queries
    console.log('\n🧪 Testing queries...');
    
    // Test trust score queries
    const { data: trustData, error: trustError } = await supabase
      .from('agency_trust_scores')
      .select('*')
      .limit(5);

    if (trustError) {
      console.log('❌ Trust score query failed:', trustError.message);
    } else {
      console.log(`✅ Trust score query working (${trustData?.length || 0} records)`);
    }

    // Test ZKP queries
    const { data: merkleRootData, error: merkleRootError } = await supabase
      .from('zkp_merkle_trees')
      .select('merkle_root, tree_name')
      .eq('is_current', true)
      .limit(1);

    if (merkleRootError) {
      console.log('❌ Merkle root query failed:', merkleRootError.message);
    } else {
      console.log(`✅ Merkle root query working (${merkleRootData?.length || 0} records)`);
      if (merkleRootData && merkleRootData.length > 0) {
        console.log('🌳 Current root:', merkleRootData[0].merkle_root);
      }
    }

    const { data: vkQueryData, error: vkQueryError } = await supabase
      .from('zkp_verification_keys')
      .select('circuit_name, version')
      .eq('circuit_name', 'license_verification')
      .eq('is_active', true)
      .limit(1);

    if (vkQueryError) {
      console.log('❌ Verification key query failed:', vkQueryError.message);
    } else {
      console.log(`✅ Verification key query working (${vkQueryData?.length || 0} records)`);
    }

    console.log('\n🎉 Phase 6 database setup completed!');
    console.log('🔄 Now restart the API server and run tests again');

  } catch (error) {
    console.error('❌ Error fixing Phase 6 database:', error);
  }
}

// Run the fixes
fixPhase6Simple();
