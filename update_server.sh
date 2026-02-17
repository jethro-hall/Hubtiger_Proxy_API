#!/bin/bash

# --- RIDEAI HUBTIGER PROXY MASTER UPDATE SCRIPT ---
PORT=8095
LOG_FILE="proxy_logs.txt"

echo "------------------------------------------------"
echo "🚀 RIDEAI: Updating & Restarting Proxy..."
echo "------------------------------------------------"

# 1. Kill any existing process on port 8095 (resilient)
echo "🧹 Cleaning up port $PORT..."
PID=$(lsof -t -i:$PORT)
if [ ! -z "$PID" ]; then
    echo "⚠️ Found process $PID using port $PORT. Force-killing..."
    sudo kill -9 $PID
    sleep 2
    echo "✅ Port $PORT cleared."
else
    echo "✅ Port $PORT is already available."
fi

# 2. Cleanup old logs
rm -f $LOG_FILE
touch $LOG_FILE

# 3. Environment Setup
if [ ! -f "package.json" ]; then
    echo '{"type": "module"}' > package.json
fi

# 4. Install Dependencies
echo "📥 Ensuring dependencies..."
npm install express axios cors dotenv > /dev/null 2>&1

# 5. Start the Server
echo "✨ Starting RideAI Proxy Server..."
nohup node server.js >> $LOG_FILE 2>&1 &
SERVER_PID=$!

sleep 3 # Give it time to start or crash

# 6. Final Status check
if ps -p $SERVER_PID > /dev/null; then
   echo "✅ Server successfully started (PID: $SERVER_PID)."
   echo "🌍 Dashboard: http://agents.rideai.com.au:$PORT"
   echo "------------------------------------------------"
   echo "👀 ATTACHING TO LOGS (Ctrl+C to stop viewing):"
   echo "------------------------------------------------"
   tail -f $LOG_FILE
else
   echo "❌ Server failed to start. REASON BELOW:"
   echo "------------------------------------------------"
   cat $LOG_FILE
   exit 1
fi