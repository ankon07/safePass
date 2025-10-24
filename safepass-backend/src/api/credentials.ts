import { Router, Request, Response } from 'express';
import { supabase } from '../config/supabase';
import { authenticateToken } from '../middleware/auth';
import { getAgent } from '../services/identityService';
import { cache, cacheKeys, cacheInvalidation, CACHE_TTL } from '../middleware/cache';

const router = Router();

// Add requireRole middleware import
const requireRole = (roles: string[]) => {
    return (req: any, res: any, next: any) => {
        if (!req.user || !roles.includes(req.user.role)) {
            return res.status(403).json({ error: 'Access denied' });
        }
        next();
    };
};


/**
 * POST /api/regulator/issue-credential
 * Regulator issues a verifiable credential for an approved document
 */
router.post('/regulator/issue-credential', authenticateToken, async (req: Request, res: Response) => {
    try {
        // Verify user is a regulator
        if (!req.user || req.user.role !== 'Regulator') {
            return res.status(403).json({ 
                error: 'Access denied. Only regulators can issue credentials.' 
            });
        }

        const { documentUploadId, holderDid, claims } = req.body;

        // Validate required fields
        if (!documentUploadId || !holderDid || !claims) {
            return res.status(400).json({ 
                error: 'Missing required fields: documentUploadId, holderDid, and claims are required.' 
            });
        }

        // Get the document upload record
        const { data: documentUpload, error: docError } = await supabase
            .from('document_uploads')
            .select('*')
            .eq('id', documentUploadId)
            .single();

        if (docError || !documentUpload) {
            return res.status(404).json({ 
                error: 'Document upload not found.' 
            });
        }

        // Verify document is pending verification
        if (documentUpload.status !== 'PendingVerification') {
            return res.status(400).json({ 
                error: `Document status is ${documentUpload.status}. Only pending documents can be processed.` 
            });
        }

        // Get the Veramo agent
        const agent = await getAgent();

        // Determine credential type based on document type
        const credentialTypeMap: { [key: string]: string } = {
            'Passport': 'VerifiedPassportCredential',
            'NID': 'VerifiedNationalIDCredential',
            'TrainingCertificate': 'VerifiedTrainingCredential',
            'EducationCertificate': 'VerifiedEducationCredential',
            'SkillsCertificate': 'VerifiedSkillsCredential',
            'WorkPermit': 'VerifiedWorkPermitCredential'
        };

        const credentialType = credentialTypeMap[documentUpload.document_type] || 'VerifiedDocumentCredential';

        // Create the verifiable credential
        console.log('Creating verifiable credential...');
        const verifiableCredential = await agent.createVerifiableCredential({
            credential: {
                issuer: { id: req.user.did }, // The regulator's DID
                credentialSubject: {
                    id: holderDid, // The worker's DID
                    documentType: documentUpload.document_type,
                    ipfsCid: documentUpload.ipfs_cid,
                    verificationDate: new Date().toISOString(),
                    ...claims, // Additional claims provided by the regulator
                },
                '@context': [
                    'https://www.w3.org/2018/credentials/v1',
                    'https://safepass.example.com/contexts/v1'
                ],
                type: ['VerifiableCredential', credentialType],
                issuanceDate: new Date().toISOString(),
            },
            proofFormat: 'jwt',
        });

        console.log('Verifiable credential created:', verifiableCredential);

        // Save the verifiable credential to database
        const { data: savedCredential, error: credError } = await supabase
            .from('verifiable_credentials')
            .insert({
                holder_did: holderDid,
                issuer_did: req.user.did,
                type: credentialType,
                raw_vc_jwt: verifiableCredential.proof.jwt,
                source_document_id: documentUploadId
            })
            .select()
            .single();

        if (credError) {
            console.error('Error saving credential:', credError);
            return res.status(500).json({ 
                error: 'Failed to save verifiable credential.' 
            });
        }

        // Update document status to verified
        const { error: updateError } = await supabase
            .from('document_uploads')
            .update({
                status: 'Verified',
                reviewed_at: new Date().toISOString(),
                reviewer_id: req.user.id,
                reviewer_notes: `Document verified and credential issued by ${req.user.email}`
            })
            .eq('id', documentUploadId);

        if (updateError) {
            console.error('Error updating document status:', updateError);
            return res.status(500).json({ 
                error: 'Failed to update document status.' 
            });
        }

        // Get worker ID from document upload for cache invalidation
        const workerId = documentUpload.user_id;
        
        // Invalidate relevant caches
        cacheInvalidation.invalidateCredentials(workerId);
        cacheInvalidation.invalidateDocuments(workerId);

        res.status(201).json({
            message: 'Verifiable credential issued successfully.',
            data: {
                credentialId: savedCredential.id,
                holderDid: savedCredential.holder_did,
                issuerDid: savedCredential.issuer_did,
                type: savedCredential.type,
                issuanceDate: savedCredential.issuance_date,
                jwt: savedCredential.raw_vc_jwt
            }
        });

    } catch (error) {
        console.error('Error issuing credential:', error);
        res.status(500).json({ 
            error: 'Internal server error while issuing credential.' 
        });
    }
});

/**
 * POST /api/regulator/reject-document
 * Regulator rejects a document upload
 */
router.post('/regulator/reject-document', authenticateToken, async (req: Request, res: Response) => {
    try {
        // Verify user is a regulator
        if (!req.user || req.user.role !== 'Regulator') {
            return res.status(403).json({ 
                error: 'Access denied. Only regulators can reject documents.' 
            });
        }

        const { documentUploadId, reviewerNotes } = req.body;

        // Validate required fields
        if (!documentUploadId) {
            return res.status(400).json({ 
                error: 'documentUploadId is required.' 
            });
        }

        // Get the document upload record
        const { data: documentUpload, error: docError } = await supabase
            .from('document_uploads')
            .select('*')
            .eq('id', documentUploadId)
            .single();

        if (docError || !documentUpload) {
            return res.status(404).json({ 
                error: 'Document upload not found.' 
            });
        }

        // Verify document is pending verification
        if (documentUpload.status !== 'PendingVerification') {
            return res.status(400).json({ 
                error: `Document status is ${documentUpload.status}. Only pending documents can be processed.` 
            });
        }

        // Update document status to rejected
        const { data: updatedDocument, error: updateError } = await supabase
            .from('document_uploads')
            .update({
                status: 'Rejected',
                reviewed_at: new Date().toISOString(),
                reviewer_id: req.user.id,
                reviewer_notes: reviewerNotes || 'Document rejected by regulator.'
            })
            .eq('id', documentUploadId)
            .select()
            .single();

        if (updateError) {
            console.error('Error updating document status:', updateError);
            return res.status(500).json({ 
                error: 'Failed to update document status.' 
            });
        }

        // Get worker ID from document upload for cache invalidation
        const workerId = documentUpload.user_id;
        
        // Invalidate relevant caches
        cacheInvalidation.invalidateDocuments(workerId);

        res.json({
            message: 'Document rejected successfully.',
            data: {
                id: updatedDocument.id,
                status: updatedDocument.status,
                reviewedAt: updatedDocument.reviewed_at,
                reviewerNotes: updatedDocument.reviewer_notes
            }
        });

    } catch (error) {
        console.error('Error rejecting document:', error);
        res.status(500).json({ 
            error: 'Internal server error while rejecting document.' 
        });
    }
});

/**
 * GET /api/worker/me/credentials
 * Worker retrieves their verifiable credentials
 */
router.get('/worker/me/credentials', authenticateToken, requireRole(['Worker']), cache({ 
  ttl: CACHE_TTL.USER_PROFILE, 
  keyGenerator: (req) => cacheKeys.userCredentials(req.user.id) 
}), async (req: Request, res: Response) => {
    try {
        // User verification is handled by requireRole middleware
        if (!req.user) {
            return res.status(401).json({ 
                error: 'Authentication required.' 
            });
        }

        // Get user's verifiable credentials
        const { data: credentials, error: dbError } = await supabase
            .from('verifiable_credentials')
            .select(`
                *,
                document_uploads!inner(
                    document_type,
                    ipfs_cid,
                    created_at
                )
            `)
            .eq('holder_did', req.user.did)
            .order('issuance_date', { ascending: false });

        if (dbError) {
            console.error('Database error:', dbError);
            return res.status(500).json({ 
                error: 'Failed to retrieve credentials.' 
            });
        }

        res.json({
            message: 'Credentials retrieved successfully.',
            data: credentials.map(cred => ({
                id: cred.id,
                type: cred.type,
                issuanceDate: cred.issuance_date,
                issuerDid: cred.issuer_did,
                jwt: cred.raw_vc_jwt,
                sourceDocument: {
                    type: cred.document_uploads.document_type,
                    ipfsCid: cred.document_uploads.ipfs_cid,
                    uploadedAt: cred.document_uploads.created_at
                }
            }))
        });

    } catch (error) {
        console.error('Error retrieving credentials:', error);
        res.status(500).json({ 
            error: 'Internal server error while retrieving credentials.' 
        });
    }
});

/**
 * GET /api/credentials/verify/:jwt
 * Verify a verifiable credential JWT (public endpoint)
 */
router.get('/credentials/verify/:jwt', cache({ 
  ttl: CACHE_TTL.LOOKUP_DATA, 
  keyGenerator: (req) => cacheKeys.credentialVerification(req.params.jwt) 
}), async (req: Request, res: Response) => {
    try {
        const { jwt } = req.params;

        if (!jwt) {
            return res.status(400).json({ 
                error: 'JWT parameter is required.' 
            });
        }

        // Get the Veramo agent
        const agent = await getAgent();

        // Verify the credential
        const verificationResult = await agent.verifyCredential({
            credential: jwt
        });

        console.log('Verification result:', JSON.stringify(verificationResult, null, 2));

        // Check if verification was successful and credential exists
        if (!verificationResult.verifiableCredential) {
            return res.status(400).json({
                error: 'Invalid credential format or verification failed.',
                verified: verificationResult.verified,
                verificationResult: verificationResult
            });
        }

        res.json({
            message: 'Credential verification completed.',
            data: {
                verified: verificationResult.verified,
                issuer: verificationResult.verifiableCredential.issuer,
                credentialSubject: verificationResult.verifiableCredential.credentialSubject,
                issuanceDate: verificationResult.verifiableCredential.issuanceDate,
                type: verificationResult.verifiableCredential.type,
                verificationResult: verificationResult
            }
        });

    } catch (error) {
        console.error('Error verifying credential:', error);
        res.status(500).json({ 
            error: 'Internal server error while verifying credential.' 
        });
    }
});

export default router;
