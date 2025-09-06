const { supabase } = require('./src/config/supabase');

async function testAgencyUsers() {
    console.log('🔍 Testing agency users in database...');
    
    try {
        // Check all users
        console.log('\n📋 All users in database:');
        const { data: allUsers, error: allUsersError } = await supabase
            .from('users')
            .select('id, name, email, role, created_at');
            
        if (allUsersError) {
            console.error('❌ Error fetching all users:', allUsersError);
        } else {
            console.log(`Found ${allUsers.length} total users:`);
            allUsers.forEach(user => {
                console.log(`  - ${user.name} (${user.email}) - Role: ${user.role} - ID: ${user.id}`);
            });
        }
        
        // Check specifically for AgencyAdmin users
        console.log('\n🏢 AgencyAdmin users:');
        const { data: agencyUsers, error: agencyError } = await supabase
            .from('users')
            .select('id, name, email, role, blockchain_address, created_at')
            .eq('role', 'AgencyAdmin');
            
        if (agencyError) {
            console.error('❌ Error fetching agency users:', agencyError);
        } else {
            console.log(`Found ${agencyUsers.length} AgencyAdmin users:`);
            agencyUsers.forEach(user => {
                console.log(`  - ${user.name} (${user.email}) - ID: ${user.id}`);
                console.log(`    Blockchain Address: ${user.blockchain_address || 'Not set'}`);
            });
        }
        
        // If no agency users exist, create some test data
        if (!agencyUsers || agencyUsers.length === 0) {
            console.log('\n🔧 No AgencyAdmin users found. Creating test agency users...');
            
            const testAgencies = [
                {
                    name: 'Astro Employment Agency',
                    email: 'astro@safepass.com',
                    role: 'AgencyAdmin',
                    blockchain_address: '0x1234567890123456789012345678901234567890'
                },
                {
                    name: 'Global Workforce Solutions',
                    email: 'global@safepass.com', 
                    role: 'AgencyAdmin',
                    blockchain_address: '0x2345678901234567890123456789012345678901'
                },
                {
                    name: 'Premier Staffing Agency',
                    email: 'premier@safepass.com',
                    role: 'AgencyAdmin', 
                    blockchain_address: '0x3456789012345678901234567890123456789012'
                }
            ];
            
            for (const agency of testAgencies) {
                const { data: newUser, error: createError } = await supabase
                    .from('users')
                    .insert(agency)
                    .select()
                    .single();
                    
                if (createError) {
                    console.error(`❌ Error creating ${agency.name}:`, createError);
                } else {
                    console.log(`✅ Created agency: ${newUser.name} (ID: ${newUser.id})`);
                }
            }
        }
        
        console.log('\n✅ Agency user test completed!');
        
    } catch (error) {
        console.error('❌ Unexpected error:', error);
    }
}

// Run the test
testAgencyUsers().then(() => {
    console.log('🏁 Test finished');
    process.exit(0);
}).catch(error => {
    console.error('💥 Test failed:', error);
    process.exit(1);
});
