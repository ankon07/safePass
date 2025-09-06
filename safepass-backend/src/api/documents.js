"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const multer_1 = __importDefault(require("multer"));
const supabase_1 = require("../config/supabase");
const auth_1 = require("../middleware/auth");
const ipfsService_1 = require("../services/ipfsService");
const router = (0, express_1.Router)();
// Configure multer for file uploads (store in memory)
const upload = (0, multer_1.default)({
    storage: multer_1.default.memoryStorage(),
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
        }
        else {
            cb(new Error('Invalid file type. Only images (JPEG, PNG, GIF) and PDF files are allowed.'));
        }
    }
});
/**
 * POST /api/worker/documents
 * Worker uploads a document for verification
 */
router.post('/worker/documents', auth_1.authenticateToken, (req, res, next) => {
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
}, async (req, res) => {
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
        const isIPFSOnline = await ipfsService_1.ipfsService.isOnline();
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
        const ipfsCid = await ipfsService_1.ipfsService.uploadFile(req.file.buffer, req.file.originalname);
        console.log(`File uploaded to IPFS with CID: ${ipfsCid}`);
        // Pin the file to ensure it stays available
        console.log('Pinning file to IPFS...');
        await ipfsService_1.ipfsService.pinFile(ipfsCid);
        console.log('File pinned successfully');
        // Save document upload record to database
        const { data: documentUpload, error: dbError } = await supabase_1.supabase
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
    }
    catch (error) {
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
router.get('/worker/documents', auth_1.authenticateToken, async (req, res) => {
    try {
        // Verify user is a worker
        if (!req.user || req.user.role !== 'Worker') {
            return res.status(403).json({
                error: 'Access denied. Only workers can view their documents.'
            });
        }
        // Get user's document uploads
        const { data: documents, error: dbError } = await supabase_1.supabase
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
    }
    catch (error) {
        console.error('Error retrieving documents:', error);
        res.status(500).json({
            error: 'Internal server error while retrieving documents.'
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

    } catch (error) {
        console.error('Error retrieving verified documents:', error);
        res.status(500).json({
            error: 'Internal server error while retrieving verified documents.',
            details: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});

// Add a simple test route to verify the router is working
router.get('/test-documents', (req, res) => {
    res.json({ message: 'Document router is working!' });
});

console.log('📋 Document routes registered successfully');
exports.default = router;
