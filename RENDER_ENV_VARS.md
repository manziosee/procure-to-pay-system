# 🔧 Render Environment Variables

## ⚠️ **URGENT: Add these to your Render dashboard**

Go to your service → Environment → Add Environment Variable:

```bash
DJANGO_SETTINGS_MODULE=procure_to_pay.settings.production
DEBUG=False
SECRET_KEY=[Click Generate]
ALLOWED_HOSTS=procure-to-pay-system-xnwp.onrender.com
DATABASE_URL=postgresql://postgres:67bC6ShcAyCknv?@db.jkxhrolkjbqmwntuarwf.supabase.co:5432/postgres?sslmode=require
CORS_ALLOWED_ORIGINS=https://procure-to-pay-system.vercel.app,http://localhost:3000
OPENAI_API_KEY=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
```

## 🚨 **Critical Issues Fixed:**
1. ✅ Removed drf-yasg import error
2. ⚠️ **You must add environment variables above**
3. ⚠️ **Change Render settings to use Python (not Docker)**

## 🔄 **After adding env vars:**
1. Go to Render dashboard
2. Click "Manual Deploy" 
3. Your app will be at: https://procure-to-pay-system-xnwp.onrender.com/api/docs/