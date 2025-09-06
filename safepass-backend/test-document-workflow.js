const { supabase } = require('./src/config/supabase');

async function testDocumentWorkflow() {
    console.log('🧪 Testing Document Workflow...\n');

    try {
        // 1. Check pending documents
        console.log('1. Checking pending documents...');
        const { data: pendingDocs, error: pendingError } = await supabase
            .from('document_uploads')
            .select('*')
            .eq('status', 'PendingVerification');

        if (pendingError) {
            console.error('Error fetching pending documents:', pendingError);
            return;
        }

        console.log(`Found ${pendingDocs.length} pending documents:`);
        pendingDocs.forEach(doc => {
            console.log(`  - ID: ${doc.id}, Type: ${doc.document_type}, Status: ${doc.status}`);
        });

        // 2. Check verified documents
        console.log('\n2. Checking verified documents...');
        const { data: verifiedDocs, error: verifiedError } = await supabase
            .from('document_uploads')
            .select('*')
            .eq('status', 'Verified');

        if (verifiedError) {
            console.error('Error fetching verified documents:', verifiedError);
            return;
        }

        console.log(`Found ${verifiedDocs.length} verified documents:`);
        verifiedDocs.forEach(doc => {
            console.log(`  - ID: ${doc.id}, Type: ${doc.document_type}, Status: ${doc.status}, Reviewed: ${doc.reviewed_at}`);
        });

        // 3. Check rejected documents
        console.log('\n3. Checking rejected documents...');
        const { data: rejectedDocs, error: rejectedError } = await supabase
            .from('document_uploads')
            .select('*')
            .eq('status', 'Rejected');

        if (rejectedError) {
            console.error('Error fetching rejected documents:', rejectedError);
            return;
        }

        console.log(`Found ${rejectedDocs.length} rejected documents:`);
        rejectedDocs.forEach(doc => {
            console.log(`  - ID: ${doc.id}, Type: ${doc.document_type}, Status: ${doc.status}, Reviewed: ${doc.reviewed_at}`);
        });

        console.log('\n✅ Document workflow test completed!');

    } catch (error) {
        console.error('❌ Test failed:', error);
    }
}

testDocumentWorkflow();
