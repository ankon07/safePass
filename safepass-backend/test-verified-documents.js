const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

async function testVerifiedDocuments() {
  console.log('🔍 Testing verified documents workflow...\n');

  try {
    // 1. Check current document uploads
    console.log('1. Checking current document uploads:');
    const { data: allDocs, error: allDocsError } = await supabase
      .from('document_uploads')
      .select('*')
      .order('created_at', { ascending: false });

    if (allDocsError) {
      console.error('Error fetching documents:', allDocsError);
      return;
    }

    console.log(`   Found ${allDocs?.length || 0} total documents`);
    if (allDocs && allDocs.length > 0) {
      const statusCounts = allDocs.reduce((acc, doc) => {
        acc[doc.status] = (acc[doc.status] || 0) + 1;
        return acc;
      }, {});
      console.log('   Status breakdown:', statusCounts);
    }

    // 2. Check verified documents specifically
    console.log('\n2. Checking verified documents:');
    const { data: verifiedDocs, error: verifiedError } = await supabase
      .from('document_uploads')
      .select(`
        *,
        worker:users!document_uploads_user_id_fkey(
          id,
          name,
          email,
          did
        ),
        reviewer:users!document_uploads_reviewer_id_fkey(
          id,
          name,
          email
        ),
        verifiable_credentials(
          id,
          type,
          issuance_date,
          issuer_did,
          raw_vc_jwt
        )
      `)
      .eq('status', 'Verified');

    if (verifiedError) {
      console.error('Error fetching verified documents:', verifiedError);
      return;
    }

    console.log(`   Found ${verifiedDocs?.length || 0} verified documents`);
    
    if (verifiedDocs && verifiedDocs.length > 0) {
      verifiedDocs.forEach((doc, index) => {
        console.log(`\n   Document ${index + 1}:`);
        console.log(`     ID: ${doc.id}`);
        console.log(`     Type: ${doc.document_type}`);
        console.log(`     Worker: ${doc.worker?.name || 'Unknown'} (${doc.worker?.email || 'N/A'})`);
        console.log(`     Reviewer: ${doc.reviewer?.name || 'Unknown'}`);
        console.log(`     Verified: ${doc.reviewed_at || 'N/A'}`);
        console.log(`     Has Credential: ${doc.verifiable_credentials?.length > 0 ? 'Yes' : 'No'}`);
        if (doc.verifiable_credentials?.length > 0) {
          console.log(`     Credential Type: ${doc.verifiable_credentials[0].type}`);
        }
      });
    }

    // 3. Check verifiable credentials
    console.log('\n3. Checking verifiable credentials:');
    const { data: credentials, error: credError } = await supabase
      .from('verifiable_credentials')
      .select('*')
      .order('issuance_date', { ascending: false });

    if (credError) {
      console.error('Error fetching credentials:', credError);
      return;
    }

    console.log(`   Found ${credentials?.length || 0} verifiable credentials`);

    // 4. Check users
    console.log('\n4. Checking users:');
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, name, email, role')
      .order('created_at', { ascending: false });

    if (usersError) {
      console.error('Error fetching users:', usersError);
      return;
    }

    console.log(`   Found ${users?.length || 0} users`);
    if (users && users.length > 0) {
      const roleCounts = users.reduce((acc, user) => {
        acc[user.role] = (acc[user.role] || 0) + 1;
        return acc;
      }, {});
      console.log('   Role breakdown:', roleCounts);
    }

    // 5. If no verified documents, suggest creating some test data
    if (!verifiedDocs || verifiedDocs.length === 0) {
      console.log('\n⚠️  No verified documents found!');
      console.log('   To test the workflow:');
      console.log('   1. Upload a document as a Worker');
      console.log('   2. Use the /api/regulator/issue-credential endpoint to verify it');
      console.log('   3. Check the verified documents page');
    } else {
      console.log('\n✅ Verified documents found! The API should work correctly.');
    }

  } catch (error) {
    console.error('Test failed:', error);
  }
}

testVerifiedDocuments();
