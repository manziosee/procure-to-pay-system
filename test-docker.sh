#!/bin/bash

echo "🐳 Testing Docker Setup for Procure-to-Pay System"
echo "=================================================="

# Check if Docker is available
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed"
    exit 1
fi

echo "✅ Docker is available"

# Build and test
echo "🔨 Building containers..."
docker build -t procure-backend ./backend
docker build -t procure-frontend ./frontend

if [ $? -eq 0 ]; then
    echo "✅ Containers built successfully"
    echo ""
    echo "🚀 To start the system:"
    echo "   cp .env.docker.template .env"
    echo "   # Add your OPENAI_API_KEY to .env"
    echo "   docker compose -f docker-compose.simple.yml up"
    echo ""
    echo "📚 Access points:"
    echo "   Frontend: http://localhost:3000"
    echo "   Backend:  http://localhost:8000"
    echo "   API Docs: http://localhost:8000/api/docs/"
else
    echo "❌ Build failed"
    exit 1
fi