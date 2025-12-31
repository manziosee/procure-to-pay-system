# 🔒 Security Guidelines

## 🚨 **NEVER COMMIT SECRETS TO GIT**

### ❌ **What NOT to commit:**
- API Keys (OpenAI, AWS, etc.)
- Database passwords
- Secret keys
- Authentication tokens
- Private keys

### ✅ **How to handle secrets:**

1. **Use Environment Variables**
   ```bash
   # Set in your environment
   export OPENAI_API_KEY=sk-your-actual-key
   ```

2. **Use .env files (NOT committed)**
   ```bash
   # .env (add to .gitignore)
   OPENAI_API_KEY=sk-your-actual-key
   ```

3. **Use deployment platform secrets**
   - Render: Environment Variables
   - Vercel: Environment Variables
   - Docker: Build secrets

### 🔧 **If you accidentally commit secrets:**

1. **Immediately revoke the exposed secret**
2. **Generate a new secret**
3. **Remove from git history:**
   ```bash
   git filter-branch --force --index-filter \
   'git rm --cached --ignore-unmatch path/to/file' \
   --prune-empty --tag-name-filter cat -- --all
   ```
4. **Force push to remote**
5. **Update deployment with new secret**

### 📋 **Security Checklist:**
- [ ] All .env files in .gitignore
- [ ] No hardcoded secrets in code
- [ ] Secrets set in deployment platform
- [ ] Regular secret rotation
- [ ] Monitor for exposed secrets

### 🛡️ **Best Practices:**
- Use placeholder values in example files
- Document secret requirements in README
- Use secret management tools in production
- Regular security audits