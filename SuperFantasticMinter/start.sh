#!/bin/bash
echo "🚀 Starting SuperFantastic Team Minter..."
echo ""

# Check backend dependencies
if [ ! -d "superfantastic-backend/node_modules" ]; then
    echo "📦 Installing backend dependencies..."
    cd superfantastic-backend
    npm install
    cd ..
fi

# Check frontend dependencies
if [ ! -d "superfantastic-frontend/node_modules" ]; then
    echo "📦 Installing frontend dependencies..."
    cd superfantastic-frontend
    npm install
    cd ..
fi

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
trap "kill $BACKEND_PID $FRONTEND_PID 2>/dev/null" EXIT
wait