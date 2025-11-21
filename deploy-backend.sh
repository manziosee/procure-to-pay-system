#!/bin/bash

echo "🚀 Deploying Procure-to-Pay Backend to Fly.io"

cd backend

# Set required secrets (replace with actual values)
echo "📝 Setting secrets..."
fly secrets set SECRET_KEY='django-insecure-_dbg@2u6fv$(n3slh^if%6j1c@52f7a^g@0b74mhrko!_6tmlu' --app procure-to-pay-backend
fly secrets set DEBUG=False --app procure-to-pay-backend
fly secrets set ALLOWED_HOSTS="procure-to-pay-backend.fly.dev,localhost" --app procure-to-pay-backend

# Deploy the application
echo "🚀 Deploying application..."
fly deploy --app procure-to-pay-backend

# Check deployment status
echo "✅ Checking deployment status..."
fly status --app procure-to-pay-backend

echo "🌐 Backend should be available at: https://procure-to-pay-backend.fly.dev"
echo "📚 API docs: https://procure-to-pay-backend.fly.dev/swagger/"
echo "🔍 Health check: https://procure-to-pay-backend.fly.dev/health/"