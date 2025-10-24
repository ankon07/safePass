import { Router, Request, Response } from 'express';
import multer from 'multer';
import { supabase } from '../config/supabase';
import { authenticateToken } from '../middleware/auth';
import { ipfsService } from '../services/ipfsService';
import { cache, cacheKeys, cacheInvalidation, CACHE_TTL } from '../middleware/cache';

const router = Router();

// Configure multer for file uploads (store in memory)
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB limit
    },
    fileFilter: (req, file, cb) => {
        // Accept images and PDFs
        const allowedMimes = [
            'image/jpeg',
            'image/jpg', 
            'image/png',
            'image/gif',
            'application/pdf'
        ];

        if (allowedMimes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Invalid file type. Only images (JPEG, PNG, GIF) and PDF files are allowed.'));
        }
    }
});

/**
 * POST /api/worker/documents
 * Worker uploads a document for verification
 */
router.post('/worker/documents', authenticateToken, (req: Request, res: Response, next) => {
    upload.single('file')(req, res, (err) => {
        if (err) {
            if (err.message.includes('Invalid file type')) {
                return res.status(400).json({ error: err.message });
            }
            if (err.code === 'LIMIT_FILE_SIZE') {
                return res.status(400).json({ error: 'File size too large. Maximum size is 10MB.' });
            }
            return res.status(400).json({ error: err.message });
        }
        next();
    });
}, async (req: Request, res: Response) => {
    try {
        // Verify user is a worker
        if (!req.user || req.user.role !== 'Worker') {
            return res.status(403).json({ 
                error: 'Access denied. Only workers can upload documents.' 
            });
        }

        // Check if file was uploaded
        if (!req.file) {
            return res.status(400).json({ 
                error: 'No file uploaded. Please provide a file.' 
            });
        }

        // Check if document type is provided
        const { documentType } = req.body;
        if (!documentType) {
            return res.status(400).json({ 
                error: 'Document type is required.' 
            });
        }

        // Validate document type
        const allowedDocumentTypes = [
            'Passport',
            'NID', 
            'TrainingCertificate',
            'EducationCertificate',
            'SkillsCertificate',
            'WorkPermit'
        ];

        if (!allowedDocumentTypes.includes(documentType)) {
            return res.status(400).json({ 
                error: `Invalid document type. Allowed types: ${allowedDocumentTypes.join(', ')}` 
            });
        }

        // Check IPFS connection first
        console.log('Checking IPFS connection...');
        const isIPFSOnline = await ipfsService.isOnline();
        if (!isIPFSOnline) {
            console.error('IPFS node is not accessible');
            return res.status(503).json({
                error: 'IPFS service is not available. Please ensure IPFS node is running.',
                hint: 'Run: npm run start:ipfs'
            });
        }

        // Upload file to IPFS
        console.log('Uploading file to IPFS...');
        console.log(`File details: name=${req.file.originalname}, size=${req.file.size}, mimetype=${req.file.mimetype}`);
        const ipfsCid = await ipfsService.uploadFile(req.file.buffer, req.file.originalname);
        console.log(`File uploaded to IPFS with CID: ${ipfsCid}`);

        // Pin the file to ensure it stays available
        console.log('Pinning file to IPFS...');
        await ipfsService.pinFile(ipfsCid);
        console.log('File pinned successfully');

        // Save document upload record to database
        const { data: documentUpload, error: dbError } = await supabase
            .from('document_uploads')
            .insert({
                user_id: req.user.id,
                document_type: documentType,
                ipfs_cid: ipfsCid,
                status: 'PendingVerification'
            })
            .select()
            .single();

        if (dbError) {
            console.error('Database error:', dbError);
            return res.status(500).json({ 
                error: 'Failed to save document upload record.' 
            });
        }

        // Invalidate document caches after upload
        cacheInvalidation.invalidateDocuments(req.user.id);

        res.status(202).json({
            message: 'Document uploaded successfully and is awaiting verification.',
            data: {
                id: documentUpload.id,
                documentType: documentUpload.document_type,
                ipfsCid: documentUpload.ipfs_cid,
                status: documentUpload.status,
                createdAt: documentUpload.created_at
            }
        });

    } catch (error) {
        console.error('Error uploading document:', error);
        if (error instanceof Error && error.message.includes('Invalid file type')) {
            return res.status(400).json({ error: error.message });
        }
        res.status(500).json({ 
            error: 'Internal server error while uploading document.' 
        });
    }
});

/**
 * GET /api/worker/documents
 * Worker retrieves their uploaded documents
 */
router.get('/worker/documents', 
  authenticateToken,
  cache({
    ttl: CACHE_TTL.DOCUMENT_LIST,
    keyGenerator: cacheKeys.documentsWorker
  }),
  async (req: Request, res: Response) => {
    try {
        // Verify user is a worker
        if (!req.user || req.user.role !== 'Worker') {
            return res.status(403).json({ 
                error: 'Access denied. Only workers can view their documents.' 
            });
        }

        // Get user's document uploads
        const { data: documents, error: dbError } = await supabase
            .from('document_uploads')
            .select('*')
            .eq('user_id', req.user.id)
            .order('created_at', { ascending: false });

        if (dbError) {
            console.error('Database error:', dbError);
            return res.status(500).json({ 
                error: 'Failed to retrieve documents.' 
            });
        }

        res.json({
            message: 'Documents retrieved successfully.',
            data: documents.map(doc => ({
                id: doc.id,
                documentType: doc.document_type,
                ipfsCid: doc.ipfs_cid,
                status: doc.status,
                createdAt: doc.created_at,
                reviewedAt: doc.reviewed_at,
                reviewerNotes: doc.reviewer_notes
            }))
        });

    } catch (error) {
        console.error('Error retrieving documents:', error);
        res.status(500).json({ 
            error: 'Internal server error while retrieving documents.' 
        });
    }
});

/**
 * GET /api/regulator/documents/verified
 * Regulator retrieves verified documents with complete details including worker info and credentials
 */
router.get('/regulator/documents/verified', 
  authenticateToken,
  cache({
    ttl: CACHE_TTL.DOCUMENT_LIST,
    keyGenerator: cacheKeys.documentsVerified
  }),
  async (req: Request, res: Response) => {
    console.log('📋 Verified documents endpoint hit!');
    
    try {
        // Verify user is a regulator
        if (!req.user || req.user.role !== 'Regulator') {
            return res.status(403).json({ 
                error: 'Access denied. Only regulators can view verified documents.' 
            });
        }

        // Get verified documents with complete information using joins
        const { data: documents, error: dbError } = await supabase
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

    } catch (error) {
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
router.get('/regulator/documents/pending', 
  authenticateToken,
  cache({
    ttl: CACHE_TTL.DOCUMENT_LIST,
    keyGenerator: cacheKeys.documentsPending
  }),
  async (req: Request, res: Response) => {
    try {
        // Verify user is a regulator
        if (!req.user || req.user.role !== 'Regulator') {
            return res.status(403).json({ 
                error: 'Access denied. Only regulators can view pending documents.' 
            });
        }

        // First get pending document uploads
        const { data: documents, error: dbError } = await supabase
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
        const documentsWithUsers = await Promise.all(
            documents.map(async (doc) => {
                const { data: user, error: userError } = await supabase
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
            })
        );

        res.json({
            message: 'Pending documents retrieved successfully.',
            data: documentsWithUsers
        });

    } catch (error) {
        console.error('Error retrieving pending documents:', error);
        res.status(500).json({ 
            error: 'Internal server error while retrieving pending documents.' 
        });
    }
});

/**
 * GET /api/agency/documents/workers
 * Agency Admin retrieves documents from workers under their agency
 */
router.get('/agency/documents/workers', authenticateToken, async (req: Request, res: Response) => {
    try {
        // Verify user is an agency admin
        if (!req.user || req.user.role !== 'AgencyAdmin') {
            return res.status(403).json({ 
                error: 'Access denied. Only agency admins can view worker documents.' 
            });
        }

        // Get documents from workers associated with this agency
        // For now, we'll get all documents since we don't have agency-worker relationships in the schema
        // In a real implementation, you'd filter by agency_id or similar
        const { data: documents, error: dbError } = await supabase
            .from('document_uploads')
            .select(`
                *,
                worker:users!document_uploads_user_id_fkey(
                    id,
                    name,
                    email,
                    did,
                    role
                )
            `)
            .order('created_at', { ascending: false });

        if (dbError) {
            console.error('Database error:', dbError);
            return res.status(500).json({ 
                error: 'Failed to retrieve worker documents.' 
            });
        }

        // Filter to only show documents from workers
        const workerDocuments = documents?.filter(doc => 
            doc.worker && doc.worker.role === 'Worker'
        ) || [];

        // Transform the data
        const transformedDocuments = workerDocuments.map(doc => ({
            id: doc.id,
            documentType: doc.document_type,
            ipfsCid: doc.ipfs_cid,
            status: doc.status,
            createdAt: doc.created_at,
            reviewedAt: doc.reviewed_at,
            reviewerNotes: doc.reviewer_notes,
            worker: {
                id: doc.worker.id,
                name: doc.worker.name,
                email: doc.worker.email,
                did: doc.worker.did
            }
        }));

        res.json({
            message: 'Worker documents retrieved successfully.',
            data: transformedDocuments,
            count: transformedDocuments.length
        });

    } catch (error) {
        console.error('Error retrieving worker documents:', error);
        res.status(500).json({ 
            error: 'Internal server error while retrieving worker documents.' 
        });
    }
});

/**
 * GET /api/agency/documents/pending
 * Agency Admin retrieves pending documents for agency review
 */
router.get('/agency/documents/pending', authenticateToken, async (req: Request, res: Response) => {
    try {
        // Verify user is an agency admin
        if (!req.user || req.user.role !== 'AgencyAdmin') {
            return res.status(403).json({ 
                error: 'Access denied. Only agency admins can view pending documents.' 
            });
        }

        // Get pending documents from workers
        const { data: documents, error: dbError } = await supabase
            .from('document_uploads')
            .select(`
                *,
                worker:users!document_uploads_user_id_fkey(
                    id,
                    name,
                    email,
                    did,
                    role
                )
            `)
            .eq('status', 'PendingVerification')
            .order('created_at', { ascending: true });

        if (dbError) {
            console.error('Database error:', dbError);
            return res.status(500).json({ 
                error: 'Failed to retrieve pending documents.' 
            });
        }

        // Filter to only show documents from workers
        const workerDocuments = documents?.filter(doc => 
            doc.worker && doc.worker.role === 'Worker'
        ) || [];

        // Transform the data
        const transformedDocuments = workerDocuments.map(doc => ({
            id: doc.id,
            documentType: doc.document_type,
            ipfsCid: doc.ipfs_cid,
            status: doc.status,
            createdAt: doc.created_at,
            worker: {
                id: doc.worker.id,
                name: doc.worker.name,
                email: doc.worker.email,
                did: doc.worker.did
            }
        }));

        res.json({
            message: 'Pending documents retrieved successfully.',
            data: transformedDocuments,
            count: transformedDocuments.length
        });

    } catch (error) {
        console.error('Error retrieving pending documents:', error);
        res.status(500).json({ 
            error: 'Internal server error while retrieving pending documents.' 
        });
    }
});

/**
 * POST /api/agency/documents/approve
 * Agency Admin approves worker documents
 */
router.post('/agency/documents/approve', authenticateToken, async (req: Request, res: Response) => {
    try {
        // Verify user is an agency admin
        if (!req.user || req.user.role !== 'AgencyAdmin') {
            return res.status(403).json({ 
                error: 'Access denied. Only agency admins can approve documents.' 
            });
        }

        const { documentUploadId, reviewerNotes } = req.body;

        if (!documentUploadId) {
            return res.status(400).json({ 
                error: 'Document upload ID is required.' 
            });
        }

        // Update document status to approved
        const { data: updatedDocument, error: updateError } = await supabase
            .from('document_uploads')
            .update({
                status: 'Verified',
                reviewer_id: req.user.id,
                reviewed_at: new Date().toISOString(),
                reviewer_notes: reviewerNotes || 'Approved by agency admin'
            })
            .eq('id', documentUploadId)
            .eq('status', 'PendingVerification') // Only update if still pending
            .select()
            .single();

        if (updateError) {
            console.error('Database error:', updateError);
            return res.status(500).json({ 
                error: 'Failed to approve document.' 
            });
        }

        if (!updatedDocument) {
            return res.status(404).json({ 
                error: 'Document not found or already processed.' 
            });
        }

        // Invalidate document caches after approval
        cacheInvalidation.invalidateDocuments();

        res.json({
            message: 'Document approved successfully.',
            data: {
                id: updatedDocument.id,
                status: updatedDocument.status,
                reviewedAt: updatedDocument.reviewed_at,
                reviewerNotes: updatedDocument.reviewer_notes
            }
        });

    } catch (error) {
        console.error('Error approving document:', error);
        res.status(500).json({ 
            error: 'Internal server error while approving document.' 
        });
    }
});

/**
 * POST /api/agency/documents/reject
 * Agency Admin rejects worker documents with feedback
 */
router.post('/agency/documents/reject', authenticateToken, async (req: Request, res: Response) => {
    try {
        // Verify user is an agency admin
        if (!req.user || req.user.role !== 'AgencyAdmin') {
            return res.status(403).json({ 
                error: 'Access denied. Only agency admins can reject documents.' 
            });
        }

        const { documentUploadId, reviewerNotes } = req.body;

        if (!documentUploadId || !reviewerNotes) {
            return res.status(400).json({ 
                error: 'Document upload ID and reviewer notes are required.' 
            });
        }

        // Update document status to rejected
        const { data: updatedDocument, error: updateError } = await supabase
            .from('document_uploads')
            .update({
                status: 'Rejected',
                reviewer_id: req.user.id,
                reviewed_at: new Date().toISOString(),
                reviewer_notes: reviewerNotes
            })
            .eq('id', documentUploadId)
            .eq('status', 'PendingVerification') // Only update if still pending
            .select()
            .single();

        if (updateError) {
            console.error('Database error:', updateError);
            return res.status(500).json({ 
                error: 'Failed to reject document.' 
            });
        }

        if (!updatedDocument) {
            return res.status(404).json({ 
                error: 'Document not found or already processed.' 
            });
        }

        // Invalidate document caches after rejection
        cacheInvalidation.invalidateDocuments();

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
 * GET /api/agency/documents/statistics
 * Agency Admin gets document processing statistics
 */
router.get('/agency/documents/statistics', authenticateToken, async (req: Request, res: Response) => {
    try {
        // Verify user is an agency admin
        if (!req.user || req.user.role !== 'AgencyAdmin') {
            return res.status(403).json({ 
                error: 'Access denied. Only agency admins can view document statistics.' 
            });
        }

        // Get document statistics
        const { data: allDocuments, error: dbError } = await supabase
            .from('document_uploads')
            .select(`
                status,
                created_at,
                users!document_uploads_user_id_fkey(role)
            `);

        if (dbError) {
            console.error('Database error:', dbError);
            return res.status(500).json({ 
                error: 'Failed to retrieve document statistics.' 
            });
        }

        // Filter worker documents only
        const workerDocuments = allDocuments?.filter(doc => 
            doc.users && (doc.users as any).role === 'Worker'
        ) || [];

        // Calculate statistics
        const totalDocuments = workerDocuments.length;
        const pendingDocuments = workerDocuments.filter(doc => doc.status === 'PendingVerification').length;
        const verifiedDocuments = workerDocuments.filter(doc => doc.status === 'Verified').length;
        const rejectedDocuments = workerDocuments.filter(doc => doc.status === 'Rejected').length;

        // Calculate documents processed in last 30 days
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const recentDocuments = workerDocuments.filter(doc => 
            new Date(doc.created_at) >= thirtyDaysAgo
        ).length;

        res.json({
            message: 'Document statistics retrieved successfully.',
            data: {
                totalDocuments,
                pendingDocuments,
                verifiedDocuments,
                rejectedDocuments,
                recentDocuments,
                processingRate: totalDocuments > 0 ? 
                    Math.round(((verifiedDocuments + rejectedDocuments) / totalDocuments) * 100) : 0
            }
        });

    } catch (error) {
        console.error('Error retrieving document statistics:', error);
        res.status(500).json({ 
            error: 'Internal server error while retrieving document statistics.' 
        });
    }
});

// Add a simple test route to verify the router is working
router.get('/test-documents', (req: Request, res: Response) => {
  res.json({ message: 'Document router is working!' });
});

console.log('📋 Document routes registered successfully');

export default router;
