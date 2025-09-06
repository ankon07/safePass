"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const router = (0, express_1.Router)();
// Simple test route
router.get('/regulator/documents/verified', (req, res) => {
    console.log('✅ NEW DOCUMENTS ROUTE HIT!');
    res.json({
        message: 'Verified documents retrieved successfully.',
        data: [],
        count: 0
    });
});
router.get('/test-new-documents', (req, res) => {
    res.json({ message: 'New document router is working!' });
});
console.log('📋 NEW Document routes registered successfully');
exports.default = router;
