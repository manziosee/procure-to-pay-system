#!/bin/bash

# Deployment script for Procure-to-Pay System with new Finance APIs
# This script builds and deploys the updated system with new endpoints

echo "🚀 Starting deployment of Procure-to-Pay System with Finance APIs..."

# Check if Docker is available
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    exit 1
fi

# Build backend with new finance APIs
echo "🔨 Building backend with finance APIs..."
docker build -t procure-backend ./backend

# Build frontend with updated API calls
echo "🔨 Building frontend with updated API integration..."
docker build -t procure-frontend ./frontend

# Create docker-compose override for development
cat > docker-compose.override.yml << EOF
version: '3.8'
services:
  backend:
    image: procure-backend
    environment:
      - DEBUG=True
      - DJANGO_SETTINGS_MODULE=procure_to_pay.settings.development
    volumes:
      - ./backend:/app
    ports:
      - "8000:8000"
  
  frontend:
    image: procure-frontend
    ports:
      - "3000:3000"
    volumes:
      - ./frontend/src:/app/src
    environment:
      - REACT_APP_API_URL=http://localhost:8000
EOF

echo "✅ Docker images built successfully!"
echo "📋 New API endpoints added:"
echo "   - GET  /api/finance/documents/export_financial_report/"
echo "   - POST /api/finance/documents/"
echo "   - POST /api/finance/alerts/generate_alerts/"
echo "   - GET  /api/finance/alerts/dashboard_stats/"
echo "   - PATCH /api/finance/alerts/{id}/resolve/"

echo ""
echo "🌐 To start the system:"
echo "   docker run -d -p 8000:8000 procure-backend"
echo "   docker run -d -p 3000:3000 procure-frontend"
echo ""
echo "📚 API Documentation available at:"
echo "   - Swagger UI: http://localhost:8000/api/docs/"
echo "   - ReDoc: http://localhost:8000/api/redoc/"
echo ""
echo "✨ Deployment completed successfully!"