const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

async function fixDocumentStatus() {
  console.log('🔧 Fixing document status from "Approved" to "Verified"...\n');

  try {
    // 1. First, check current status
    console.log('1. Current document status:');
    const { data: allDocs, error: allDocsError } = await supabase
      .from('document_uploads')
      .select('id, status, document_type, created_at')
      .order('created_at', { ascending: false });

    if (allDocsError) {
      console.error('Error fetching documents:', allDocsError);
      return;
    }

    const statusCounts = allDocs.reduce((acc, doc) => {
      acc[doc.status] = (acc[doc.status] || 0) + 1;
      return acc;
    }, {});
    console.log('   Status breakdown:', statusCounts);

    // 2. Find documents with "Approved" status
    const approvedDocs = allDocs.filter(doc => doc.status === 'Approved');
    console.log(`\n2. Found ${approvedDocs.length} documents with "Approved" status`);

    if (approvedDocs.length === 0) {
      console.log('   No documents to update!');
      return;
    }

    // 3. Update "Approved" to "Verified"
    console.log('\n3. Updating documents from "Approved" to "Verified"...');
    
    const { data: updatedDocs, error: updateError } = await supabase
      .from('document_uploads')
      .update({ status: 'Verified' })
      .eq('status', 'Approved')
      .select('id, status, document_type');

    if (updateError) {
      console.error('Error updating documents:', updateError);
      return;
    }

    console.log(`   ✅ Successfully updated ${updatedDocs?.length || 0} documents`);

    // 4. Verify the update
    console.log('\n4. Verifying update:');
    const { data: verifiedDocs, error: verifyError } = await supabase
      .from('document_uploads')
      .select('id, status, document_type')
      .eq('status', 'Verified');

    if (verifyError) {
      console.error('Error verifying update:', verifyError);
      return;
    }

    console.log(`   Found ${verifiedDocs?.length || 0} documents with "Verified" status`);

    // 5. Show final status breakdown
    console.log('\n5. Final status breakdown:');
    const { data: finalDocs, error: finalError } = await supabase
      .from('document_uploads')
      .select('status');

    if (finalError) {
      console.error('Error fetching final status:', finalError);
      return;
    }

    const finalStatusCounts = finalDocs.reduce((acc, doc) => {
      acc[doc.status] = (acc[doc.status] || 0) + 1;
      return acc;
    }, {});
    console.log('   Final status breakdown:', finalStatusCounts);

    console.log('\n✅ Document status fix completed!');
    console.log('   Now the verified documents API should return data.');

  } catch (error) {
    console.error('Fix failed:', error);
  }
}

fixDocumentStatus();
