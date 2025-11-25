#!/usr/bin/env bash
# Render build script

set -o errexit  # exit on error

echo "🔧 Installing dependencies..."
pip install -r requirements.txt

echo "📦 Collecting static files..."
python manage.py collectstatic --no-input

echo "🗄️ Running database migrations..."
python manage.py migrate

echo "👥 Creating demo users..."
python create_demo_users.py

echo "✅ Build completed successfully!"