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
// Configure multer for profile picture uploads
const upload = (0, multer_1.default)({
    storage: multer_1.default.memoryStorage(),
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB limit for profile pictures
    },
    fileFilter: (req, file, cb) => {
        // Accept only images
        const allowedMimes = [
            'image/jpeg',
            'image/jpg',
            'image/png',
            'image/gif',
            'image/webp'
        ];
        if (allowedMimes.includes(file.mimetype)) {
            cb(null, true);
        }
        else {
            cb(new Error('Invalid file type. Only images (JPEG, PNG, GIF, WebP) are allowed.'));
        }
    }
});
// GET /api/users - Get all users (Admin/Regulator only)
router.get('/', auth_1.authenticateToken, (0, auth_1.requireRole)(['AgencyAdmin', 'Regulator']), async (req, res) => {
    try {
        const { data: users, error } = await supabase_1.supabase
            .from('users')
            .select('id, email, name, role, did, created_at')
            .order('created_at', { ascending: false });
        if (error) {
            console.error('Database query error:', error);
            return res.status(500).json({ error: 'Failed to fetch users' });
        }
        const userProfiles = users.map(user => ({
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            did: user.did,
            created_at: user.created_at,
        }));
        res.status(200).json({
            users: userProfiles,
            total: userProfiles.length,
        });
    }
    catch (error) {
        console.error('Get users error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// GET /api/users/workers - Get all workers (Agency Admin/Regulator only)
router.get('/workers', auth_1.authenticateToken, (0, auth_1.requireRole)(['AgencyAdmin', 'Regulator']), async (req, res) => {
    try {
        const { data: workers, error } = await supabase_1.supabase
            .from('users')
            .select('id, email, name, role, did, created_at')
            .eq('role', 'Worker')
            .order('created_at', { ascending: false });
        if (error) {
            console.error('Database query error:', error);
            return res.status(500).json({ error: 'Failed to fetch workers' });
        }
        const workerProfiles = workers.map(worker => ({
            id: worker.id,
            email: worker.email,
            name: worker.name,
            role: worker.role,
            did: worker.did,
            created_at: worker.created_at,
        }));
        res.status(200).json({
            workers: workerProfiles,
            total: workerProfiles.length,
        });
    }
    catch (error) {
        console.error('Get workers error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// GET /api/users/stats/overview - Get user statistics (Admin/Regulator only)
router.get('/stats/overview', auth_1.authenticateToken, (0, auth_1.requireRole)(['AgencyAdmin', 'Regulator']), async (req, res) => {
    try {
        // Get total counts by role
        const { data: stats, error } = await supabase_1.supabase
            .from('users')
            .select('role')
            .order('role');
        if (error) {
            console.error('Database query error:', error);
            return res.status(500).json({ error: 'Failed to fetch statistics' });
        }
        const roleCounts = stats.reduce((acc, user) => {
            acc[user.role] = (acc[user.role] || 0) + 1;
            return acc;
        }, {});
        const totalUsers = stats.length;
        res.status(200).json({
            totalUsers,
            roleBreakdown: {
                workers: roleCounts.Worker || 0,
                agencyAdmins: roleCounts.AgencyAdmin || 0,
                regulators: roleCounts.Regulator || 0,
            },
            statistics: roleCounts,
        });
    }
    catch (error) {
        console.error('Get statistics error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// GET /api/users/profile - Get current user's full profile
router.get('/profile', auth_1.authenticateToken, async (req, res) => {
    try {
        const currentUser = req.user;
        const { data: user, error } = await supabase_1.supabase
            .from('users')
            .select('id, email, name, role, did, created_at, bio, phone, address, skills, experience, preferences, profile_picture_cid')
            .eq('id', currentUser.id)
            .single();
        if (error || !user) {
            return res.status(404).json({ error: 'User profile not found' });
        }
        // Add profile picture URL if CID exists
        const userProfile = {
            ...user,
            profilePictureUrl: user.profile_picture_cid ? `https://ipfs.io/ipfs/${user.profile_picture_cid}` : null
        };
        res.status(200).json({
            message: 'Profile retrieved successfully',
            user: userProfile
        });
    }
    catch (error) {
        console.error('Get profile error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// PUT /api/users/profile - Update user profile
router.put('/profile', auth_1.authenticateToken, async (req, res) => {
    try {
        const currentUser = req.user;
        const { name, bio, phone, address, skills, experience, preferences } = req.body;
        // Validate required fields
        if (!name || name.trim().length === 0) {
            return res.status(400).json({ error: 'Name is required' });
        }
        // Prepare update data
        const updateData = {
            name: name.trim(),
            updated_at: new Date().toISOString()
        };
        // Add optional fields if provided
        if (bio !== undefined)
            updateData.bio = bio;
        if (phone !== undefined)
            updateData.phone = phone;
        if (address !== undefined)
            updateData.address = address;
        if (skills !== undefined)
            updateData.skills = skills;
        if (experience !== undefined)
            updateData.experience = experience;
        if (preferences !== undefined)
            updateData.preferences = preferences;
        const { data: updatedUser, error } = await supabase_1.supabase
            .from('users')
            .update(updateData)
            .eq('id', currentUser.id)
            .select('id, email, name, role, did, created_at, bio, phone, address, skills, experience, preferences, profile_picture_cid')
            .single();
        if (error) {
            console.error('Database update error:', error);
            return res.status(500).json({ error: 'Failed to update profile' });
        }
        res.status(200).json({
            message: 'Profile updated successfully',
            user: updatedUser
        });
    }
    catch (error) {
        console.error('Update profile error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// POST /api/users/profile/picture - Upload profile picture
router.post('/profile/picture', auth_1.authenticateToken, (req, res, next) => {
    upload.single('profilePicture')(req, res, (err) => {
        if (err) {
            if (err.message.includes('Invalid file type')) {
                return res.status(400).json({ error: err.message });
            }
            if (err.code === 'LIMIT_FILE_SIZE') {
                return res.status(400).json({ error: 'File size too large. Maximum size is 5MB.' });
            }
            return res.status(400).json({ error: err.message });
        }
        next();
    });
}, async (req, res) => {
    try {
        const currentUser = req.user;
        // Check if file was uploaded
        if (!req.file) {
            return res.status(400).json({
                error: 'No file uploaded. Please provide a profile picture.'
            });
        }
        // Check IPFS connection
        console.log('Checking IPFS connection for profile picture upload...');
        const isIPFSOnline = await ipfsService_1.ipfsService.isOnline();
        if (!isIPFSOnline) {
            console.error('IPFS node is not accessible');
            return res.status(503).json({
                error: 'IPFS service is not available. Please ensure IPFS node is running.',
                hint: 'Run: npm run start:ipfs'
            });
        }
        // Upload file to IPFS
        console.log('Uploading profile picture to IPFS...');
        console.log(`File details: name=${req.file.originalname}, size=${req.file.size}, mimetype=${req.file.mimetype}`);
        const ipfsCid = await ipfsService_1.ipfsService.uploadFile(req.file.buffer, req.file.originalname);
        console.log(`Profile picture uploaded to IPFS with CID: ${ipfsCid}`);
        // Pin the file to ensure it stays available
        console.log('Pinning profile picture to IPFS...');
        await ipfsService_1.ipfsService.pinFile(ipfsCid);
        console.log('Profile picture pinned successfully');
        // Update user's profile picture CID in database
        const { data: updatedUser, error: dbError } = await supabase_1.supabase
            .from('users')
            .update({
            profile_picture_cid: ipfsCid,
            updated_at: new Date().toISOString()
        })
            .eq('id', currentUser.id)
            .select('id, email, name, role, did, created_at, profile_picture_cid')
            .single();
        if (dbError) {
            console.error('Database error:', dbError);
            return res.status(500).json({
                error: 'Failed to save profile picture reference.'
            });
        }
        res.status(200).json({
            message: 'Profile picture uploaded successfully.',
            data: {
                profilePictureCid: ipfsCid,
                profilePictureUrl: `https://ipfs.io/ipfs/${ipfsCid}`,
                user: updatedUser
            }
        });
    }
    catch (error) {
        console.error('Error uploading profile picture:', error);
        res.status(500).json({
            error: 'Internal server error while uploading profile picture.'
        });
    }
});
// DELETE /api/users/profile/picture - Remove profile picture
router.delete('/profile/picture', auth_1.authenticateToken, async (req, res) => {
    try {
        const currentUser = req.user;
        const { data: updatedUser, error } = await supabase_1.supabase
            .from('users')
            .update({
            profile_picture_cid: null,
            updated_at: new Date().toISOString()
        })
            .eq('id', currentUser.id)
            .select('id, email, name, role, did, created_at, profile_picture_cid')
            .single();
        if (error) {
            console.error('Database error:', error);
            return res.status(500).json({
                error: 'Failed to remove profile picture.'
            });
        }
        res.status(200).json({
            message: 'Profile picture removed successfully.',
            user: updatedUser
        });
    }
    catch (error) {
        console.error('Error removing profile picture:', error);
        res.status(500).json({
            error: 'Internal server error while removing profile picture.'
        });
    }
});
// GET /api/users/:id - Get user by ID (Admin/Regulator or own profile)
router.get('/:id', auth_1.authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const currentUser = req.user;
        // Check if user is trying to access their own profile or has admin privileges
        if (currentUser.id !== id && !['AgencyAdmin', 'Regulator'].includes(currentUser.role)) {
            return res.status(403).json({ error: 'Access denied. You can only view your own profile.' });
        }
        const { data: user, error } = await supabase_1.supabase
            .from('users')
            .select('id, email, name, role, did, created_at')
            .eq('id', id)
            .single();
        if (error || !user) {
            return res.status(404).json({ error: 'User not found' });
        }
        const userProfile = {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            did: user.did,
            created_at: user.created_at,
        };
        res.status(200).json({
            user: userProfile,
        });
    }
    catch (error) {
        console.error('Get user by ID error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
exports.default = router;
