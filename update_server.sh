#!/bin/bash
PORT=8095
echo "🔧 Re-aligning RideAI Proxy..."

# Kill any existing node instances on our port
PID=$(lsof -t -i:$PORT)
if [ ! -z "$PID" ]; then
    echo "⚠️ Stopping old instance (PID: $PID)..."
    kill -9 $PID
    sleep 1
fi

# Start fresh
echo "✨ Starting Server..."
nohup node server.js > proxy_logs.txt 2>&1 &

sleep 1
tail -n 10 proxy_logs.txt
echo "✅ Done. Access at http://agents.rideai.com.au:$PORT"