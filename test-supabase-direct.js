const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

console.log('🔧 Testing direct Supabase operations...\n');
console.log('Supabase URL:', supabaseUrl);
console.log('Anon Key:', supabaseAnonKey ? `${supabaseAnonKey.substring(0, 20)}...` : 'NOT SET');

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testDirectOperations() {
  try {
    console.log('\n1. Testing basic connection...');
    
    // Test basic connection
    const { data: connectionTest, error: connectionError } = await supabase
      .from('users')
      .select('count(*)')
      .limit(1);

    if (connectionError) {
      console.log('❌ Connection test failed:', connectionError.message);
      console.log('Full error:', connectionError);
    } else {
      console.log('✅ Basic connection successful');
    }

    console.log('\n2. Testing document_uploads table...');
    
    // Test document_uploads table specifically
    const { data: docTest, error: docError } = await supabase
      .from('document_uploads')
      .select('*')
      .limit(1);

    if (docError) {
      console.log('❌ document_uploads table test failed:', docError.message);
      console.log('Full error:', docError);
      
      // Check if table exists
      console.log('\n3. Checking if document_uploads table exists...');
      const { data: tableCheck, error: tableError } = await supabase
        .rpc('exec_sql', { 
          sql: "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'document_uploads';" 
        });
      
      if (tableError) {
        console.log('❌ Cannot check table existence:', tableError.message);
      } else {
        console.log('Table check result:', tableCheck);
      }
    } else {
      console.log('✅ document_uploads table is accessible');
      console.log('Current records:', docTest?.length || 0);
    }

    console.log('\n4. Testing insert operation...');
    
    // Try to insert a test record
    const testUserId = '550e8400-e29b-41d4-a716-446655440000'; // Fake UUID for testing
    const { data: insertTest, error: insertError } = await supabase
      .from('document_uploads')
      .insert({
        user_id: testUserId,
        document_type: 'TestDocument',
        ipfs_cid: 'QmTestCID123',
        status: 'PendingVerification'
      })
      .select();

    if (insertError) {
      console.log('❌ Insert test failed:', insertError.message);
      console.log('Full error:', insertError);
      
      // Check if it's a foreign key constraint issue
      if (insertError.message.includes('foreign key')) {
        console.log('\n5. Checking users table for test user...');
        const { data: userCheck, error: userError } = await supabase
          .from('users')
          .select('id')
          .limit(5);
        
        if (userError) {
          console.log('❌ Cannot check users table:', userError.message);
        } else {
          console.log('Available user IDs:', userCheck?.map(u => u.id) || []);
        }
      }
    } else {
      console.log('✅ Insert test successful');
      console.log('Inserted record:', insertTest);
      
      // Clean up test record
      await supabase
        .from('document_uploads')
        .delete()
        .eq('ipfs_cid', 'QmTestCID123');
      console.log('✅ Test record cleaned up');
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

testDirectOperations();
