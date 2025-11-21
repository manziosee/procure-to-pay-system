# 🚨 Quick Fix for Fly.io Deployment

## The Issue
Release v6 failed because of complex release command. Here's the fix:

## Quick Fix Steps

### 1. Use Simplified Configuration
```bash
cd backend
cp fly-simple.toml fly.toml
```

### 2. Set Essential Secrets Only
```bash
fly secrets set SECRET_KEY='django-insecure-_dbg@2u6fv$\(n3slh^if%6j1c@52f7a^g@0b74mhrko!_6tmlu' --app procure-to-pay-backend
fly secrets set DEBUG=False --app procure-to-pay-backend
```

### 3. Deploy with Minimal Config
```bash
fly deploy --app procure-to-pay-backend
```

### 4. Create Demo Users After Deployment
```bash
fly ssh console --app procure-to-pay-backend
# Inside the machine:
python manage.py create_demo_users
python manage.py collectstatic --noinput
exit
```

## Alternative: Reset and Redeploy

If still failing:
```bash
# Destroy and recreate
fly apps destroy procure-to-pay-backend
fly launch --name procure-to-pay-backend --region iad
```

## Test After Deployment
```bash
curl https://procure-to-pay-backend.fly.dev/health/
curl https://procure-to-pay-backend.fly.dev/
```

## Key Changes Made:
- ✅ Simplified release command (only migrate)
- ✅ Moved collectstatic and demo users to post-deployment
- ✅ Increased health check timeouts
- ✅ Simplified process configuration