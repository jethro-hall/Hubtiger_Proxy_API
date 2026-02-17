
#!/bin/bash

# --- RIDEAI HUBTIGER PROXY MASTER UPDATE SCRIPT ---
# This script ensures the system is clean, updated, and running.

PORT=8095
LOG_FILE="proxy_logs.txt"

echo "------------------------------------------------"
echo "🚀 RIDEAI: Initializing Hubtiger Proxy System..."
echo "------------------------------------------------"

# 1. Kill any existing process on port 8095
echo "🧹 Cleaning up port $PORT..."
PID=$(lsof -t -i:$PORT)
if [ ! -z "$PID" ]; then
    echo "⚠️ Found process $PID using port $PORT. Terminating..."
    sudo kill -9 $PID
    sleep 1
    echo "✅ Port $PORT cleared."
else
    echo "✅ Port $PORT is already available."
fi

# 2. Setup Environment
if [ ! -f "package.json" ]; then
    echo "📦 Initializing package.json..."
    echo '{"type": "module"}' > package.json
fi

# 3. Install Dependencies
echo "📥 Installing required Node modules..."
npm install express axios cors dotenv

# 4. Environment Check
if [ ! -f ".env" ]; then
    echo "⚠️ .env file missing! Creating template..."
    echo "HUBTIGER_API_KEY=your_real_key_here" > .env
    echo "INTERNAL_KEY=ride-ai-secret-2024" >> .env
    echo "PORT=8095" >> .env
    echo "‼️ ACTION REQUIRED: Edit the .env file and add your HUBTIGER_API_KEY."
fi

# 5. Start the Server
echo "✨ Starting RideAI Proxy Server..."
nohup node server.js > $LOG_FILE 2>&1 &
SERVER_PID=$!

echo "✅ Server started in background (PID: $SERVER_PID)."
echo "🌍 Access Dashboard: http://$(curl -s ifconfig.me):$PORT"
echo "------------------------------------------------"
echo "📄 Opening live log stream (Ctrl+C to exit logs, server stays running)..."
echo "------------------------------------------------"

# 6. View Logs
touch $LOG_FILE
tail -f $LOG_FILE
