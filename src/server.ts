import express from 'express';
import cors from 'cors';
import { config } from './config/environment';
import authRoutes from './api/auth';
import userRoutes from './api/users';
import documentRoutes from './api/documents';
import credentialRoutes from './api/credentials';
import blockchainRoutes from './api/blockchain';
import trustScoreRoutes from './api/trustScore';
import zkpRoutes from './api/zkp';
import { trustScoreService } from './services/trustScoreService';

const app = express();

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    service: 'SafePass API Gateway',
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api', documentRoutes);
app.use('/api', credentialRoutes);
app.use('/api/blockchain', blockchainRoutes);
app.use('/api/trust-scores', trustScoreRoutes);
app.use('/api/zkp', zkpRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Route not found',
    path: req.originalUrl,
  });
});

// Global error handler
app.use((error: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Unhandled error:', error);
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong',
  });
});

// Start server
const startServer = async () => {
  try {
    app.listen(config.port, () => {
      console.log(`🚀 SafePass API Gateway running on port ${config.port}`);
      console.log(`📊 Health check: http://localhost:${config.port}/health`);
      console.log(`🔐 Auth endpoints: http://localhost:${config.port}/api/auth`);
      console.log(`🔢 Trust Score endpoints: http://localhost:${config.port}/api/trust-scores`);
      console.log(`🔐 ZKP endpoints: http://localhost:${config.port}/api/zkp`);
      console.log(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
      
      // Initialize trust score service
      console.log('🎯 Initializing trust score calculator...');
      trustScoreService.startTrustScoreCalculator();
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Handle graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  process.exit(0);
});

startServer();

export default app;
