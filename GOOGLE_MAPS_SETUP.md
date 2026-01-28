# Google Maps API Setup Guide

## Required API Services

You need to enable **TWO APIs** in Google Cloud Console:
1. **Maps JavaScript API** - For displaying the map
2. **Drawing Library** - For drawing polygons (included with Maps JavaScript API, but needs to be loaded)

## Step-by-Step Setup

### 1. Create or Select a Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click the project dropdown at the top
3. Either:
   - Select an existing project, OR
   - Click "New Project" to create one

### 2. Enable Maps JavaScript API

1. In the Google Cloud Console, go to **APIs & Services** → **Library**
2. Search for "Maps JavaScript API"
3. Click on **Maps JavaScript API**
4. Click the **Enable** button

### 3. Create API Key

1. Go to **APIs & Services** → **Credentials**
2. Click **+ CREATE CREDENTIALS** → **API key**
3. Your API key will be created
4. **Important**: Click **Restrict Key** to secure it

### 4. Restrict API Key (Recommended for Security)

1. Under **API restrictions**, select **Restrict key**
2. Check **Maps JavaScript API**
3. Under **Application restrictions**, choose one:
   - **HTTP referrers (web sites)** - Recommended for web apps
   - Add your domain(s), e.g.:
     - `localhost:3000/*` (for development)
     - `yourdomain.com/*` (for production)
     - `*.yourdomain.com/*` (for all subdomains)

### 5. Add API Key to Your App

**Important**: Never commit your API key to version control!

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

2. Open `.env` and add your API key:
   ```
   VITE_GOOGLE_MAPS_API_KEY=your_actual_api_key_here
   ```

3. The app will automatically use the key from the environment variable

**Note**: The `.env` file is already in `.gitignore` and won't be committed to GitHub.

## Optional: Enable Billing

**Note**: Google Maps requires a billing account, but they provide:
- **$200 free credit per month** (covers most small to medium usage)
- Free tier: 28,000 map loads per month

To enable billing:
1. Go to **Billing** in Google Cloud Console
2. Link a billing account (credit card required, but won't be charged unless you exceed free tier)

## API Usage Limits

- **Free tier**: 28,000 map loads per month
- After free tier: $7 per 1,000 additional loads
- Most small apps stay within the free tier

## Troubleshooting

### "This page can't load Google Maps correctly"
- Check that Maps JavaScript API is enabled
- Verify your API key is correct
- Check browser console for specific error messages
- Ensure billing is enabled (even if you won't be charged)

### "RefererNotAllowedMapError"
- Your API key restrictions are blocking the request
- Add your domain to HTTP referrer restrictions
- Or temporarily remove restrictions for testing (not recommended for production)

### "ApiNotActivatedMapError"
- Maps JavaScript API is not enabled
- Go back to step 2 and enable it

## Security Best Practices

1. **Always restrict your API key** to specific APIs and domains
2. **Don't commit API keys to version control** - use environment variables for production
3. **Monitor usage** in Google Cloud Console to detect unexpected usage
4. **Rotate keys** if they're accidentally exposed

## Environment Variables

The app uses environment variables for the API key (already configured):

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

2. Add your API key to `.env`:
   ```
   VITE_GOOGLE_MAPS_API_KEY=your_api_key_here
   ```

3. The `.env` file is automatically ignored by Git (already in `.gitignore`)

## Summary

**Required API**: Maps JavaScript API

**Quick Checklist**:
- ✅ Create/select Google Cloud project
- ✅ Enable Maps JavaScript API
- ✅ Create API key
- ✅ Restrict API key (recommended)
- ✅ Enable billing (required, but free tier available)
- ✅ Add API key to `src/components/MapScreen.tsx`
