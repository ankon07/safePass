#!/bin/bash

echo "🚀 SafePass Phase 4 Setup Script"
echo "================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

# Check if Docker is running
echo "1️⃣ Checking Docker..."
if ! docker --version > /dev/null 2>&1; then
    print_error "Docker is not installed or not running"
    echo "Please install Docker Desktop and start it"
    exit 1
fi

if ! docker ps > /dev/null 2>&1; then
    print_error "Docker daemon is not running"
    echo "Please start Docker Desktop"
    exit 1
fi

print_status "Docker is running"
echo ""

# Start IPFS
echo "2️⃣ Starting IPFS node..."
print_info "Running: npm run start:ipfs"
npm run start:ipfs

echo ""
print_info "Waiting for IPFS to initialize..."
sleep 5

# Test IPFS connection
echo ""
echo "3️⃣ Testing IPFS connection..."
if npm run test:ipfs; then
    print_status "IPFS is ready!"
else
    print_error "IPFS failed to start properly"
    echo ""
    print_info "Checking IPFS container status..."
    docker ps | grep ipfs || print_warning "IPFS container not found"
    echo ""
    print_info "IPFS container logs:"
    docker logs ipfs_node_1 2>/dev/null || docker logs safepass-ipfs-node-1 2>/dev/null || echo "No IPFS container logs found"
    echo ""
    print_warning "Please check the logs above and try starting IPFS manually:"
    echo "  docker-compose up -d ipfs-node"
    exit 1
fi

echo ""

# Update database schema
echo "4️⃣ Updating database schema..."
print_info "Running: npm run setup:db"
if npm run setup:db; then
    print_status "Database schema updated"
else
    print_error "Failed to update database schema"
    print_warning "Please check your .env file has correct Supabase credentials"
    exit 1
fi

echo ""

# Check if API server is running
echo "5️⃣ Checking API server..."
if curl -s http://localhost:3001/health > /dev/null 2>&1; then
    print_status "API server is already running"
else
    print_warning "API server is not running"
    print_info "Please start the API server in a separate terminal:"
    echo "  npm run api:dev"
    echo ""
    print_info "Then wait for the server to start and run the Phase 4 test:"
    echo "  npm run test:phase4"
    exit 0
fi

echo ""

# Run Phase 4 test
echo "6️⃣ Running Phase 4 test..."
print_info "All services are ready. Running Phase 4 test..."
echo ""

if npm run test:phase4; then
    echo ""
    print_status "🎉 Phase 4 test completed successfully!"
    echo ""
    echo "📋 Summary:"
    echo "✅ IPFS node is running and accessible"
    echo "✅ Database schema is updated"
    echo "✅ API server is running"
    echo "✅ Phase 4 Verifiable Credential Ecosystem is working!"
else
    echo ""
    print_error "Phase 4 test failed"
    echo ""
    print_info "Troubleshooting steps:"
    echo "1. Check server logs in the terminal running 'npm run api:dev'"
    echo "2. Verify all services are running:"
    echo "   - IPFS: npm run test:ipfs"
    echo "   - API: curl http://localhost:3001/health"
    echo "3. Check the troubleshooting guide: PHASE4-TROUBLESHOOTING.md"
fi
