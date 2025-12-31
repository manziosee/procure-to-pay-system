# Fly.io Deployment Guide

## Prerequisites
1. Install Fly.io CLI: `curl -L https://fly.io/install.sh | sh`
2. Create Fly.io account: `flyctl auth signup`
3. Login: `flyctl auth login`

## Quick Deploy
```bash
cd backend
chmod +x deploy-fly.sh
./deploy-fly.sh
```

## Manual Deployment Steps

### 1. Create App
```bash
flyctl apps create procure-to-pay-backend
```

### 2. Create PostgreSQL Database
```bash
flyctl postgres create --name procure-to-pay-db --region ord
flyctl postgres attach procure-to-pay-db --app procure-to-pay-backend
```

### 3. Set Environment Variables
```bash
flyctl secrets set \
  SECRET_KEY="django-insecure-fly-production-$(openssl rand -hex 32)" \
  DEBUG="False" \
  OPENAI_API_KEY="YOUR_OPENAI_API_KEY" \
  ALLOWED_HOSTS="procure-to-pay-backend.fly.dev,localhost" \
  CORS_ALLOWED_ORIGINS="http://localhost:3000" \
  --app procure-to-pay-backend
```

### 4. Deploy
```bash
flyctl deploy --app procure-to-pay-backend
```

### 5. Create Demo Users
```bash
flyctl ssh console --app procure-to-pay-backend -C "python manage.py create_demo_users"
```

## API Endpoints
- **Base URL**: https://procure-to-pay-backend.fly.dev
- **API Docs**: https://procure-to-pay-backend.fly.dev/api/docs/
- **Health Check**: https://procure-to-pay-backend.fly.dev/health/

## Demo Users
- **Staff**: staff1@example.com / password123
- **Approver L1**: approver1@example.com / password123  
- **Approver L2**: approver2@example.com / password123
- **Finance**: finance1@example.com / password123

## Update Frontend API URL
Update frontend `src/services/api.ts`:
```javascript
const API_URL = 'https://procure-to-pay-backend.fly.dev/api';
```