# 🐳 Docker Deployment Guide

## Quick Start

### Development Environment
```bash
# Validate configuration
python3 VALIDATE_BUILD.py

# Build and run
docker-compose up --build

# Access services
# Backend: http://localhost:8000
# Frontend: http://localhost:3000
# Swagger: http://localhost:8000/swagger/
```

### Production Environment
```bash
# Build production images
docker-compose -f docker-compose.prod.yml up --build -d

# Access via nginx
# Full stack: http://localhost
```

## Docker Architecture

### Services Overview
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │    Backend      │    │   Database      │
│   (React)       │    │   (Django)      │    │ (PostgreSQL)    │
│   Port: 3000    │    │   Port: 8000    │    │   Port: 5432    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
                    ┌─────────────────┐
                    │     Redis       │
                    │   (Cache)       │
                    │   Port: 6379    │
                    └─────────────────┘
```

### Production with Nginx
```
┌─────────────────┐
│     Nginx       │  ← Entry point (Port 80)
│  Load Balancer  │
└─────────────────┘
         │
    ┌────┴────┐
    │         │
┌───▼───┐ ┌──▼────┐
│Frontend│ │Backend│
│(Static)│ │ (API) │
└────────┘ └───────┘
```

## File Structure

### Development Files
- `docker-compose.yml` - Development environment
- `backend/Dockerfile` - Backend container
- `frontend/Dockerfile.dev` - Frontend development

### Production Files
- `docker-compose.prod.yml` - Production environment
- `frontend/Dockerfile` - Frontend production (multi-stage)
- `nginx.conf` - Load balancer configuration

## Environment Variables

### Backend (.env)
```env
SECRET_KEY=django-insecure-_dbg@2u6fv$(n3slh^if%6j1c@52f7a^g@0b74mhrko!_6tmlu
DEBUG=True
DB_NAME=procure_to_pay
DB_USER=postgres
DB_PASSWORD=2001
DB_HOST=db  # Docker service name
DB_PORT=5432
REDIS_URL=redis://redis:6379
ALLOWED_HOSTS=localhost,127.0.0.1,backend
CORS_ALLOWED_ORIGINS=http://localhost:3000
```

### Production Overrides
```env
DEBUG=False
ALLOWED_HOSTS=localhost,nginx,your-domain.com
DJANGO_SETTINGS_MODULE=procure_to_pay.settings.production
```

## Build Process

### Backend Build Steps
1. **Base Image**: Python 3.11 slim
2. **System Dependencies**: tesseract, poppler, postgresql
3. **Python Dependencies**: From requirements.txt
4. **Application Code**: Copy source
5. **Static Directories**: Create media/staticfiles
6. **Health Check**: Curl endpoint

### Frontend Build Steps (Production)
1. **Build Stage**: Node.js 18 alpine
2. **Dependencies**: npm ci --only=production
3. **Build**: npm run build (TypeScript + Vite)
4. **Serve Stage**: Nginx alpine
5. **Static Files**: Copy build output
6. **Configuration**: Custom nginx config

## Testing & Validation

### Pre-build Validation
```bash
# Check all configurations
python3 VALIDATE_BUILD.py

# Test individual builds
./DOCKER_BUILD_TEST.sh
```

### Integration Testing
```bash
# Full stack test
./TEST_DOCKER.sh

# Manual testing
docker-compose up -d
curl http://localhost:8000/health/
curl http://localhost:3000
```

## Troubleshooting

### Common Issues

**Build Failures**
```bash
# Clean build
docker-compose build --no-cache

# Check logs
docker-compose logs backend
docker-compose logs frontend
```

**Database Connection**
```bash
# Check database
docker-compose exec db psql -U postgres -d procure_to_pay

# Reset database
docker-compose down -v
docker-compose up -d db
```

**Permission Issues**
```bash
# Fix file permissions
sudo chown -R $USER:$USER .
chmod +x *.sh
```

### Health Checks

**Backend Health**
```bash
curl http://localhost:8000/health/
# Expected: {"status": "healthy", "service": "Procure-to-Pay Backend", "version": "1.0.0"}
```

**Database Health**
```bash
docker-compose exec db pg_isready -U postgres
# Expected: /var/run/postgresql:5432 - accepting connections
```

**Redis Health**
```bash
docker-compose exec redis redis-cli ping
# Expected: PONG
```

## Performance Optimization

### Production Settings
- **Gunicorn**: 2 workers for backend
- **Nginx**: Gzip compression enabled
- **Static Files**: Cached for 1 year
- **Database**: Connection pooling
- **Redis**: Session and cache storage

### Resource Limits
```yaml
# Add to docker-compose.prod.yml
deploy:
  resources:
    limits:
      memory: 512M
      cpus: '0.5'
```

## Security

### Production Security
- **HTTPS**: Use reverse proxy (Cloudflare/nginx)
- **Secrets**: Use Docker secrets or env files
- **Database**: Internal network only
- **CORS**: Restrict to specific domains
- **Headers**: Security headers via nginx

### Environment Isolation
```bash
# Development
docker-compose up

# Staging
docker-compose -f docker-compose.staging.yml up

# Production
docker-compose -f docker-compose.prod.yml up
```

## Deployment Checklist

### Pre-deployment
- [ ] Run `python3 VALIDATE_BUILD.py`
- [ ] Test with `./DOCKER_BUILD_TEST.sh`
- [ ] Update environment variables
- [ ] Check database migrations
- [ ] Verify static files

### Deployment
- [ ] Build images: `docker-compose build`
- [ ] Run migrations: `docker-compose exec backend python manage.py migrate`
- [ ] Collect static: `docker-compose exec backend python manage.py collectstatic`
- [ ] Create users: `docker-compose exec backend python manage.py create_demo_users`
- [ ] Test endpoints: `curl http://localhost/health/`

### Post-deployment
- [ ] Monitor logs: `docker-compose logs -f`
- [ ] Test API endpoints
- [ ] Verify frontend functionality
- [ ] Check database connectivity
- [ ] Monitor resource usage

---
**Docker Version**: 20.10+  
**Docker Compose Version**: 2.0+  
**Last Updated**: November 21, 2025