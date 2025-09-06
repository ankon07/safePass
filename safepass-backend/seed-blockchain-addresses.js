const { supabase } = require('./src/config/supabase');
const crypto = require('crypto');

/**
 * Generate a random Ethereum-style blockchain address
 * @returns {string} A random 42-character hex address starting with 0x
 */
function generateRandomBlockchainAddress() {
    // Generate 20 random bytes (40 hex characters)
    const randomBytes = crypto.randomBytes(20);
    // Convert to hex and prepend with 0x
    return '0x' + randomBytes.toString('hex');
}

/**
 * Generate multiple unique blockchain addresses
 * @param {number} count - Number of addresses to generate
 * @returns {string[]} Array of unique blockchain addresses
 */
function generateUniqueAddresses(count) {
    const addresses = new Set();
    while (addresses.size < count) {
        addresses.add(generateRandomBlockchainAddress());
    }
    return Array.from(addresses);
}

async function seedBlockchainAddresses() {
    console.log('🔗 Starting blockchain address seeding...');
    
    try {
        // First, check if blockchain_address column exists
        console.log('\n📋 Checking database schema...');
        
        // Get all users without blockchain addresses
        const { data: users, error: usersError } = await supabase
            .from('users')
            .select('id, name, email, role')
            .is('blockchain_address', null);
            
        if (usersError) {
            console.log('⚠️  blockchain_address column might not exist. Checking all users...');
            
            // Try to get users without the blockchain_address column
            const { data: allUsers, error: allUsersError } = await supabase
                .from('users')
                .select('id, name, email, role');
                
            if (allUsersError) {
                throw new Error('Failed to fetch users: ' + allUsersError.message);
            }
            
            console.log(`📊 Found ${allUsers.length} users in database`);
            console.log('🔧 Need to add blockchain_address column to users table');
            
            // Add blockchain_address column to users table
            console.log('\n🛠️  Adding blockchain_address column...');
            const { error: alterError } = await supabase.rpc('exec_sql', {
                sql: 'ALTER TABLE users ADD COLUMN IF NOT EXISTS blockchain_address VARCHAR(42);'
            });
            
            if (alterError) {
                console.log('⚠️  Could not add column via RPC. You may need to add it manually:');
                console.log('   ALTER TABLE users ADD COLUMN blockchain_address VARCHAR(42);');
            } else {
                console.log('✅ blockchain_address column added successfully');
            }
            
            // Now update all users with blockchain addresses
            await updateUsersWithAddresses(allUsers);
            
        } else {
            console.log(`📊 Found ${users.length} users without blockchain addresses`);
            await updateUsersWithAddresses(users);
        }
        
        // Verify the results
        console.log('\n🔍 Verifying results...');
        const { data: updatedUsers, error: verifyError } = await supabase
            .from('users')
            .select('id, name, email, role, blockchain_address');
            
        if (verifyError) {
            console.error('❌ Error verifying results:', verifyError);
        } else {
            console.log(`✅ Successfully verified ${updatedUsers.length} users with blockchain addresses:`);
            updatedUsers.forEach(user => {
                console.log(`  - ${user.name} (${user.role}): ${user.blockchain_address || 'NOT SET'}`);
            });
        }
        
        console.log('\n🎉 Blockchain address seeding completed!');
        
    } catch (error) {
        console.error('❌ Error during blockchain address seeding:', error);
        throw error;
    }
}

async function updateUsersWithAddresses(users) {
    if (users.length === 0) {
        console.log('ℹ️  No users to update');
        return;
    }
    
    console.log(`\n🔗 Generating ${users.length} unique blockchain addresses...`);
    const addresses = generateUniqueAddresses(users.length);
    
    console.log('📝 Updating users with blockchain addresses...');
    
    for (let i = 0; i < users.length; i++) {
        const user = users[i];
        const address = addresses[i];
        
        const { error: updateError } = await supabase
            .from('users')
            .update({ blockchain_address: address })
            .eq('id', user.id);
            
        if (updateError) {
            console.error(`❌ Error updating ${user.name}:`, updateError);
        } else {
            console.log(`✅ Updated ${user.name} (${user.role}): ${address}`);
        }
    }
}

// Additional utility functions for blockchain address management
async function generateAddressForNewUser(userId, userName) {
    console.log(`🔗 Generating blockchain address for new user: ${userName}`);
    
    const address = generateRandomBlockchainAddress();
    
    const { error } = await supabase
        .from('users')
        .update({ blockchain_address: address })
        .eq('id', userId);
        
    if (error) {
        console.error(`❌ Error setting address for ${userName}:`, error);
        throw error;
    }
    
    console.log(`✅ Generated address for ${userName}: ${address}`);
    return address;
}

async function validateBlockchainAddress(address) {
    // Basic Ethereum address validation
    const ethAddressRegex = /^0x[a-fA-F0-9]{40}$/;
    return ethAddressRegex.test(address);
}

// Export functions for use in other modules
module.exports = {
    generateRandomBlockchainAddress,
    generateUniqueAddresses,
    generateAddressForNewUser,
    validateBlockchainAddress,
    seedBlockchainAddresses
};

// Run seeding if this file is executed directly
if (require.main === module) {
    seedBlockchainAddresses()
        .then(() => {
            console.log('🏁 Seeding process completed successfully');
            process.exit(0);
        })
        .catch(error => {
            console.error('💥 Seeding process failed:', error);
            process.exit(1);
        });
}
