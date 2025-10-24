@echo off
REM ============================================================================
REM SafePass Complete Windows Setup Script
REM ============================================================================
REM This script sets up the entire SafePass project on Windows
REM Prerequisites: Node.js (v18+), Docker Desktop, Git
REM ============================================================================

setlocal enabledelayedexpansion

echo.
echo ============================================================================
echo                    SafePass Windows Setup Script
echo ============================================================================
echo.

REM Set colors for output
set "GREEN=[92m"
set "YELLOW=[93m"
set "RED=[91m"
set "RESET=[0m"

REM ============================================================================
REM Step 1: Check Prerequisites
REM ============================================================================
echo %YELLOW%[1/10] Checking Prerequisites...%RESET%
echo.

REM Check Node.js
echo Checking Node.js installation...
node --version >nul 2>&1
if errorlevel 1 (
    echo %RED%ERROR: Node.js is not installed!%RESET%
    echo Please install Node.js v18 or later from https://nodejs.org/
    pause
    exit /b 1
)
for /f "tokens=*" %%i in ('node --version') do set NODE_VERSION=%%i
echo %GREEN%✓ Node.js found: %NODE_VERSION%%RESET%

REM Check npm
echo Checking npm installation...
npm --version >nul 2>&1
if errorlevel 1 (
    echo %RED%ERROR: npm is not installed!%RESET%
    pause
    exit /b 1
)
for /f "tokens=*" %%i in ('npm --version') do set NPM_VERSION=%%i
echo %GREEN%✓ npm found: v%NPM_VERSION%%RESET%

REM Check Docker
echo Checking Docker installation...
docker --version >nul 2>&1
if errorlevel 1 (
    echo %RED%ERROR: Docker is not installed!%RESET%
    echo Please install Docker Desktop from https://www.docker.com/products/docker-desktop/
    pause
    exit /b 1
)
for /f "tokens=*" %%i in ('docker --version') do set DOCKER_VERSION=%%i
echo %GREEN%✓ Docker found: %DOCKER_VERSION%%RESET%

REM Check Docker is running
docker ps >nul 2>&1
if errorlevel 1 (
    echo %YELLOW%WARNING: Docker is not running!%RESET%
    echo Please start Docker Desktop and try again.
    pause
    exit /b 1
)
echo %GREEN%✓ Docker is running%RESET%

REM Check Git
echo Checking Git installation...
git --version >nul 2>&1
if errorlevel 1 (
    echo %YELLOW%WARNING: Git is not installed (optional)%RESET%
) else (
    for /f "tokens=*" %%i in ('git --version') do set GIT_VERSION=%%i
    echo %GREEN%✓ Git found: %GIT_VERSION%%RESET%
)

echo.
echo %GREEN%All prerequisites met!%RESET%
echo.
pause

REM ============================================================================
REM Step 2: Setup Backend Environment
REM ============================================================================
echo %YELLOW%[2/10] Setting up Backend Environment...%RESET%
echo.

cd safepass-backend

REM Create .env file if it doesn't exist
if not exist .env (
    echo Creating .env file...
    (
        echo # Hyperledger Besu Configuration
        echo BESU_LOCAL_PRIVATE_KEY=0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
        echo BESU_RPC_URL=http://localhost:8545
        echo.
        echo # Database Configuration
        echo SUPABASE_URL=your_supabase_url_here
        echo SUPABASE_ANON_KEY=your_supabase_anon_key_here
        echo DATABASE_URL=your_database_url_here
        echo.
        echo # IPFS Configuration
        echo IPFS_API_URL=http://localhost:5001
        echo IPFS_GATEWAY_URL=http://localhost:8081
        echo.
        echo # Ethereum Network Configuration
        echo ETHEREUM_MAINNET_URL=https://mainnet.infura.io/v3/YOUR_PROJECT_ID
        echo ETHEREUM_SEPOLIA_URL=https://sepolia.infura.io/v3/YOUR_PROJECT_ID
        echo.
        echo # Polygon Network Configuration
        echo POLYGON_MAINNET_URL=https://polygon-mainnet.infura.io/v3/YOUR_PROJECT_ID
        echo POLYGON_MUMBAI_URL=https://polygon-mumbai.infura.io/v3/YOUR_PROJECT_ID
        echo.
        echo # BSC Network Configuration
        echo BSC_MAINNET_URL=https://bsc-dataseed.binance.org/
        echo BSC_TESTNET_URL=https://data-seed-prebsc-1-s1.binance.org:8545/
        echo.
        echo # Private Keys for Public Networks
        echo PUBLIC_NETWORK_PRIVATE_KEY=your_mainnet_private_key_here
        echo TESTNET_PRIVATE_KEY=your_testnet_private_key_here
        echo.
        echo # API Keys for Contract Verification
        echo ETHERSCAN_API_KEY=your_etherscan_api_key_here
        echo POLYGONSCAN_API_KEY=your_polygonscan_api_key_here
        echo BSCSCAN_API_KEY=your_bscscan_api_key_here
        echo.
        echo # JWT Configuration
        echo JWT_SECRET=your_jwt_secret_here_change_this_in_production
        echo JWT_EXPIRES_IN=7d
        echo.
        echo # Server Configuration
        echo PORT=3001
        echo NODE_ENV=development
        echo.
        echo # Bridge Configuration
        echo BRIDGE_BATCH_SIZE=100
        echo BRIDGE_CONFIRMATION_BLOCKS=12
        echo BRIDGE_RETRY_ATTEMPTS=3
    ) > .env
    echo %GREEN%✓ .env file created%RESET%
    echo %YELLOW%NOTE: Please update .env file with your actual credentials!%RESET%
) else (
    echo %GREEN%✓ .env file already exists%RESET%
)

echo.
pause

REM ============================================================================
REM Step 3: Install Backend Dependencies
REM ============================================================================
echo %YELLOW%[3/10] Installing Backend Dependencies...%RESET%
echo.

echo Installing npm packages (this may take a few minutes)...
call npm install
if errorlevel 1 (
    echo %RED%ERROR: Backend dependencies installation failed!%RESET%
    cd ..
    pause
    exit /b 1
)
echo %GREEN%✓ Backend dependencies installed%RESET%

cd ..
echo.
pause

REM ============================================================================
REM Step 4: Install Frontend Dependencies
REM ============================================================================
echo %YELLOW%[4/10] Installing Frontend Dependencies...%RESET%
echo.

cd safepass-frontend

echo Installing npm packages (this may take a few minutes)...
call npm install
if errorlevel 1 (
    echo %RED%ERROR: Frontend dependencies installation failed!%RESET%
    cd ..
    pause
    exit /b 1
)
echo %GREEN%✓ Frontend dependencies installed%RESET%

cd ..
echo.
pause

REM ============================================================================
REM Step 5: Start Docker Services
REM ============================================================================
echo %YELLOW%[5/10] Starting Docker Services (Besu ^& IPFS)...%RESET%
echo.

cd safepass-backend

echo Starting Docker containers...
docker-compose up -d
if errorlevel 1 (
    echo %RED%ERROR: Failed to start Docker services!%RESET%
    echo Please make sure Docker Desktop is running.
    cd ..
    pause
    exit /b 1
)

echo %GREEN%✓ Docker services started%RESET%
echo.
echo Waiting for services to initialize (30 seconds)...
timeout /t 30 /nobreak >nul

REM Check service status
echo.
echo Checking service status...
docker-compose ps
echo.

REM Test Besu connection
echo Testing Besu node connection...
curl -X POST -H "Content-Type: application/json" --data "{\"jsonrpc\":\"2.0\",\"method\":\"eth_blockNumber\",\"params\":[],\"id\":1}" http://localhost:8545 >nul 2>&1
if errorlevel 1 (
    echo %YELLOW%WARNING: Besu node may not be ready yet%RESET%
) else (
    echo %GREEN%✓ Besu node is responding%RESET%
)

REM Test IPFS connection
echo Testing IPFS node connection...
curl -X POST http://localhost:5001/api/v0/version >nul 2>&1
if errorlevel 1 (
    echo %YELLOW%WARNING: IPFS node may not be ready yet%RESET%
) else (
    echo %GREEN%✓ IPFS node is responding%RESET%
)

cd ..
echo.
pause

REM ============================================================================
REM Step 6: Compile Smart Contracts
REM ============================================================================
echo %YELLOW%[6/10] Compiling Smart Contracts...%RESET%
echo.

cd safepass-backend

echo Compiling contracts with Hardhat...
call npx hardhat compile
if errorlevel 1 (
    echo %RED%ERROR: Contract compilation failed!%RESET%
    cd ..
    pause
    exit /b 1
)
echo %GREEN%✓ Smart contracts compiled successfully%RESET%

cd ..
echo.
pause

REM ============================================================================
REM Step 7: Database Setup
REM ============================================================================
echo %YELLOW%[7/10] Setting up Database...%RESET%
echo.

cd safepass-backend

echo %YELLOW%NOTE: Database setup requires Supabase credentials in .env file%RESET%
echo.
echo Do you want to run database setup now? (Y/N)
set /p DB_SETUP="Enter choice: "

if /i "%DB_SETUP%"=="Y" (
    echo Running database setup...
    call npm run setup:db
    if errorlevel 1 (
        echo %YELLOW%WARNING: Database setup failed. You may need to configure it manually.%RESET%
    ) else (
        echo %GREEN%✓ Database setup completed%RESET%
    )
) else (
    echo %YELLOW%Database setup skipped. You can run it later with: npm run setup:db%RESET%
)

cd ..
echo.
pause

REM ============================================================================
REM Step 8: Deploy Smart Contracts
REM ============================================================================
echo %YELLOW%[8/10] Deploying Smart Contracts to Local Besu Network...%RESET%
echo.

cd safepass-backend

echo Do you want to deploy contracts now? (Y/N)
set /p DEPLOY_CONTRACTS="Enter choice: "

if /i "%DEPLOY_CONTRACTS%"=="Y" (
    echo Deploying contracts to Besu local network...
    call npm run deploy:besu
    if errorlevel 1 (
        echo %YELLOW%WARNING: Contract deployment failed. You can try again later.%RESET%
    ) else (
        echo %GREEN%✓ Smart contracts deployed successfully%RESET%
    )
) else (
    echo %YELLOW%Contract deployment skipped. You can deploy later with: npm run deploy:besu%RESET%
)

cd ..
echo.
pause

REM ============================================================================
REM Step 9: Setup Frontend Environment
REM ============================================================================
echo %YELLOW%[9/10] Setting up Frontend Environment...%RESET%
echo.

cd safepass-frontend

REM Create .env.local file if it doesn't exist
if not exist .env.local (
    echo Creating .env.local file...
    (
        echo # Backend API URL
        echo NEXT_PUBLIC_API_URL=http://localhost:3001
        echo.
        echo # Blockchain Configuration
        echo NEXT_PUBLIC_BESU_RPC_URL=http://localhost:8545
        echo NEXT_PUBLIC_CHAIN_ID=1337
        echo.
        echo # IPFS Configuration
        echo NEXT_PUBLIC_IPFS_GATEWAY=http://localhost:8081
    ) > .env.local
    echo %GREEN%✓ .env.local file created%RESET%
) else (
    echo %GREEN%✓ .env.local file already exists%RESET%
)

cd ..
echo.
pause

REM ============================================================================
REM Step 10: Final Instructions
REM ============================================================================
echo %YELLOW%[10/10] Setup Complete!%RESET%
echo.
echo ============================================================================
echo                         Setup Summary
echo ============================================================================
echo.
echo %GREEN%✓ Backend dependencies installed%RESET%
echo %GREEN%✓ Frontend dependencies installed%RESET%
echo %GREEN%✓ Docker services started (Besu ^& IPFS)%RESET%
echo %GREEN%✓ Smart contracts compiled%RESET%
echo %GREEN%✓ Environment files created%RESET%
echo.
echo ============================================================================
echo                      Next Steps
echo ============================================================================
echo.
echo 1. Update environment variables:
echo    - Edit safepass-backend\.env with your credentials
echo    - Edit safepass-frontend\.env.local if needed
echo.
echo 2. Start the Backend API:
echo    cd safepass-backend
echo    npm run api:dev
echo.
echo 3. Start the Frontend (in a new terminal):
echo    cd safepass-frontend
echo    npm run dev
echo.
echo 4. Access the application:
echo    - Frontend: http://localhost:3000
echo    - Backend API: http://localhost:3001
echo    - Besu RPC: http://localhost:8545
echo    - IPFS Gateway: http://localhost:8081
echo.
echo ============================================================================
echo                    Additional Commands
echo ============================================================================
echo.
echo Backend Commands:
echo   npm run compile          - Compile smart contracts
echo   npm run deploy:besu      - Deploy contracts to local Besu
echo   npm run test            - Run smart contract tests
echo   npm run start:all       - Start Docker services
echo   npm run stop:all        - Stop Docker services
echo   npm run api:dev         - Start backend API in development mode
echo.
echo Frontend Commands:
echo   npm run dev             - Start development server
echo   npm run build           - Build for production
echo   npm run start           - Start production server
echo.
echo ============================================================================
echo.
echo %GREEN%Setup completed successfully!%RESET%
echo.
echo Press any key to create quick start scripts...
pause >nul

REM ============================================================================
REM Create Quick Start Scripts
REM ============================================================================
echo.
echo Creating quick start scripts...

REM Create start-backend.bat
(
    echo @echo off
    echo echo Starting SafePass Backend...
    echo cd safepass-backend
    echo start cmd /k "npm run api:dev"
    echo echo Backend started in a new window!
    echo pause
) > start-backend.bat
echo %GREEN%✓ Created start-backend.bat%RESET%

REM Create start-frontend.bat
(
    echo @echo off
    echo echo Starting SafePass Frontend...
    echo cd safepass-frontend
    echo start cmd /k "npm run dev"
    echo echo Frontend started in a new window!
    echo pause
) > start-frontend.bat
echo %GREEN%✓ Created start-frontend.bat%RESET%

REM Create start-docker.bat
(
    echo @echo off
    echo echo Starting Docker Services...
    echo cd safepass-backend
    echo docker-compose up -d
    echo echo.
    echo docker-compose ps
    echo echo.
    echo echo Docker services started!
    echo pause
) > start-docker.bat
echo %GREEN%✓ Created start-docker.bat%RESET%

REM Create stop-docker.bat
(
    echo @echo off
    echo echo Stopping Docker Services...
    echo cd safepass-backend
    echo docker-compose down
    echo echo.
    echo echo Docker services stopped!
    echo pause
) > stop-docker.bat
echo %GREEN%✓ Created stop-docker.bat%RESET%

REM Create start-all.bat
(
    echo @echo off
    echo echo Starting All SafePass Services...
    echo echo.
    echo echo [1/3] Starting Docker services...
    echo cd safepass-backend
    echo docker-compose up -d
    echo echo.
    echo timeout /t 10 /nobreak ^>nul
    echo echo [2/3] Starting Backend API...
    echo start cmd /k "npm run api:dev"
    echo cd ..
    echo echo.
    echo echo [3/3] Starting Frontend...
    echo cd safepass-frontend
    echo timeout /t 5 /nobreak ^>nul
    echo start cmd /k "npm run dev"
    echo cd ..
    echo echo.
    echo echo ============================================================
    echo echo All services started!
    echo echo.
    echo echo Frontend: http://localhost:3000
    echo echo Backend API: http://localhost:3001
    echo echo Besu RPC: http://localhost:8545
    echo echo IPFS Gateway: http://localhost:8081
    echo echo ============================================================
    echo pause
) > start-all.bat
echo %GREEN%✓ Created start-all.bat%RESET%

echo.
echo ============================================================================
echo                     Quick Start Scripts Created
echo ============================================================================
echo.
echo You can now use these convenient scripts:
echo.
echo   start-all.bat       - Start all services (Docker, Backend, Frontend)
echo   start-docker.bat    - Start Docker services only
echo   start-backend.bat   - Start backend API only
echo   start-frontend.bat  - Start frontend only
echo   stop-docker.bat     - Stop Docker services
echo.
echo ============================================================================
echo.
echo %GREEN%All done! You're ready to start developing with SafePass!%RESET%
echo.
pause

endlocal
