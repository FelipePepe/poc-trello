#!/bin/bash
# Start both backend and frontend dev servers

echo "🚀 Starting Trello Clone POC..."
echo ""

# Start backend
echo "📦 Starting backend on http://localhost:3000..."
cd "$(dirname "$0")/backend" && npm run dev &
BACKEND_PID=$!

# Wait for backend to start
sleep 2

# Start frontend
echo "🅰️  Starting Angular on http://localhost:4200..."
cd "$(dirname "$0")/frontend" && ng serve &
FRONTEND_PID=$!

echo ""
echo "✅ Both servers started!"
echo "   Frontend: http://localhost:4200"
echo "   Backend:  http://localhost:3000"
echo "   Swagger:  http://localhost:3000/api-docs"
echo ""
echo "Press Ctrl+C to stop both servers"

# Wait for both
wait $BACKEND_PID $FRONTEND_PID
