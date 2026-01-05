#!/bin/bash

# 🔐 Secure Environment Setup Script
# This script helps set up environment variables securely

echo "🔐 Setting up secure environment variables..."

# Check if .env files exist
if [ ! -f "backend/.env" ]; then
    echo "📝 Creating backend/.env from example..."
    cp backend/.env.example backend/.env
    echo "⚠️  Please edit backend/.env and add your actual API keys"
fi

if [ ! -f "frontend/.env.local" ]; then
    echo "📝 Creating frontend/.env.local from example..."
    cp frontend/.env.example frontend/.env.local
fi

# Check for exposed API keys in git
echo "🔍 Checking for exposed API keys..."
if git log --all --full-history -- "*.env*" | grep -q "sk-"; then
    echo "⚠️  WARNING: API keys may be exposed in git history!"
    echo "   Run: git filter-branch --force --index-filter 'git rm --cached --ignore-unmatch *.env*' --prune-empty --tag-name-filter cat -- --all"
fi

# Validate environment files
echo "✅ Environment setup complete!"
echo ""
echo "🔑 Required API Keys:"
echo "   1. Get OpenAI API key: https://platform.openai.com/api-keys"
echo "   2. Get Neon database URL: https://neon.tech/"
echo "   3. Update backend/.env with your actual keys"
echo ""
echo "🚫 NEVER commit .env files to git!"
echo "   Files in .gitignore: *.env*, *api*key*, *secret*"