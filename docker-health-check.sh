#!/bin/bash

# Docker Health Check Script
echo "🔍 Checking Docker setup..."

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker first."
    exit 1
fi

# Check if docker-compose is available
if ! command -v docker-compose &> /dev/null; then
    echo "❌ docker-compose is not installed."
    exit 1
fi

echo "✅ Docker and docker-compose are available"

# Check required files
required_files=(
    "backend/Dockerfile"
    "backend/requirements.txt"
    "backend/manage.py"
    "frontend/Dockerfile.dev"
    "frontend/package.json"
    "docker-compose.yml"
)

for file in "${required_files[@]}"; do
    if [ ! -f "$file" ]; then
        echo "❌ Missing required file: $file"
        exit 1
    fi
done

echo "✅ All required files are present"

# Check if ports are available
check_port() {
    if lsof -Pi :$1 -sTCP:LISTEN -t >/dev/null ; then
        echo "⚠️  Port $1 is already in use"
        return 1
    else
        echo "✅ Port $1 is available"
        return 0
    fi
}

check_port 3000
check_port 8000
check_port 6379

echo "🚀 Docker setup looks good! You can run:"
echo "   docker-compose up --build"