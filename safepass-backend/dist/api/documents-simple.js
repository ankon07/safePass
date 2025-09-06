"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
/**
 * GET /api/regulator/documents/verified
 * Simple test endpoint
 */
router.get('/regulator/documents/verified', auth_1.authenticateToken, async (req, res) => {
    console.log('📋 Simple verified documents endpoint hit!');
    try {
        // Verify user is a regulator
        if (!req.user || req.user.role !== 'Regulator') {
            return res.status(403).json({
                error: 'Access denied. Only regulators can view verified documents.'
            });
        }
        res.json({
            message: 'Simple verified documents endpoint working!',
            data: [],
            count: 0
        });
    }
    catch (error) {
        console.error('Error in simple verified documents endpoint:', error);
        res.status(500).json({
            error: 'Internal server error.',
            details: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
// Add a simple test route
router.get('/test-simple', (req, res) => {
    res.json({ message: 'Simple document router is working!' });
});
console.log('📋 Simple document routes registered');
exports.default = router;
