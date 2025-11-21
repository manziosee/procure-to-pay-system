# 🚀 Deploy Backend to Fly.io

## Prerequisites
1. Install Fly CLI: `curl -L https://fly.io/install.sh | sh`
2. Login to Fly.io: `fly auth login`

## Deployment Steps

### 1. Navigate to Backend Directory
```bash
cd backend
```

### 2. Set Required Secrets
```bash
fly secrets set SECRET_KEY='django-insecure-_dbg@2u6fv$\(n3slh^if%6j1c@52f7a^g@0b74mhrko!_6tmlu' --app procure-to-pay-backend
fly secrets set DEBUG=False --app procure-to-pay-backend
fly secrets set ALLOWED_HOSTS="procure-to-pay-backend.fly.dev,localhost" --app procure-to-pay-backend
```

### 3. Deploy Application
```bash
fly deploy --app procure-to-pay-backend
```

### 4. Check Status
```bash
fly status --app procure-to-pay-backend
fly logs --app procure-to-pay-backend
```

## Verify Deployment

### Test Endpoints:
- **Health Check**: https://procure-to-pay-backend.fly.dev/health/
- **API Root**: https://procure-to-pay-backend.fly.dev/
- **Swagger Docs**: https://procure-to-pay-backend.fly.dev/swagger/
- **Login Test**: 
  ```bash
  curl -X POST https://procure-to-pay-backend.fly.dev/api/auth/login/ \
    -H "Content-Type: application/json" \
    -d '{"username": "staff1", "password": "password123"}'
  ```

## Configuration Files Ready:
- ✅ `fly.toml` - Updated with fixes
- ✅ `Dockerfile` - Production ready
- ✅ `.env` - Local development
- ✅ `settings/production.py` - Production settings

## Troubleshooting:
- Check logs: `fly logs --app procure-to-pay-backend`
- SSH into machine: `fly ssh console --app procure-to-pay-backend`
- Restart app: `fly restart --app procure-to-pay-backend`