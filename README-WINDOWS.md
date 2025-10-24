# SafePass - Windows Setup Quick Reference

🚀 **Complete automated setup for Windows environments**

## Quick Start (3 Steps)

### Step 1: Prerequisites Check

Ensure you have installed:
- ✅ **Node.js v18+** → [Download](https://nodejs.org/)
- ✅ **Docker Desktop** → [Download](https://www.docker.com/products/docker-desktop/)
- ✅ **Git** (optional) → [Download](https://git-scm.com/download/win)

**Start Docker Desktop before proceeding!**

### Step 2: Run Setup

Open Command Prompt in the project root and run:

```cmd
setup-windows.bat
```

The script will:
1. ✅ Verify prerequisites
2. ✅ Install all dependencies (backend & frontend)
3. ✅ Start Docker services (Besu blockchain & IPFS)
4. ✅ Compile smart contracts
5. ✅ Create environment configuration files
6. ✅ Generate quick-start helper scripts

**Estimated time: 10-15 minutes**

### Step 3: Start Development

After setup completes, use the generated scripts:

```cmd
start-all.bat        # Start everything at once
```

Or start services individually:

```cmd
start-docker.bat     # Start Docker services only
start-backend.bat    # Start backend API only
start-frontend.bat   # Start frontend only
stop-docker.bat      # Stop Docker services
```

## Access Your Application

Once services are running:

| Service | URL |
|---------|-----|
| **Frontend** | http://localhost:3000 |
| **Backend API** | http://localhost:3001 |
| **Besu RPC** | http://localhost:8545 |
| **IPFS Gateway** | http://localhost:8081 |

## What Gets Created?

After running `setup-windows.bat`, you'll have:

### Environment Files
- ✅ `safepass-backend/.env` - Backend configuration
- ✅ `safepass-frontend/.env.local` - Frontend configuration

### Helper Scripts
- ✅ `start-all.bat` - Launch all services
- ✅ `start-backend.bat` - Backend only
- ✅ `start-frontend.bat` - Frontend only  
- ✅ `start-docker.bat` - Docker services only
- ✅ `stop-docker.bat` - Stop Docker

### Installed & Configured
- ✅ All npm dependencies
- ✅ Docker containers (Besu + IPFS)
- ✅ Compiled smart contracts
- ✅ Ready-to-use development environment

## Important Configuration

### Before First Run

Edit `safepass-backend/.env` and update:

```env
# Required for database functionality
SUPABASE_URL=your_actual_supabase_url
SUPABASE_ANON_KEY=your_actual_anon_key
DATABASE_URL=your_actual_database_url

# Required for production
JWT_SECRET=change_this_to_a_secure_random_string
```

### Optional: Public Network Deployment

For deploying to Ethereum/Polygon/BSC testnets or mainnets, add:

```env
# Get from Infura, Alchemy, or other provider
ETHEREUM_SEPOLIA_URL=https://sepolia.infura.io/v3/YOUR_PROJECT_ID
POLYGON_MUMBAI_URL=https://polygon-mumbai.infura.io/v3/YOUR_PROJECT_ID

# Your testnet private key (with test tokens)
TESTNET_PRIVATE_KEY=your_testnet_private_key

# For contract verification
ETHERSCAN_API_KEY=your_etherscan_api_key
POLYGONSCAN_API_KEY=your_polygonscan_api_key
```

## Common Commands

### Development

```cmd
# Backend (from safepass-backend/)
npm run api:dev              # Start development server
npm run compile              # Compile contracts
npm run deploy:besu          # Deploy to local blockchain
npm run test                 # Run tests

# Frontend (from safepass-frontend/)
npm run dev                  # Start development server
npm run build                # Build for production
```

### Docker Management

```cmd
# From safepass-backend/
npm run start:all            # Start Besu + IPFS
npm run stop:all             # Stop all services
docker-compose ps            # Check service status
docker-compose logs          # View logs
```

## Troubleshooting

### Setup Fails?

**Check Docker is running:**
```cmd
docker ps
```
If this fails, start Docker Desktop and try again.

**Node.js version issues:**
```cmd
node --version
```
Must be v18 or higher.

**Port conflicts:**
Ensure ports 3000, 3001, 5001, 8081, 8545, 8546 are available.

### Services Won't Start?

**Reset Docker:**
```cmd
cd safepass-backend
docker-compose down
docker-compose up -d
```

**Reinstall Dependencies:**
```cmd
# Backend
cd safepass-backend
rmdir /s node_modules
npm install

# Frontend
cd safepass-frontend
rmdir /s node_modules
npm install
```

## Need Detailed Help?

📖 **See [WINDOWS-SETUP.md](WINDOWS-SETUP.md)** for:
- Detailed troubleshooting guide
- Manual setup instructions
- Complete command reference
- Development workflow
- Security best practices

## Project Structure

```
safePass/
│
├── setup-windows.bat          ← Run this first!
├── start-all.bat              ← Start everything
├── start-backend.bat          ← Backend only
├── start-frontend.bat         ← Frontend only
├── start-docker.bat           ← Docker only
├── stop-docker.bat            ← Stop Docker
│
├── README-WINDOWS.md          ← This file (quick ref)
├── WINDOWS-SETUP.md           ← Detailed guide
│
├── safepass-backend/          ← Backend & blockchain
│   ├── contracts/             ← Smart contracts
│   ├── src/                   ← API server
│   ├── scripts/               ← Deployment scripts
│   ├── .env                   ← Backend config (created by setup)
│   └── docker-compose.yml     ← Docker services
│
└── safepass-frontend/         ← Next.js frontend
    ├── app/                   ← Pages & routes
    ├── components/            ← React components
    └── .env.local             ← Frontend config (created by setup)
```

## Next Steps After Setup

1. **Update Environment Variables**
   - Edit `safepass-backend/.env` with your credentials
   
2. **Start Services**
   - Run `start-all.bat`
   
3. **Access Application**
   - Frontend: http://localhost:3000
   - Backend: http://localhost:3001

4. **Start Coding!**
   - Modify smart contracts in `safepass-backend/contracts/`
   - Update frontend in `safepass-frontend/app/`
   - Changes auto-reload in development mode

## Support & Documentation

- 📘 [Backend README](safepass-backend/README.md)
- 📗 [Frontend README](safepass-frontend/README.md)
- 📙 [API Documentation](safepass-backend/SafePass_API_Documentation.md)
- 📕 [Technical Architecture](safepass-backend/SAFEPASS_TECHNICAL_ARCHITECTURE.md)

## Security Reminder

⚠️ **Never commit real credentials!**

The `.env` files are in `.gitignore` - keep them safe and never share:
- Private keys
- API keys
- Database passwords
- JWT secrets

---

**Ready to start? Run `setup-windows.bat` now!** 🚀
