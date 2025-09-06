"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const supabase_1 = require("../config/supabase");
const auth_1 = require("../middleware/auth");
const identityService_1 = require("../services/identityService");
const router = (0, express_1.Router)();
/**
 * POST /api/regulator/issue-credential
 * Regulator issues a verifiable credential for an approved document
 */
router.post('/regulator/issue-credential', auth_1.authenticateToken, async (req, res) => {
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
        const { data: documentUpload, error: docError } = await supabase_1.supabase
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
        const agent = await (0, identityService_1.getAgent)();
        // Determine credential type based on document type
        const credentialTypeMap = {
            'Passport': 'VerifiedPassportCredential',
            'NID': 'VerifiedNationalIDCredential',
            'TrainingCertificate': 'VerifiedTrainingCredential',
            'EducationCertificate': 'VerifiedEducationCredential',
            'SkillsCertificate': 'VerifiedSkillsCredential',
            'WorkPermit': 'VerifiedWorkPermitCredential'
        };
        const credentialType = credentialTypeMap[documentUpload.document_type] || 'VerifiedDocumentCredential';
        // Create the verifiable credential
        console.log('🔧 DEBUG: Starting credential creation...');
        console.log('🔧 DEBUG: Document ID:', documentUploadId);
        console.log('🔧 DEBUG: Holder DID:', holderDid);
        console.log('🔧 DEBUG: Issuer DID:', req.user.did);
        console.log('🔧 DEBUG: Document type:', documentUpload.document_type);
        let verifiableCredential;
        try {
            verifiableCredential = await agent.createVerifiableCredential({
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
            console.log('✅ DEBUG: Verifiable credential created successfully');
            console.log('🔧 DEBUG: Credential JWT length:', verifiableCredential.proof.jwt.length);
        }
        catch (credentialError) {
            console.error('❌ DEBUG: Error creating credential:', credentialError);
            const errorMessage = credentialError instanceof Error ? credentialError.message : 'Unknown error';
            return res.status(500).json({
                error: 'Failed to create verifiable credential.',
                details: errorMessage
            });
        }
        // Save the verifiable credential to database
        console.log('🔧 DEBUG: Starting credential save to database...');
        let savedCredential;
        try {
            const { data, error: credError } = await supabase_1.supabase
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
                console.error('❌ DEBUG: Error saving credential to database:', credError);
                console.error('❌ DEBUG: Credential save error details:', JSON.stringify(credError, null, 2));
                return res.status(500).json({
                    error: 'Failed to save verifiable credential.',
                    details: credError.message
                });
            }
            savedCredential = data;
            console.log('✅ DEBUG: Credential saved successfully with ID:', savedCredential.id);
        }
        catch (saveError) {
            console.error('❌ DEBUG: Exception during credential save:', saveError);
            const errorMessage = saveError instanceof Error ? saveError.message : 'Unknown error';
            return res.status(500).json({
                error: 'Exception during credential save.',
                details: errorMessage
            });
        }
        // Update document status to verified
        console.log('🔧 DEBUG: Starting document status update...');
        console.log('🔧 DEBUG: Updating document ID:', documentUploadId);
        console.log('🔧 DEBUG: Setting status to: Verified');
        console.log('🔧 DEBUG: Reviewer ID:', req.user.id);
        console.log('🔧 DEBUG: Reviewer email:', req.user.email);
        try {
            const updateData = {
                status: 'Verified',
                reviewed_at: new Date().toISOString(),
                reviewer_id: req.user.id,
                reviewer_notes: `Document verified and credential issued by ${req.user.email}`
            };
            console.log('🔧 DEBUG: Update data:', JSON.stringify(updateData, null, 2));
            const { data: updateResult, error: updateError } = await supabase_1.supabase
                .from('document_uploads')
                .update(updateData)
                .eq('id', documentUploadId)
                .select();
            if (updateError) {
                console.error('❌ DEBUG: Error updating document status:', updateError);
                console.error('❌ DEBUG: Update error details:', JSON.stringify(updateError, null, 2));
                console.error('❌ DEBUG: Update error code:', updateError.code);
                console.error('❌ DEBUG: Update error message:', updateError.message);
                console.error('❌ DEBUG: Update error hint:', updateError.hint);
                console.error('❌ DEBUG: Update error details:', updateError.details);
                // Try to rollback the credential save
                console.log('🔄 DEBUG: Attempting to rollback credential save...');
                try {
                    await supabase_1.supabase
                        .from('verifiable_credentials')
                        .delete()
                        .eq('id', savedCredential.id);
                    console.log('✅ DEBUG: Credential rollback successful');
                }
                catch (rollbackError) {
                    console.error('❌ DEBUG: Credential rollback failed:', rollbackError);
                }
                return res.status(500).json({
                    error: 'Failed to update document status.',
                    details: updateError.message,
                    code: updateError.code,
                    hint: updateError.hint
                });
            }
            console.log('✅ DEBUG: Document status updated successfully');
            console.log('🔧 DEBUG: Update result:', JSON.stringify(updateResult, null, 2));
        }
        catch (updateException) {
            console.error('❌ DEBUG: Exception during document update:', updateException);
            if (updateException instanceof Error) {
                console.error('❌ DEBUG: Exception stack:', updateException.stack);
            }
            // Try to rollback the credential save
            console.log('🔄 DEBUG: Attempting to rollback credential save due to exception...');
            try {
                await supabase_1.supabase
                    .from('verifiable_credentials')
                    .delete()
                    .eq('id', savedCredential.id);
                console.log('✅ DEBUG: Credential rollback successful');
            }
            catch (rollbackError) {
                console.error('❌ DEBUG: Credential rollback failed:', rollbackError);
            }
            const errorMessage = updateException instanceof Error ? updateException.message : 'Unknown error';
            return res.status(500).json({
                error: 'Exception during document status update.',
                details: errorMessage
            });
        }
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
    }
    catch (error) {
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
router.post('/regulator/reject-document', auth_1.authenticateToken, async (req, res) => {
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
        const { data: documentUpload, error: docError } = await supabase_1.supabase
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
        const { data: updatedDocument, error: updateError } = await supabase_1.supabase
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
        res.json({
            message: 'Document rejected successfully.',
            data: {
                id: updatedDocument.id,
                status: updatedDocument.status,
                reviewedAt: updatedDocument.reviewed_at,
                reviewerNotes: updatedDocument.reviewer_notes
            }
        });
    }
    catch (error) {
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
router.get('/worker/me/credentials', auth_1.authenticateToken, async (req, res) => {
    try {
        // Verify user is a worker
        if (!req.user || req.user.role !== 'Worker') {
            return res.status(403).json({
                error: 'Access denied. Only workers can view their credentials.'
            });
        }
        // Get user's verifiable credentials
        const { data: credentials, error: dbError } = await supabase_1.supabase
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
    }
    catch (error) {
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
router.get('/credentials/verify/:jwt', async (req, res) => {
    try {
        const { jwt } = req.params;
        if (!jwt) {
            return res.status(400).json({
                error: 'JWT parameter is required.'
            });
        }
        // Get the Veramo agent
        const agent = await (0, identityService_1.getAgent)();
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
    }
    catch (error) {
        console.error('Error verifying credential:', error);
        res.status(500).json({
            error: 'Internal server error while verifying credential.'
        });
    }
});
exports.default = router;
