import { Router, Request, Response } from 'express';
import { authenticateToken } from '../middleware/auth';

const router = Router();

/**
 * GET /api/regulator/documents/verified
 * Simple test endpoint
 */
router.get('/regulator/documents/verified', authenticateToken, async (req: Request, res: Response) => {
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

    } catch (error) {
        console.error('Error in simple verified documents endpoint:', error);
        res.status(500).json({ 
            error: 'Internal server error.',
            details: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});

// Add a simple test route
router.get('/test-simple', (req: Request, res: Response) => {
  res.json({ message: 'Simple document router is working!' });
});

console.log('📋 Simple document routes registered');

export default router;
