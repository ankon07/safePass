-- Update the document_uploads table constraint to use 'Verified' instead of 'Approved'
-- Run this in Supabase SQL Editor

-- Step 1: Drop the existing constraint
ALTER TABLE document_uploads DROP CONSTRAINT IF EXISTS document_uploads_status_check;

-- Step 2: Add the new constraint with 'Verified' instead of 'Approved'
ALTER TABLE document_uploads ADD CONSTRAINT document_uploads_status_check 
CHECK (status IN ('PendingVerification', 'Verified', 'Rejected'));

-- Step 3: Update existing 'Approved' documents to 'Verified'
UPDATE document_uploads 
SET status = 'Verified' 
WHERE status = 'Approved';

-- Step 4: Verify the changes
SELECT status, COUNT(*) as count 
FROM document_uploads 
GROUP BY status 
ORDER BY status;
