# SafePass Windows Setup Guide

This guide provides detailed instructions for setting up the SafePass project on Windows environments.

## Prerequisites

Before running the setup script, ensure you have the following installed:

### Required Software

1. **Node.js (v18 or later)**
   - Download from: https://nodejs.org/
   - Recommended: LTS version
   - Verify installation: `node --version`

2. **Docker Desktop**
   - Download from: https://www.docker.com/products/docker-desktop/
   - Make sure Docker Desktop is running before setup
   - Verify installation: `docker --version`

3. **Git (Optional but recommended)**
   - Download from: https://git-scm.com/download/win
   - Useful for version control
   - Verify installation: `git --version`

### System Requirements

- Windows 10/11 (64-bit)
- At least 8GB RAM (16GB recommended)
- At least 10GB free disk space
- Internet connection for downloading dependencies

## Quick Start

### Option 1: Automated Setup (Recommended)

1. **Run the setup script:**
   ```cmd
   setup-windows.bat
   ```

2. The script will:
   - Check all prerequisites
   - Install backend dependencies
   - Install frontend dependencies
   - Start Docker services (Besu & IPFS)
   - Compile smart contracts
   - Create environment files
   - Generate quick-start helper scripts

3. **Follow the prompts** and wait for completion (approximately 10-15 minutes)

### Option 2: Manual Setup

If you prefer manual setup or need more control, follow these steps:

#### 1. Setup Backend

```cmd
cd safepass-backend
npm install
```

Create `.env` file with required variables (see Configuration section below).

#### 2. Setup Frontend

```cmd
cd safepass-frontend
npm install
```

Create `.env.local` file (see Configuration section below).

#### 3. Start Docker Services

```cmd
cd safepass-backend
docker-compose up -d
```

#### 4. Compile Contracts

```cmd
cd safepass-backend
npx hardhat compile
```

#### 5. Deploy Contracts

```cmd
npm run deploy:besu
```

## Quick Start Scripts

After running the setup, you'll have these convenient scripts:

### Start All Services
```cmd
start-all.bat
```
Starts Docker services, backend API, and frontend in separate windows.

### Individual Services

**Start Docker Services:**
```cmd
start-docker.bat
```

**Start Backend Only:**
```cmd
start-backend.bat
```

**Start Frontend Only:**
```cmd
start-frontend.bat
```

**Stop Docker Services:**
```cmd
stop-docker.bat
```

## Configuration

### Backend Environment Variables (`.env`)

Located in `safepass-backend/.env`:

```env
# Hyperledger Besu Configuration
BESU_LOCAL_PRIVATE_KEY=0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
BESU_RPC_URL=http://localhost:8545

# Database Configuration
SUPABASE_URL=your_supabase_url_here
SUPABASE_ANON_KEY=your_supabase_anon_key_here
DATABASE_URL=your_database_url_here

# IPFS Configuration
IPFS_API_URL=http://localhost:5001
IPFS_GATEWAY_URL=http://localhost:8081

# Ethereum Network Configuration
ETHEREUM_MAINNET_URL=https://mainnet.infura.io/v3/YOUR_PROJECT_ID
ETHEREUM_SEPOLIA_URL=https://sepolia.infura.io/v3/YOUR_PROJECT_ID

# Polygon Network Configuration
POLYGON_MAINNET_URL=https://polygon-mainnet.infura.io/v3/YOUR_PROJECT_ID
POLYGON_MUMBAI_URL=https://polygon-mumbai.infura.io/v3/YOUR_PROJECT_ID

# BSC Network Configuration
BSC_MAINNET_URL=https://bsc-dataseed.binance.org/
BSC_TESTNET_URL=https://data-seed-prebsc-1-s1.binance.org:8545/

# Private Keys for Public Networks
PUBLIC_NETWORK_PRIVATE_KEY=your_mainnet_private_key_here
TESTNET_PRIVATE_KEY=your_testnet_private_key_here

# API Keys for Contract Verification
ETHERSCAN_API_KEY=your_etherscan_api_key_here
POLYGONSCAN_API_KEY=your_polygonscan_api_key_here
BSCSCAN_API_KEY=your_bscscan_api_key_here

# JWT Configuration
JWT_SECRET=your_jwt_secret_here_change_this_in_production
JWT_EXPIRES_IN=7d

# Server Configuration
PORT=3001
NODE_ENV=development

# Bridge Configuration
BRIDGE_BATCH_SIZE=100
BRIDGE_CONFIRMATION_BLOCKS=12
BRIDGE_RETRY_ATTEMPTS=3
```

### Frontend Environment Variables (`.env.local`)

Located in `safepass-frontend/.env.local`:

```env
# Backend API URL
NEXT_PUBLIC_API_URL=http://localhost:3001

# Blockchain Configuration
NEXT_PUBLIC_BESU_RPC_URL=http://localhost:8545
NEXT_PUBLIC_CHAIN_ID=1337

# IPFS Configuration
NEXT_PUBLIC_IPFS_GATEWAY=http://localhost:8081
```

## Service URLs

After setup, you can access:

- **Frontend Application:** http://localhost:3000
- **Backend API:** http://localhost:3001
- **Besu Blockchain RPC:** http://localhost:8545
- **Besu WebSocket:** http://localhost:8546
- **IPFS API:** http://localhost:5001
- **IPFS Gateway:** http://localhost:8081

## Common Commands

### Backend Commands

```cmd
cd safepass-backend

# Development
npm run api:dev              # Start backend in development mode
npm run api:build            # Build backend for production
npm run api:start            # Start production backend

# Smart Contracts
npm run compile              # Compile smart contracts
npm run deploy:besu          # Deploy to local Besu network
npm run deploy:bridge:sepolia # Deploy to Ethereum Sepolia testnet
npm run test                 # Run smart contract tests

# Docker Services
npm run start:all            # Start Docker services
npm run stop:all             # Stop Docker services

# Database
npm run setup:db             # Setup database schema

# Testing
npm run test:api             # Test API endpoints
npm run test:phase4          # Run Phase 4 tests
npm run test:phase5          # Run Phase 5 tests
npm run test:phase6          # Run Phase 6 tests
```

### Frontend Commands

```cmd
cd safepass-frontend

npm run dev                  # Start development server
npm run build                # Build for production
npm run start                # Start production server
npm run lint                 # Run linter
```

## Troubleshooting

### Docker Issues

**Problem:** Docker services won't start
```cmd
# Check if Docker Desktop is running
docker ps

# If not running, start Docker Desktop and try again

# Check Docker logs
cd safepass-backend
docker-compose logs

# Restart services
docker-compose restart

# Clean restart
docker-compose down
docker-compose up -d
```

**Problem:** Port conflicts
- Check if ports 8545, 8546, 5001, 8081, 3000, or 3001 are in use
- Stop conflicting services or modify ports in `docker-compose.yml` and `.env` files

### Node.js Issues

**Problem:** npm install fails
```cmd
# Clear npm cache
npm cache clean --force

# Delete node_modules and package-lock.json
rmdir /s node_modules
del package-lock.json

# Reinstall
npm install
```

**Problem:** Node version warnings
- Ensure you're using Node.js v18 or later
- Consider using nvm-windows for managing Node versions

### Compilation Issues

**Problem:** Smart contract compilation fails
```cmd
cd safepass-backend

# Clean and recompile
npx hardhat clean
npx hardhat compile
```

### Database Issues

**Problem:** Database connection fails
- Verify Supabase credentials in `.env` file
- Check network connectivity
- Ensure Supabase service is active

### Windows-Specific Issues

**Problem:** "Permission Denied" errors
- Run Command Prompt as Administrator
- Check Windows Defender/Antivirus settings

**Problem:** Path too long errors
- Enable long path support in Windows:
  ```cmd
  reg add HKLM\SYSTEM\CurrentControlSet\Control\FileSystem /v LongPathsEnabled /t REG_DWORD /d 1 /f
  ```

**Problem:** Line ending issues (CRLF vs LF)
```cmd
# Configure Git to handle line endings
git config --global core.autocrlf true
```

## Development Workflow

### Daily Development

1. **Start Services:**
   ```cmd
   start-all.bat
   ```

2. **Make Changes:**
   - Edit files in your preferred editor
   - Changes auto-reload in development mode

3. **Test Changes:**
   - Backend: http://localhost:3001
   - Frontend: http://localhost:3000

4. **Stop Services:**
   - Close terminal windows or use Ctrl+C
   - Stop Docker: `stop-docker.bat`

### Testing Smart Contracts

```cmd
cd safepass-backend

# Run all tests
npm run test

# Run specific tests
npm run test:employment
npm run test:anchor
npm run test:bridge
```

### Deploying Contracts

```cmd
cd safepass-backend

# Deploy to local Besu
npm run deploy:besu

# Deploy to Ethereum Sepolia testnet
npm run deploy:bridge:sepolia

# Deploy to Polygon Mumbai testnet
npm run deploy:bridge:mumbai
```

## Project Structure

```
safePass/
├── safepass-backend/          # Backend API & Smart Contracts
│   ├── contracts/             # Solidity smart contracts
│   ├── scripts/               # Deployment scripts
│   ├── src/                   # Backend API source
│   ├── test/                  # Contract tests
│   ├── besu-config/           # Besu configuration
│   ├── docker-compose.yml     # Docker services
│   ├── hardhat.config.js      # Hardhat configuration
│   └── .env                   # Environment variables
│
├── safepass-frontend/         # Next.js Frontend
│   ├── app/                   # App router pages
│   ├── components/            # React components
│   ├── lib/                   # Utilities
│   └── .env.local             # Frontend environment
│
├── setup-windows.bat          # Main setup script
├── start-all.bat              # Start all services
├── start-backend.bat          # Start backend only
├── start-frontend.bat         # Start frontend only
├── start-docker.bat           # Start Docker services
├── stop-docker.bat            # Stop Docker services
└── WINDOWS-SETUP.md           # This file
```

## Additional Resources

### Documentation

- [Backend README](safepass-backend/README.md)
- [Frontend README](safepass-frontend/README.md)
- [API Documentation](safepass-backend/SafePass_API_Documentation.md)
- [Technical Architecture](safepass-backend/SAFEPASS_TECHNICAL_ARCHITECTURE.md)

### External Resources

- [Node.js Documentation](https://nodejs.org/docs/)
- [Docker Documentation](https://docs.docker.com/)
- [Hardhat Documentation](https://hardhat.org/docs)
- [Next.js Documentation](https://nextjs.org/docs)
- [Hyperledger Besu Documentation](https://besu.hyperledger.org/)

## Getting Help

If you encounter issues:

1. Check this troubleshooting guide
2. Review error messages carefully
3. Check Docker and service logs
4. Verify all prerequisites are installed correctly
5. Ensure environment variables are configured properly

## Security Notes

⚠️ **Important Security Reminders:**

- Never commit real private keys to version control
- Change default JWT secrets in production
- Use strong passwords for database credentials
- Keep dependencies updated
- Review and secure API endpoints before deployment

## Next Steps

After successful setup:

1. **Explore the Application:**
   - Navigate to http://localhost:3000
   - Create test accounts
   - Test various features

2. **Review Documentation:**
   - Read API documentation
   - Understand smart contract architecture
   - Review security considerations

3. **Start Development:**
   - Modify contracts in `safepass-backend/contracts/`
   - Update frontend in `safepass-frontend/app/`
   - Test changes locally

4. **Deploy to Testnet:**
   - Configure testnet credentials
   - Deploy contracts to public testnets
   - Test cross-chain functionality

---

**Happy Coding! 🚀**
