# 🐳 Docker Setup Guide

## Quick Start

### Option 1: Complete Local Setup (Recommended for Development)
```bash
git clone https://github.com/manziosee/procure-to-pay-system.git
cd procure-to-pay-system
docker-compose -f docker-compose.local.yml up --build
```

### Option 2: Using External Database (Current Production Setup)
```bash
git clone https://github.com/manziosee/procure-to-pay-system.git
cd procure-to-pay-system
docker-compose up --build
```

## 🌐 Access Points

After running `docker-compose up --build`:

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **Swagger UI**: http://localhost:8000/api/docs/
- **ReDoc**: http://localhost:8000/api/redoc/
- **Health Check**: http://localhost:8000/health/

## 📋 Services Included

### Local Setup (`docker-compose.local.yml`)
- ✅ **PostgreSQL**: Local database
- ✅ **Redis**: Caching and sessions
- ✅ **Backend**: Django API server
- ✅ **Frontend**: React development server

### Production Setup (`docker-compose.yml`)
- ✅ **Redis**: Caching and sessions
- ✅ **Backend**: Django API server (uses external PostgreSQL)
- ✅ **Frontend**: React development server

## 🔧 Configuration

### Environment Variables
Copy and customize the environment file:
```bash
cp .env.example .env
# Edit .env with your values
```

### Demo Users
The system automatically creates demo users:
- **Staff**: staff1@example.com / password123
- **Approver L1**: approver1@example.com / password123
- **Approver L2**: approver2@example.com / password123
- **Finance**: finance1@example.com / password123

## 🛠️ Development Commands

### View Logs
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend
docker-compose logs -f frontend
```

### Restart Services
```bash
# Restart all
docker-compose restart

# Restart specific service
docker-compose restart backend
```

### Execute Commands in Containers
```bash
# Backend shell
docker-compose exec backend bash

# Run Django commands
docker-compose exec backend python manage.py migrate
docker-compose exec backend python manage.py createsuperuser
```

### Stop and Clean Up
```bash
# Stop services
docker-compose down

# Stop and remove volumes
docker-compose down -v

# Remove all containers and images
docker-compose down --rmi all -v
```

## 🚀 Production Deployment

### Build Production Images
```bash
# Build production frontend
docker build -f frontend/Dockerfile -t procure2pay-frontend ./frontend

# Build backend
docker build -f backend/Dockerfile -t procure2pay-backend ./backend
```

### Production Environment
For production, use:
- External PostgreSQL (Render, AWS RDS, etc.)
- External Redis (Redis Cloud, AWS ElastiCache, etc.)
- Environment-specific configurations

## 🔍 Troubleshooting

### Common Issues

1. **Port Already in Use**
   ```bash
   # Check what's using the port
   lsof -i :3000
   lsof -i :8000
   
   # Kill the process or change ports in docker-compose.yml
   ```

2. **Database Connection Issues**
   ```bash
   # Check if PostgreSQL is running
   docker-compose ps
   
   # View database logs
   docker-compose logs postgres
   ```

3. **Frontend Build Issues**
   ```bash
   # Clear node_modules and rebuild
   docker-compose down
   docker-compose build --no-cache frontend
   docker-compose up
   ```

4. **Backend Migration Issues**
   ```bash
   # Run migrations manually
   docker-compose exec backend python manage.py migrate
   
   # Create demo users
   docker-compose exec backend python create_demo_users.py
   ```

### Health Checks
All services include health checks:
- **Backend**: `curl http://localhost:8000/health/`
- **Frontend**: `curl http://localhost:3000`
- **PostgreSQL**: `pg_isready`
- **Redis**: `redis-cli ping`

## 📦 Docker Images

### Base Images Used
- **Backend**: `python:3.11-slim`
- **Frontend Dev**: `node:18-alpine`
- **Frontend Prod**: `nginx:alpine`
- **PostgreSQL**: `postgres:15-alpine`
- **Redis**: `redis:7-alpine`

### Image Sizes (Approximate)
- Backend: ~500MB
- Frontend (dev): ~200MB
- Frontend (prod): ~50MB
- PostgreSQL: ~80MB
- Redis: ~30MB

## 🔐 Security Notes

- Change default passwords in production
- Use environment variables for sensitive data
- Enable SSL/TLS in production
- Configure proper firewall rules
- Regular security updates

## 📚 Additional Resources

- [Docker Documentation](https://docs.docker.com/)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [Main README](README.md)
- [Deployment Guide](DEPLOYMENT.md)