const { supabase } = require('./src/config/supabase');

async function updateValidLicenses() {
    console.log('🔄 Updating valid licenses for ZKP compatibility...\n');

    try {
        // Step 1: Get a regulator user
        console.log('1. Finding a regulator user...');
        const { data: regulator, error: regulatorError } = await supabase
            .from('users')
            .select('id, name, email, role')
            .eq('role', 'Regulator')
            .limit(1)
            .single();

        if (regulatorError || !regulator) {
            console.error('❌ No regulator found:', regulatorError);
            return;
        }

        console.log('✅ Found regulator:', regulator.name, `(${regulator.email})`);

        // Step 2: Update with licenses that match the current database
        console.log('\n2. Updating valid licenses to match current database...');
        
        // Use the same licenses that are currently in the database but ensure they work with ZKP
        const updatedLicenses = [
            'LIC2100411',  // These will be converted to numbers by the ZKP service
            'LIC2100410',
            'LIC2100415',
            'LICENSE001',  // Add some additional test licenses
            'LICENSE002'
        ];

        // Clear existing valid licenses
        await supabase
            .from('zkp_merkle_trees')
            .delete()
            .eq('tree_name', 'valid_licenses');

        // Insert new valid licenses
        const { data: treeData, error: treeError } = await supabase
            .from('zkp_merkle_trees')
            .insert({
                tree_name: 'valid_licenses',
                tree_data: { validLicenses: updatedLicenses },
                leaf_count: updatedLicenses.length,
                tree_height: Math.ceil(Math.log2(Math.max(updatedLicenses.length, 1))),
                is_current: true,
                merkle_root: 'simple_list',
                created_by: regulator.id
            });

        if (treeError) {
            console.error('❌ Error updating licenses:', treeError);
            return;
        }

        console.log('✅ Valid licenses updated successfully');
        console.log('Updated licenses:', updatedLicenses);

        // Step 3: Verify the update
        console.log('\n3. Verifying the update...');
        const verifyResponse = await fetch('http://localhost:3001/api/zkp/valid-licenses');
        
        if (verifyResponse.ok) {
            const verifyData = await verifyResponse.json();
            console.log('✅ Verified licenses via API:', verifyData);
        } else {
            console.log('⚠️  Could not verify via API, but database update was successful');
        }

        console.log('\n🎉 License update completed successfully!');
        console.log('\n📋 Summary:');
        console.log('   - Updated valid licenses to include current database licenses');
        console.log('   - ZKP service will convert these to numbers automatically');
        console.log('   - System ready for real ZKP proof generation');

    } catch (error) {
        console.error('❌ Error updating valid licenses:', error);
    }
}

// Run the update
updateValidLicenses();
