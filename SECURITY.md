# Security Best Practices

## API Key Security

**Never commit API keys to version control!**

### Current Setup

The app uses environment variables for sensitive data:

1. **API Key Storage**: The Google Maps API key is stored in `.env` file (not committed to Git)
2. **Example File**: `.env.example` is provided as a template (safe to commit)
3. **Git Ignore**: `.env` files are automatically excluded from version control

### How It Works

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

2. Add your API key to `.env`:
   ```
   VITE_GOOGLE_MAPS_API_KEY=your_actual_api_key_here
   ```

3. The app automatically reads from `.env` at runtime

### For Production Deployment

When deploying to production (e.g., Vercel, Netlify, etc.):

1. **Set environment variables** in your hosting platform's dashboard
2. **Never** hardcode API keys in your code
3. **Restrict** your API key in Google Cloud Console:
   - Limit to specific domains/IPs
   - Restrict to specific APIs (Maps JavaScript API only)

### If You Accidentally Committed an API Key

1. **Immediately rotate/regenerate** the API key in Google Cloud Console
2. **Remove** the key from Git history (if possible)
3. **Update** `.gitignore` to ensure `.env` is excluded
4. **Add** the new key to `.env` (not committed)

### Best Practices

✅ **DO**:
- Use environment variables for all API keys
- Keep `.env` in `.gitignore`
- Use `.env.example` as a template
- Restrict API keys in Google Cloud Console
- Rotate keys if exposed

❌ **DON'T**:
- Commit `.env` files
- Hardcode API keys in source code
- Share API keys in screenshots or documentation
- Use the same key for development and production
