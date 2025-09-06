const { supabase } = require('./src/config/supabase');
const fs = require('fs');
const path = require('path');

async function applyZKPSchema() {
    try {
        console.log('🔧 Applying ZKP database schema...');
        
        // Read the ZKP schema file
        const schemaPath = path.join(__dirname, 'zkp-schema.sql');
        const schemaSQL = fs.readFileSync(schemaPath, 'utf8');
        
        // Split the schema into individual statements
        const statements = schemaSQL
            .split(';')
            .map(stmt => stmt.trim())
            .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
        
        console.log(`📝 Found ${statements.length} SQL statements to execute`);
        
        // Execute each statement
        for (let i = 0; i < statements.length; i++) {
            const statement = statements[i];
            if (statement.trim()) {
                try {
                    console.log(`⚡ Executing statement ${i + 1}/${statements.length}...`);
                    const { error } = await supabase.rpc('exec_sql', { sql: statement });
                    
                    if (error) {
                        // Some errors are expected (like "already exists" errors)
                        if (error.message.includes('already exists') || 
                            error.message.includes('does not exist') ||
                            error.message.includes('duplicate key')) {
                            console.log(`⚠️  Expected error (continuing): ${error.message}`);
                        } else {
                            console.error(`❌ Error executing statement: ${error.message}`);
                            console.error(`Statement: ${statement.substring(0, 100)}...`);
                        }
                    } else {
                        console.log(`✅ Statement ${i + 1} executed successfully`);
                    }
                } catch (execError) {
                    console.error(`❌ Exception executing statement ${i + 1}:`, execError.message);
                    console.error(`Statement: ${statement.substring(0, 100)}...`);
                }
            }
        }
        
        // Verify the tables were created
        console.log('\n🔍 Verifying ZKP tables...');
        
        // Check zkp_merkle_trees table
        const { data: merkleTreesData, error: merkleTreesError } = await supabase
            .from('zkp_merkle_trees')
            .select('count')
            .limit(1);
            
        if (merkleTreesError) {
            console.error('❌ zkp_merkle_trees table not accessible:', merkleTreesError.message);
        } else {
            console.log('✅ zkp_merkle_trees table is accessible');
        }
        
        // Check zkp_license_proofs table
        const { data: proofsData, error: proofsError } = await supabase
            .from('zkp_license_proofs')
            .select('count')
            .limit(1);
            
        if (proofsError) {
            console.error('❌ zkp_license_proofs table not accessible:', proofsError.message);
        } else {
            console.log('✅ zkp_license_proofs table is accessible');
        }
        
        console.log('\n🎉 ZKP schema application completed!');
        
    } catch (error) {
        console.error('❌ Error applying ZKP schema:', error);
        throw error;
    }
}

// Run the schema application
if (require.main === module) {
    applyZKPSchema()
        .then(() => {
            console.log('✅ ZKP schema applied successfully');
            process.exit(0);
        })
        .catch((error) => {
            console.error('❌ Failed to apply ZKP schema:', error);
            process.exit(1);
        });
}

module.exports = { applyZKPSchema };
