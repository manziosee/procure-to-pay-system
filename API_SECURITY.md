# 🔐 API Key Security Guide

## ⚠️ CRITICAL: Never Commit API Keys

### ✅ Secure Practices

1. **Environment Variables Only**
   ```bash
   # ✅ Good - Use placeholders in committed files
   OPENAI_API_KEY=<your-openai-api-key>
   
   # ❌ Bad - Never commit actual keys
   OPENAI_API_KEY=sk-proj-actual-key-here
   ```

2. **Files to Keep Secure**
   - `.env` - Local development (in .gitignore)
   - `backend/.env.*` - All environment files
   - Any file containing `sk-` prefixed keys

3. **Production Deployment**
   ```bash
   # Use Fly.io secrets (already configured)
   fly secrets set OPENAI_API_KEY=<your-actual-key>
   ```

### 🛡️ Current Security Status

- ✅ All `.env*` files in `.gitignore`
- ✅ API key placeholders in committed files
- ✅ Production keys stored in Fly.io secrets
- ✅ No actual keys in repository

### 🔄 Key Rotation

If a key is compromised:
1. Generate new key at https://platform.openai.com/api-keys
2. Update Fly.io secret: `fly secrets set OPENAI_API_KEY=<new-key>`
3. Update local `.env` file
4. Revoke old key in OpenAI dashboard

### 📋 Pre-Commit Checklist

Before pushing code:
- [ ] No `sk-` strings in committed files
- [ ] `.env` files not staged for commit
- [ ] Only placeholders like `<your-api-key>` in code
- [ ] Secrets stored securely in deployment platform