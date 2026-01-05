#!/bin/bash

echo "🚀 Starting Local Development Environment"
echo "========================================="

# Start backend
echo "📡 Starting Django backend..."
cd /home/manzi/Documents/projects/procure-to-pay-system/backend

# Check if virtual environment exists
if [ ! -d "venv" ]; then
    echo "📦 Creating virtual environment..."
    python3 -m venv venv
fi

# Activate virtual environment
source venv/bin/activate

# Install requirements
echo "📦 Installing Python dependencies..."
pip install -r requirements.txt

# Run migrations
echo "🗄️ Running database migrations..."
python manage.py migrate

# Create demo users
echo "👥 Creating demo users..."
python create_demo_users.py

# Start Django server in background
echo "🌐 Starting Django server on http://localhost:8000"
python manage.py runserver 0.0.0.0:8000 &
DJANGO_PID=$!

# Wait a moment for Django to start
sleep 3

# Start frontend
echo "⚛️ Starting React frontend..."
cd ../frontend

# Install dependencies
echo "📦 Installing Node.js dependencies..."
npm install

# Start frontend server
echo "🌐 Starting React server on http://localhost:3000"
npm run dev &
REACT_PID=$!

echo ""
echo "✅ Development environment started!"
echo "🌐 Frontend: http://localhost:3000"
echo "📡 Backend: http://localhost:8000"
echo "📚 API Docs: http://localhost:8000/api/docs/"
echo ""
echo "Press Ctrl+C to stop all servers"

# Wait for user to stop
trap "echo 'Stopping servers...'; kill $DJANGO_PID $REACT_PID 2>/dev/null; exit" INT
wait