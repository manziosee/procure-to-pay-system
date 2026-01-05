#!/bin/bash

# Deploy to Fly.io with updated configuration
echo "🚀 Deploying to Fly.io..."

cd /home/manzi/Documents/projects/procure-to-pay-system/backend

# Deploy the app
fly deploy --config fly.toml

echo "✅ Deployment complete!"
echo "🔗 Backend URL: https://procure-to-pay-backend.fly.dev"
echo "🏥 Health Check: https://procure-to-pay-backend.fly.dev/health/"