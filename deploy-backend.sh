#!/bin/bash

echo "🚀 Deploying Procure-to-Pay Backend to Fly.io"

cd backend

# Set required secrets (replace with actual values)
echo "📝 Setting secrets..."
echo "⚠️  WARNING: Update these secrets with secure values before deployment!"
fly secrets set SECRET_KEY='<generate-secure-secret-key>' --app procure-to-pay-backend
fly secrets set DEBUG=False --app procure-to-pay-backend
fly secrets set ALLOWED_HOSTS="procure-to-pay-backend.fly.dev" --app procure-to-pay-backend
fly secrets set DB_PASSWORD='<your-secure-db-password>' --app procure-to-pay-backend
fly secrets set OPENAI_API_KEY='<your-openai-api-key>' --app procure-to-pay-backend

# Deploy the application
echo "🚀 Deploying application..."
fly deploy --app procure-to-pay-backend

# Check deployment status
echo "✅ Checking deployment status..."
fly status --app procure-to-pay-backend

echo "🌐 Backend should be available at: https://procure-to-pay-backend.fly.dev"
echo "📚 API docs: https://procure-to-pay-backend.fly.dev/redoc/"
echo "🔍 Health check: https://procure-to-pay-backend.fly.dev/health/"
echo "⚙️  Admin panel: https://procure-to-pay-backend.fly.dev/admin/"