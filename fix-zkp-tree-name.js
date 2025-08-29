const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

async function fixZKPTreeName() {
  console.log('🔧 Fixing ZKP tree name mismatch...');

  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY
  );

  try {
    // Update the existing tree name to match what the service expects
    console.log('📝 Updating Merkle tree name...');
    
    const { data: updateData, error: updateError } = await supabase
      .from('zkp_merkle_trees')
      .update({ tree_name: 'license_verification' })
      .eq('tree_name', 'license_registry_v1');

    if (updateError) {
      console.log('⚠️  Tree name update failed:', updateError.message);
    } else {
      console.log('✅ Merkle tree name updated to license_verification');
    }

    // Update the verification key circuit name to match
    console.log('🔑 Updating verification key circuit name...');
    
    const { data: vkUpdateData, error: vkUpdateError } = await supabase
      .from('zkp_verification_keys')
      .update({ circuit_name: 'licenseVerifier' })
      .eq('circuit_name', 'license_verification');

    if (vkUpdateError) {
      console.log('⚠️  Verification key update failed:', vkUpdateError.message);
    } else {
      console.log('✅ Verification key circuit name updated to licenseVerifier');
    }

    // Test the queries that were failing
    console.log('\n🧪 Testing ZKP queries...');
    
    // Test current Merkle root query
    const { data: merkleRootData, error: merkleRootError } = await supabase
      .from('zkp_merkle_trees')
      .select('merkle_root, tree_name')
      .eq('tree_name', 'license_verification')
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

    // Test verification key query
    const { data: vkQueryData, error: vkQueryError } = await supabase
      .from('zkp_verification_keys')
      .select('circuit_name, version, key_type')
      .eq('circuit_name', 'licenseVerifier')
      .eq('key_type', 'verification_key')
      .eq('is_active', true)
      .limit(1);

    if (vkQueryError) {
      console.log('❌ Verification key query failed:', vkQueryError.message);
    } else {
      console.log(`✅ Verification key query working (${vkQueryData?.length || 0} records)`);
      if (vkQueryData && vkQueryData.length > 0) {
        console.log('🔑 Found key:', vkQueryData[0]);
      }
    }

    console.log('\n🎉 ZKP system fixes completed!');
    console.log('🔄 The ZKP endpoints should now work properly');

  } catch (error) {
    console.error('❌ Error fixing ZKP system:', error);
  }
}

// Run the fixes
fixZKPTreeName();
