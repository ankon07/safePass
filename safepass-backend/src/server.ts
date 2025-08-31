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
import insuranceRoutes from './api/insurance';
import escrowRoutes from './api/escrow';
import jobsRoutes from './api/jobs';
import applicationsRoutes from './api/applications';
import { trustScoreService } from './services/trustScoreService';

const app = express();

// Middleware
const allowedOrigins = [
  'http://localhost:3000',
  'http://192.168.0.147:3000',
  process.env.FRONTEND_URL
].filter(Boolean); // Remove any undefined values

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
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

// Debug: Log document routes registration
console.log('🔍 Registering document routes...');
console.log('Document routes object:', documentRoutes);
console.log('Document routes type:', typeof documentRoutes);

// Add middleware to log all incoming requests
app.use((req, res, next) => {
  console.log(`📥 ${req.method} ${req.path} - ${new Date().toISOString()}`);
  next();
});

app.use('/api', documentRoutes);

// Add a test route to verify mounting works
app.get('/api/test-route', (req, res) => {
  res.json({ message: 'Test route works!' });
});

app.use('/api', credentialRoutes);
app.use('/api/blockchain', blockchainRoutes);
app.use('/api/trust-scores', trustScoreRoutes);
app.use('/api/zkp', zkpRoutes);
app.use('/api/insurance', insuranceRoutes);
app.use('/api/escrow', escrowRoutes);
app.use('/api', jobsRoutes);
app.use('/api', applicationsRoutes);

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
      console.log(`🛡️ Insurance endpoints: http://localhost:${config.port}/api/insurance`);
      console.log(`💰 Escrow endpoints: http://localhost:${config.port}/api/escrow`);
      console.log(`💼 Jobs endpoints: http://localhost:${config.port}/api/jobs`);
      console.log(`📝 Applications endpoints: http://localhost:${config.port}/api/worker/applications`);
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
