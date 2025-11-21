#!/bin/bash

echo "🔍 Docker Build Test - Checking for Issues"

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check prerequisites
echo "📋 Checking prerequisites..."
if ! command_exists docker; then
    echo "❌ Docker not installed"
    exit 1
fi

if ! command_exists docker-compose; then
    echo "❌ Docker Compose not installed"
    exit 1
fi

echo "✅ Docker and Docker Compose available"

# Test backend build only
echo "🐳 Testing backend Docker build..."
cd backend
docker build -t procure-backend-test . || {
    echo "❌ Backend build failed"
    exit 1
}
echo "✅ Backend build successful"

# Test frontend build only  
echo "🐳 Testing frontend Docker build..."
cd ../frontend
docker build -t procure-frontend-test . || {
    echo "❌ Frontend build failed"
    exit 1
}
echo "✅ Frontend build successful"

# Test development compose
echo "🐳 Testing development docker-compose..."
cd ..
docker-compose config || {
    echo "❌ Development compose config invalid"
    exit 1
}
echo "✅ Development compose config valid"

# Test production compose
echo "🐳 Testing production docker-compose..."
docker-compose -f docker-compose.prod.yml config || {
    echo "❌ Production compose config invalid"
    exit 1
}
echo "✅ Production compose config valid"

# Quick build test (no run)
echo "🐳 Testing full build (no run)..."
docker-compose build --no-cache || {
    echo "❌ Full build failed"
    exit 1
}
echo "✅ Full build successful"

# Cleanup test images
echo "🧹 Cleaning up test images..."
docker rmi procure-backend-test procure-frontend-test 2>/dev/null || true

echo "🎉 All Docker builds successful! No issues found."
echo ""
echo "📝 To run the application:"
echo "   Development: docker-compose up"
echo "   Production:  docker-compose -f docker-compose.prod.yml up"