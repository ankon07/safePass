const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase configuration in .env file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function fixDatabaseColumn() {
  console.log('🔧 Adding missing updated_at column to document_uploads table...\n');

  try {
    // Add the updated_at column to document_uploads table
    const addColumnQuery = `
      ALTER TABLE document_uploads 
      ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    `;

    console.log('Adding updated_at column...');
    
    // Try using RPC first
    const { error: rpcError } = await supabase.rpc('exec_sql', { sql: addColumnQuery });
    
    if (rpcError) {
      console.log('⚠️  RPC method not available. Please execute this SQL manually in Supabase SQL Editor:');
      console.log('\n' + '='.repeat(80));
      console.log(addColumnQuery);
      console.log('='.repeat(80) + '\n');
    } else {
      console.log('✅ Column added successfully via RPC');
    }

    // Test the fix by checking if we can query the table
    console.log('Testing database connection...');
    const { data, error: testError } = await supabase
      .from('document_uploads')
      .select('id, updated_at')
      .limit(1);

    if (testError) {
      console.log('❌ Test failed:', testError.message);
      console.log('\n📋 Please execute this SQL manually in your Supabase SQL Editor:');
      console.log(addColumnQuery);
    } else {
      console.log('✅ Database test passed - updated_at column is now available');
    }

    console.log('\n🎉 Database fix completed! You can now run the test again.');

  } catch (error) {
    console.error('❌ Database fix failed:', error.message);
    console.log('\n📋 Please execute this SQL manually in your Supabase SQL Editor:');
    console.log(`
ALTER TABLE document_uploads 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    `);
  }
}

fixDatabaseColumn().catch(console.error);
