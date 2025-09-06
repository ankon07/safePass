"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const environment_1 = require("./config/environment");
const auth_1 = __importDefault(require("./api/auth"));
const users_1 = __importDefault(require("./api/users"));
const documents_1 = __importDefault(require("./api/documents"));
const credentials_1 = __importDefault(require("./api/credentials"));
const blockchain_1 = __importDefault(require("./api/blockchain"));
const trustScore_1 = __importDefault(require("./api/trustScore"));
const zkp_1 = __importDefault(require("./api/zkp"));
const insurance_1 = __importDefault(require("./api/insurance"));
const escrow_1 = __importDefault(require("./api/escrow"));
const jobs_1 = __importDefault(require("./api/jobs"));
const applications_1 = __importDefault(require("./api/applications"));
const trustScoreService_1 = require("./services/trustScoreService");
const app = (0, express_1.default)();
// Middleware
const allowedOrigins = [
    'http://localhost:3000',
    'http://192.168.0.147:3000',
    process.env.FRONTEND_URL
].filter(Boolean); // Remove any undefined values
app.use((0, cors_1.default)({
    origin: function (origin, callback) {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin)
            return callback(null, true);
        if (allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true);
        }
        else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
}));
app.use(express_1.default.json({ limit: '10mb' }));
app.use(express_1.default.urlencoded({ extended: true }));
// Health check endpoint
app.get('/health', (req, res) => {
    res.status(200).json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        service: 'SafePass API Gateway',
    });
});
// API Routes
app.use('/api/auth', auth_1.default);
app.use('/api/users', users_1.default);
// Debug: Log document routes registration
console.log('🔍 Registering document routes...');
console.log('Document routes object:', documents_1.default);
console.log('Document routes type:', typeof documents_1.default);
// Add middleware to log all incoming requests
app.use((req, res, next) => {
    console.log(`📥 ${req.method} ${req.path} - ${new Date().toISOString()}`);
    next();
});
app.use('/api', documents_1.default);
// Add a test route to verify mounting works
app.get('/api/test-route', (req, res) => {
    res.json({ message: 'Test route works!' });
});
app.use('/api', credentials_1.default);
app.use('/api/blockchain', blockchain_1.default);
app.use('/api/trust-scores', trustScore_1.default);
app.use('/api/zkp', zkp_1.default);
app.use('/api/insurance', insurance_1.default);
app.use('/api/escrow', escrow_1.default);
app.use('/api', jobs_1.default);
app.use('/api', applications_1.default);
// 404 handler
app.use((req, res) => {
    res.status(404).json({
        error: 'Route not found',
        path: req.originalUrl,
    });
});
// Global error handler
app.use((error, req, res, next) => {
    console.error('Unhandled error:', error);
    res.status(500).json({
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong',
    });
});
// Start server
const startServer = async () => {
    try {
        app.listen(environment_1.config.port, () => {
            console.log(`🚀 SafePass API Gateway running on port ${environment_1.config.port}`);
            console.log(`📊 Health check: http://localhost:${environment_1.config.port}/health`);
            console.log(`🔐 Auth endpoints: http://localhost:${environment_1.config.port}/api/auth`);
            console.log(`🔢 Trust Score endpoints: http://localhost:${environment_1.config.port}/api/trust-scores`);
            console.log(`🔐 ZKP endpoints: http://localhost:${environment_1.config.port}/api/zkp`);
            console.log(`🛡️ Insurance endpoints: http://localhost:${environment_1.config.port}/api/insurance`);
            console.log(`💰 Escrow endpoints: http://localhost:${environment_1.config.port}/api/escrow`);
            console.log(`💼 Jobs endpoints: http://localhost:${environment_1.config.port}/api/jobs`);
            console.log(`📝 Applications endpoints: http://localhost:${environment_1.config.port}/api/worker/applications`);
            console.log(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
            // Initialize trust score service
            console.log('🎯 Initializing trust score calculator...');
            trustScoreService_1.trustScoreService.startTrustScoreCalculator();
        });
    }
    catch (error) {
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
exports.default = app;
