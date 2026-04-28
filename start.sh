#!/bin/bash
set -e
cd "$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Install frontend deps if needed
if [ ! -d "node_modules" ]; then
  echo "Installing frontend dependencies..."
  npm install
fi

# Set up Python venv if needed
if [ ! -d ".venv" ]; then
  echo "Creating Python virtual environment..."
  python3 -m venv .venv
fi

source .venv/bin/activate

# Install Python deps if needed
pip install -q -r requirements.txt

echo "Starting backend..."
(cd backend && python app.py) &
BACKEND_PID=$!

echo "Starting frontend..."
npm run dev &
FRONTEND_PID=$!

echo ""
echo "App running at http://localhost:5173"
echo "Press Ctrl+C to stop."

trap "kill $BACKEND_PID $FRONTEND_PID 2>/dev/null" EXIT
wait
