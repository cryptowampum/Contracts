#!/bin/bash
# SuperFantastic Quick Setup Script
# Run this to set up both backend and frontend locally

echo "🦄 SuperFantastic Team Minter - Quick Setup"
echo "============================================"
echo ""

# Check prerequisites
echo "📋 Checking prerequisites..."
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 16+ first."
    exit 1
fi
echo "✅ Node.js found: $(node --version)"

if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed."
    exit 1
fi
echo "✅ npm found: $(npm --version)"

# Ask for configuration
echo ""
echo "📝 Please provide the following information:"
read -p "Pinata API Key: " PINATA_API_KEY
read -p "Pinata Secret Key: " PINATA_SECRET_KEY
read -p "Contract Address: " CONTRACT_ADDRESS

# Create backend
echo ""
echo "🔧 Setting up backend..."
mkdir -p superfantastic-backend
cd superfantastic-backend

# Create package.json
cat > package.json << 'EOF'
{
  "name": "superfantastic-backend",
  "version": "1.0.0",
  "description": "Backend API for SuperFantastic NFT minting",
  "main": "server.js",
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js"
  },
  "dependencies": {
    "express": "^4.18.2",
    "cors": "^2.8.5",
    "multer": "^1.4.5-lts.1",
    "dotenv": "^16.3.1",
    "axios": "^1.6.2",
    "form-data": "^4.0.0"
  },
  "devDependencies": {
    "nodemon": "^3.0.2"
  }
}
EOF

# Create .env file
cat > .env << EOF
PINATA_API_KEY=$PINATA_API_KEY
PINATA_SECRET_KEY=$PINATA_SECRET_KEY
PORT=3001
FRONTEND_URL=http://localhost:3000
EOF

# Create .gitignore
cat > .gitignore << 'EOF'
node_modules/
.env
*.log
.DS_Store
EOF

echo "📦 Installing backend dependencies..."
npm install

echo "✅ Backend setup complete!"

# Create frontend
cd ..
echo ""
echo "🎨 Setting up frontend..."
npx create-react-app superfantastic-frontend

cd superfantastic-frontend
echo "📦 Installing frontend dependencies..."
npm install ethers lucide-react

echo "✅ Frontend setup complete!"

# Create start script
cd ..
cat > start.sh << 'EOF'
#!/bin/bash
echo "🚀 Starting SuperFantastic Team Minter..."
echo ""
echo "Starting backend on http://localhost:3001..."
cd superfantastic-backend
npm start &
BACKEND_PID=$!

sleep 3

echo "Starting frontend on http://localhost:3000..."
cd ../superfantastic-frontend
npm start &
FRONTEND_PID=$!

echo ""
echo "✅ Both servers started!"
echo "📍 Backend: http://localhost:3001"
echo "📍 Frontend: http://localhost:3000"
echo ""
echo "Press Ctrl+C to stop both servers"

# Wait for Ctrl+C
trap "kill $BACKEND_PID $FRONTEND_PID" EXIT
wait
EOF

chmod +x start.sh

echo ""
echo "✅ Setup complete!"
echo ""
echo "📋 Next steps:"
echo "1. Copy server.js into superfantastic-backend/ folder"
echo "2. Copy the React component into superfantastic-frontend/src/App.js"
echo "3. Update CONTRACT_ADDRESS in App.js to: $CONTRACT_ADDRESS"
echo "4. Run './start.sh' to start both servers"
echo ""
echo "📚 See DEPLOYMENT_GUIDE.md for full deployment instructions"