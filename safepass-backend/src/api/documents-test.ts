import { Router, Request, Response } from 'express';

const router = Router();

// Simple test route
router.get('/regulator/documents/verified', (req: Request, res: Response) => {
  console.log('✅ NEW DOCUMENTS ROUTE HIT!');
  res.json({
    message: 'Verified documents retrieved successfully.',
    data: [],
    count: 0
  });
});

router.get('/test-new-documents', (req: Request, res: Response) => {
  res.json({ message: 'New document router is working!' });
});

console.log('📋 NEW Document routes registered successfully');

export default router;
