#!/bin/bash

# Fly.io Deployment Script for Procure-to-Pay Backend

echo "🚀 Starting Fly.io deployment for Procure-to-Pay Backend..."

# Check if flyctl is installed
if ! command -v flyctl &> /dev/null; then
    echo "❌ flyctl is not installed. Please install it first:"
    echo "curl -L https://fly.io/install.sh | sh"
    exit 1
fi

# Login to Fly.io (if not already logged in)
echo "🔐 Checking Fly.io authentication..."
flyctl auth whoami || flyctl auth login

# Create Fly.io app (if it doesn't exist)
echo "📱 Creating Fly.io app..."
flyctl apps create procure-to-pay-backend --generate-name || echo "App already exists"

# Create PostgreSQL database
echo "🗄️ Creating PostgreSQL database..."
flyctl postgres create --name procure-to-pay-db --region ord --vm-size shared-cpu-1x --volume-size 1 || echo "Database may already exist"

# Attach database to app
echo "🔗 Attaching database to app..."
flyctl postgres attach procure-to-pay-db --app procure-to-pay-backend || echo "Database may already be attached"

# Set secrets
echo "🔑 Setting application secrets..."
flyctl secrets set \
  SECRET_KEY="django-insecure-fly-production-$(openssl rand -hex 32)" \
  DEBUG="False" \
  OPENAI_API_KEY="YOUR_OPENAI_API_KEY" \
  ALLOWED_HOSTS="procure-to-pay-backend.fly.dev,localhost,127.0.0.1" \
  CORS_ALLOWED_ORIGINS="http://localhost:3000,https://your-frontend-domain.com" \
  --app procure-to-pay-backend

# Deploy the application
echo "🚀 Deploying application..."
flyctl deploy --app procure-to-pay-backend

# Create demo users
echo "👥 Creating demo users..."
flyctl ssh console --app procure-to-pay-backend -C "python manage.py create_demo_users"

echo "✅ Deployment completed!"
echo "🌐 Your API is available at: https://procure-to-pay-backend.fly.dev"
echo "📚 API Documentation: https://procure-to-pay-backend.fly.dev/api/docs/"
echo "🔍 Health Check: https://procure-to-pay-backend.fly.dev/health/"