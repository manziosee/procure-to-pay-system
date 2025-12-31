#!/bin/bash

echo "🐳 Testing Docker Build and Run..."

# Build and start services
echo "📦 Building and starting services..."
docker-compose up --build -d

# Wait for services to be ready
echo "⏳ Waiting for services to start..."
sleep 30

# Test health endpoints
echo "🔍 Testing health endpoints..."
curl -f http://localhost:8000/health/ || echo "❌ Backend health check failed"
curl -f http://localhost:8000/ || echo "❌ Backend root failed"

# Test API login
echo "🔐 Testing API login..."
curl -X POST http://localhost:8000/api/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{"username": "staff1", "password": "password123"}' || echo "❌ Login test failed"

# Show logs if there are issues
echo "📋 Recent logs:"
docker-compose logs --tail=20 backend

echo "✅ Docker test completed!"
echo "🌐 Backend: http://localhost:8000"
echo "🌐 Frontend: http://localhost:3000"
echo "📚 Swagger: http://localhost:8000/swagger/"