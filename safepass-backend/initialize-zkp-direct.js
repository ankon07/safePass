const { supabase } = require('./src/config/supabase');

async function initializeZKPSystemDirect() {
    console.log('🚀 Initializing ZKP System Directly...\n');

    try {
        // Step 1: Get a regulator user
        console.log('1. Finding a regulator user...');
        const { data: regulators, error: regulatorError } = await supabase
            .from('users')
            .select('id, name, email, role')
            .eq('role', 'Regulator')
            .limit(1);

        if (regulatorError || !regulators || regulators.length === 0) {
            console.error('❌ No regulator found:', regulatorError);
            return;
        }

        const regulator = regulators[0];
        console.log('✅ Found regulator:', regulator.name, `(${regulator.email})`);

        // Step 2: Check if valid licenses already exist
        console.log('\n2. Checking existing valid licenses...');
        const { data: existingLicenses, error: checkError } = await supabase
            .from('zkp_merkle_trees')
            .select('*')
            .eq('tree_name', 'valid_licenses')
            .eq('is_current', true);

        if (checkError) {
            console.error('❌ Error checking existing licenses:', checkError);
            return;
        }

        if (existingLicenses && existingLicenses.length > 0) {
            console.log('✅ Valid licenses already exist:', existingLicenses[0].tree_data);
        } else {
            // Step 3: Initialize with sample valid licenses
            console.log('\n3. Initializing with sample valid licenses...');
            
            const sampleLicenses = [
                'LICENSE001',
                'LICENSE002', 
                'LICENSE003',
                'LICENSE004',
                'LICENSE005'
            ];

            console.log('Adding valid licenses to database...');
            const { data: treeData, error: treeError } = await supabase
                .from('zkp_merkle_trees')
                .insert({
                    tree_name: 'valid_licenses',
                    tree_data: { validLicenses: sampleLicenses },
                    leaf_count: sampleLicenses.length,
                    tree_height: Math.ceil(Math.log2(Math.max(sampleLicenses.length, 1))),
                    is_current: true,
                    merkle_root: 'simple_list',
                    created_by: regulator.id
                });

            if (treeError) {
                console.error('❌ Error adding licenses to database:', treeError);
                return;
            }

            console.log('✅ Valid licenses added to database successfully');
        }

        // Step 4: Verify the setup
        console.log('\n4. Verifying ZKP system setup...');
        const { data: verifyLicenses, error: verifyError } = await supabase
            .from('zkp_merkle_trees')
            .select('*')
            .eq('tree_name', 'valid_licenses')
            .eq('is_current', true)
            .single();

        if (verifyError || !verifyLicenses) {
            console.error('❌ Error verifying setup:', verifyError);
            return;
        }

        console.log('✅ ZKP system verified successfully!');
        console.log('Valid licenses:', verifyLicenses.tree_data.validLicenses);

        // Step 5: Get test users for demonstration
        console.log('\n5. Getting test users for demonstration...');
        
        const { data: agencies, error: agencyError } = await supabase
            .from('users')
            .select('id, name, email, role, blockchain_address')
            .eq('role', 'AgencyAdmin')
            .limit(2);

        const { data: workers, error: workerError } = await supabase
            .from('users')
            .select('id, name, email, role')
            .eq('role', 'Worker')
            .limit(2);

        if (agencyError || workerError) {
            console.error('❌ Error getting test users:', agencyError || workerError);
            return;
        }

        console.log('\n📋 ZKP System Ready! Summary:');
        console.log(`   🏛️  Regulator: ${regulator.name} (ID: ${regulator.id})`);
        console.log(`   📜 Valid Licenses: ${verifyLicenses.tree_data.validLicenses.join(', ')}`);
        
        if (agencies && agencies.length > 0) {
            console.log(`   🏢 Test Agencies:`);
            agencies.forEach(agency => {
                console.log(`      - ${agency.name} (ID: ${agency.id}, Address: ${agency.blockchain_address || 'N/A'})`);
            });
        }

        if (workers && workers.length > 0) {
            console.log(`   👷 Test Workers:`);
            workers.forEach(worker => {
                console.log(`      - ${worker.name} (ID: ${worker.id})`);
            });
        }

        console.log('\n✅ ZKP system initialization completed successfully!');
        console.log('\n🔧 Next steps:');
        console.log('   1. Regulator can generate proofs for agencies using /api/zkp/generate-agency-proof');
        console.log('   2. Workers can verify agency licenses using /api/zkp/verify-license-by-proof-id');
        console.log('   3. System is ready for regulator-controlled proof generation!');

    } catch (error) {
        console.error('❌ Error during ZKP initialization:', error);
    }
}

// Run the initialization
initializeZKPSystemDirect();
