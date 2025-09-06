"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const supabase_1 = require("../config/supabase");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
/**
 * GET /api/regulator/documents/verified
 * Regulator retrieves verified documents with complete details including worker info and credentials
 */
router.get('/regulator/documents/verified', auth_1.authenticateToken, async (req, res) => {
    console.log('📋 Verified documents endpoint hit!');
    try {
        // Verify user is a regulator
        if (!req.user || req.user.role !== 'Regulator') {
            return res.status(403).json({
                error: 'Access denied. Only regulators can view verified documents.'
            });
        }
        // Get verified documents with complete information using joins
        const { data: documents, error: dbError } = await supabase_1.supabase
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
            .eq('status', 'Verified')
            .order('created_at', { ascending: false });
        if (dbError) {
            console.error('Database error:', dbError);
            return res.status(500).json({
                error: 'Failed to retrieve verified documents.',
                details: dbError.message
            });
        }
        console.log(`Found ${documents?.length || 0} verified documents`);
        // Transform the data to match the frontend expectations
        const transformedDocuments = documents?.map(doc => {
            const credential = doc.verifiable_credentials?.[0]; // Get the first credential if exists
            return {
                id: doc.id,
                documentType: doc.document_type,
                ipfsCid: doc.ipfs_cid,
                status: doc.status,
                createdAt: doc.created_at,
                reviewedAt: doc.reviewed_at,
                reviewerNotes: doc.reviewer_notes,
                worker: doc.worker ? {
                    id: doc.worker.id,
                    name: doc.worker.name,
                    email: doc.worker.email,
                    did: doc.worker.did
                } : {
                    id: doc.user_id,
                    name: 'Unknown Worker',
                    email: 'unknown@example.com',
                    did: 'unknown'
                },
                verifiedBy: doc.reviewer?.name || 'Unknown Reviewer',
                credential: credential ? {
                    id: credential.id,
                    type: credential.type,
                    issuanceDate: credential.issuance_date,
                    issuerDid: credential.issuer_did,
                    jwt: credential.raw_vc_jwt
                } : undefined
            };
        }) || [];
        res.json({
            message: 'Verified documents retrieved successfully.',
            data: transformedDocuments,
            count: transformedDocuments.length
        });
    }
    catch (error) {
        console.error('Error retrieving verified documents:', error);
        res.status(500).json({
            error: 'Internal server error while retrieving verified documents.',
            details: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
/**
 * GET /api/regulator/documents/pending
 * Regulator retrieves pending documents for review
 */
router.get('/regulator/documents/pending', auth_1.authenticateToken, async (req, res) => {
    try {
        // Verify user is a regulator
        if (!req.user || req.user.role !== 'Regulator') {
            return res.status(403).json({
                error: 'Access denied. Only regulators can view pending documents.'
            });
        }
        // First get pending document uploads
        const { data: documents, error: dbError } = await supabase_1.supabase
            .from('document_uploads')
            .select('*')
            .eq('status', 'PendingVerification')
            .order('created_at', { ascending: true });
        if (dbError) {
            console.error('Database error:', dbError);
            return res.status(500).json({
                error: 'Failed to retrieve pending documents.'
            });
        }
        // If no documents found, return empty array
        if (!documents || documents.length === 0) {
            return res.json({
                message: 'No pending documents found.',
                data: []
            });
        }
        // Get user information for each document separately
        const documentsWithUsers = await Promise.all(documents.map(async (doc) => {
            const { data: user, error: userError } = await supabase_1.supabase
                .from('users')
                .select('id, name, email, did')
                .eq('id', doc.user_id)
                .single();
            if (userError) {
                console.error('Error fetching user for document:', doc.id, userError);
                // Return document without user info if user fetch fails
                return {
                    id: doc.id,
                    documentType: doc.document_type,
                    ipfsCid: doc.ipfs_cid,
                    status: doc.status,
                    createdAt: doc.created_at,
                    worker: {
                        id: doc.user_id,
                        name: 'Unknown User',
                        email: 'unknown@example.com',
                        did: 'unknown'
                    }
                };
            }
            return {
                id: doc.id,
                documentType: doc.document_type,
                ipfsCid: doc.ipfs_cid,
                status: doc.status,
                createdAt: doc.created_at,
                worker: {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    did: user.did
                }
            };
        }));
        res.json({
            message: 'Pending documents retrieved successfully.',
            data: documentsWithUsers
        });
    }
    catch (error) {
        console.error('Error retrieving pending documents:', error);
        res.status(500).json({
            error: 'Internal server error while retrieving pending documents.'
        });
    }
});
// Add a simple test route to verify the router is working
router.get('/test-documents', (req, res) => {
    res.json({ message: 'Document router is working!' });
});
console.log('📋 Document routes registered successfully');
exports.default = router;
