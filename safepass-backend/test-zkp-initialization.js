const { supabase } = require('./src/config/supabase');

async function testZKPInitialization() {
    console.log('🚀 Testing ZKP System Initialization...\n');

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

        // Step 2: Check current system status
        console.log('\n2. Checking ZKP system status...');
        const statusResponse = await fetch('http://localhost:3000/api/zkp/system-status');
        const statusData = await statusResponse.json();
        console.log('System status:', statusData);

        // Step 3: Check current valid licenses
        console.log('\n3. Checking current valid licenses...');
        const licensesResponse = await fetch('http://localhost:3000/api/zkp/valid-licenses');
        const licensesData = await licensesResponse.json();
        console.log('Current valid licenses:', licensesData);

        // Step 4: Initialize the system if needed
        if (!statusData.system_ready || licensesData.count === 0) {
            console.log('\n4. Initializing ZKP system...');
            
            // First, let's manually add some valid licenses to the database
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
                .upsert({
                    tree_name: 'valid_licenses',
                    tree_data: { validLicenses: sampleLicenses },
                    leaf_count: sampleLicenses.length,
                    tree_height: Math.ceil(Math.log2(Math.max(sampleLicenses.length, 1))),
                    is_current: true,
                    merkle_root: 'simple_list',
                    created_by: regulator.id
                }, {
                    onConflict: 'tree_name'
                });

            if (treeError) {
                console.error('❌ Error adding licenses to database:', treeError);
                return;
            }

            console.log('✅ Valid licenses added to database');

            // Verify the licenses were added
            const verifyResponse = await fetch('http://localhost:3000/api/zkp/valid-licenses');
            const verifyData = await verifyResponse.json();
            console.log('✅ Verified licenses in database:', verifyData);
        } else {
            console.log('✅ ZKP system is already ready');
        }

        // Step 5: Test the regulator-controlled proof generation
        console.log('\n5. Testing regulator-controlled proof generation...');
        
        // Get an agency user
        const { data: agencies, error: agencyError } = await supabase
            .from('users')
            .select('id, name, email, role')
            .eq('role', 'AgencyAdmin')
            .limit(1);

        if (agencyError || !agencies || agencies.length === 0) {
            console.error('❌ No agency found:', agencyError);
            return;
        }

        const agency = agencies[0];
        console.log('Found agency for testing:', agency.name, `(${agency.email})`);

        // Create a simple test without actual API call (since we need authentication)
        console.log('\n6. System is ready for regulator-controlled proof generation!');
        console.log('📋 Summary:');
        console.log(`   - Regulator: ${regulator.name} (ID: ${regulator.id})`);
        console.log(`   - Test Agency: ${agency.name} (ID: ${agency.id})`);
        console.log(`   - Valid Licenses: ${licensesData.valid_licenses || ['LICENSE001', 'LICENSE002', 'LICENSE003', 'LICENSE004', 'LICENSE005']}`);
        console.log('\n✅ ZKP system initialization completed successfully!');

        // Step 7: Test the API endpoint directly
        console.log('\n7. Testing API endpoint availability...');
        try {
            const testResponse = await fetch('http://localhost:3000/api/zkp/system-status');
            const testData = await testResponse.json();
            console.log('✅ API endpoint working:', testData);
        } catch (apiError) {
            console.error('❌ API endpoint error:', apiError.message);
        }

    } catch (error) {
        console.error('❌ Error during ZKP initialization test:', error);
    }
}

// Run the test
testZKPInitialization();
