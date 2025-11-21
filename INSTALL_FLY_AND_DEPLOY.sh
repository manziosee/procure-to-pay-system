#!/bin/bash

echo "🔧 Installing Fly CLI..."
curl -L https://fly.io/install.sh | sh

echo "📝 Adding Fly to PATH..."
export FLYCTL_INSTALL="/home/$USER/.fly"
export PATH="$FLYCTL_INSTALL/bin:$PATH"

echo "🔐 Login to Fly.io (this will open browser)..."
~/.fly/bin/fly auth login

echo "📁 Navigate to backend directory..."
cd backend

echo "🔑 Setting secrets..."
~/.fly/bin/fly secrets set SECRET_KEY='django-insecure-_dbg@2u6fv$(n3slh^if%6j1c@52f7a^g@0b74mhrko!_6tmlu' --app procure-to-pay-backend
~/.fly/bin/fly secrets set DEBUG=False --app procure-to-pay-backend

echo "🚀 Deploying..."
~/.fly/bin/fly deploy --app procure-to-pay-backend

echo "✅ Deployment complete! Testing..."
curl https://procure-to-pay-backend.fly.dev/health/