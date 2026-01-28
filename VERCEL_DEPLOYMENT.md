# Deploy to Vercel - Complete Guide

## Overview

Vercel is an excellent platform for deploying React/Vite applications. It provides:
- ✅ Free hosting with automatic HTTPS
- ✅ Automatic deployments on git push
- ✅ Built-in CI/CD
- ✅ Easy environment variable management
- ✅ Global CDN for fast loading

## Prerequisites

1. **Vercel account** - Sign up at https://vercel.com (free)
2. **GitHub repository** - Your code should be on GitHub
3. **Google Maps API key** - Get from Google Cloud Console

---

## Step-by-Step Deployment

### Step 1: Prepare Your Code

#### Update `vite.config.ts` for Vercel

Vercel serves from root, so update the base path:

```typescript
// vite.config.ts
export default defineConfig({
  plugins: [react()],
  // Change this line - use '/' for Vercel (not '/KWC-Beat-App/')
  base: '/',  // Vercel serves from root
  // ... rest of config
})
```

**Or** make it environment-aware:

```typescript
base: process.env.VERCEL ? '/' : '/KWC-Beat-App/',
```

### Step 2: Push Code to GitHub

```bash
git add .
git commit -m "Prepare for Vercel deployment"
git push origin main
```

---

## Step 3: Deploy to Vercel

### Option A: Deploy via Vercel Dashboard (Recommended)

1. **Go to Vercel Dashboard:**
   - Visit https://vercel.com/dashboard
   - Click **"Add New..."** → **"Project"**

2. **Import Git Repository:**
   - Connect your GitHub account if not already connected
   - Select your repository (`KWC-Beat-App` or your repo name)
   - Click **"Import"**

3. **Configure Project:**
   - **Framework Preset:** Vite (should auto-detect)
   - **Root Directory:** `./` (leave as default)
   - **Build Command:** `npm run build` (auto-detected)
   - **Output Directory:** `dist` (auto-detected)
   - **Install Command:** `npm install` (auto-detected)

4. **Set Environment Variables:**
   This is the **CRITICAL STEP** for your Google Maps API key!
   
   **Before clicking "Deploy", click "Environment Variables" and add:**
   
   | Name | Value | Environment |
   |------|-------|-------------|
   | `VITE_GOOGLE_MAPS_API_KEY` | `your_actual_api_key_here` | Production, Preview, Development |
   | `VITE_API_URL` | `your_backend_url` (optional) | Production, Preview, Development |
   
   **How to add:**
   - Click **"Add"** button
   - **Name:** `VITE_GOOGLE_MAPS_API_KEY`
   - **Value:** Paste your Google Maps API key (e.g., `AIzaSyD002M_dIz-4VxmkT1dmS2lTLcWgdqziuE`)
   - **Environment:** Select all (Production, Preview, Development)
   - Click **"Save"**
   - Repeat for `VITE_API_URL` if you have a backend

5. **Deploy:**
   - Click **"Deploy"** button
   - Wait for build to complete (usually 1-2 minutes)
   - Your app will be live at `https://your-project-name.vercel.app`

### Option B: Deploy via Vercel CLI

1. **Install Vercel CLI:**
   ```bash
   npm i -g vercel
   ```

2. **Login:**
   ```bash
   vercel login
   ```

3. **Deploy:**
   ```bash
   vercel
   ```
   
   Follow the prompts:
   - Link to existing project or create new
   - Set environment variables when prompted
   - Deploy

---

## Step 4: Configure Environment Variables in Vercel Dashboard

**IMPORTANT:** Even if you set them during initial deployment, you can always update them:

1. **Go to Project Settings:**
   - Open your project in Vercel dashboard
   - Click **"Settings"** tab
   - Click **"Environment Variables"** in left sidebar

2. **Add/Edit Variables:**
   - Click **"Add New"**
   - **Name:** `VITE_GOOGLE_MAPS_API_KEY`
   - **Value:** Your Google Maps API key
   - **Environment:** Select all (Production, Preview, Development)
   - Click **"Save"**

3. **Redeploy After Changes:**
   - After adding/updating environment variables, you need to redeploy
   - Go to **"Deployments"** tab
   - Click **"..."** (three dots) on latest deployment
   - Click **"Redeploy"**

---

## Environment Variables Reference

### Required Variables

| Variable Name | Description | Example Value |
|---------------|-------------|---------------|
| `VITE_GOOGLE_MAPS_API_KEY` | Google Maps JavaScript API key | `AIzaSyD002M_dIz-4VxmkT1dmS2lTLcWgdqziuE` |

### Optional Variables

| Variable Name | Description | Example Value |
|---------------|-------------|---------------|
| `VITE_API_URL` | Backend API URL (if using backend) | `https://your-backend.vercel.app` or `https://your-backend.onrender.com` |

### Important Notes:

- ✅ **Prefix with `VITE_`:** Vite only exposes variables prefixed with `VITE_` to the client
- ✅ **Case Sensitive:** Variable names are case-sensitive
- ✅ **No Quotes:** Don't wrap values in quotes when setting in Vercel
- ✅ **Redeploy Required:** Changes to environment variables require a new deployment

---

## Step 5: Verify Deployment

1. **Check Build Logs:**
   - Go to **"Deployments"** tab
   - Click on your deployment
   - Check **"Build Logs"** for any errors

2. **Test Your App:**
   - Visit your Vercel URL: `https://your-project.vercel.app`
   - Check browser console (F12) for errors
   - Verify map loads correctly
   - Test zone functionality

3. **Common Issues:**
   - **Map not loading:** Check if `VITE_GOOGLE_MAPS_API_KEY` is set correctly
   - **404 errors:** Check `base` path in `vite.config.ts` (should be `/` for Vercel)
   - **Build fails:** Check build logs for specific errors

---

## Advanced Configuration

### Custom Domain

1. Go to **Settings** → **Domains**
2. Add your custom domain
3. Follow DNS configuration instructions
4. Vercel will automatically provision SSL certificate

### Environment-Specific Variables

You can set different values for different environments:

- **Production:** Live site (your-project.vercel.app)
- **Preview:** Pull request previews
- **Development:** Local development (when using `vercel dev`)

Set variables for specific environments in the Environment Variables settings.

### Automatic Deployments

Vercel automatically deploys:
- **Production:** Every push to `main` branch
- **Preview:** Every pull request

You can configure this in **Settings** → **Git**.

---

## Deploying Backend to Vercel (Optional)

If you want to deploy your Express backend to Vercel as serverless functions:

### Option 1: Convert to Vercel Serverless Functions

1. Create `api/` folder in project root
2. Convert Express routes to serverless functions
3. Update `vercel.json` configuration

### Option 2: Deploy Backend Separately

Recommended: Deploy backend to:
- **Render.com** (free tier)
- **Railway.app** (free trial)
- **Heroku** (paid)

Then set `VITE_API_URL` in Vercel to point to your backend.

---

## Troubleshooting

### Problem: Map Not Loading

**Solution:**
1. Verify `VITE_GOOGLE_MAPS_API_KEY` is set in Vercel
2. Check Google Cloud Console:
   - API key restrictions allow your Vercel domain
   - Maps JavaScript API is enabled
3. Check browser console for API key errors
4. Redeploy after setting environment variables

### Problem: Build Fails

**Solution:**
1. Check build logs in Vercel dashboard
2. Verify `package.json` has correct build script
3. Ensure Node.js version is compatible (>=18)
4. Check for TypeScript errors: `npm run build` locally

### Problem: 404 Errors on Routes

**Solution:**
1. Update `vite.config.ts` base path to `/`
2. If using React Router, configure for SPA routing
3. Check Vercel rewrites in `vercel.json` if needed

### Problem: Environment Variables Not Working

**Solution:**
1. Ensure variable name starts with `VITE_`
2. Redeploy after adding variables
3. Check variable is set for correct environment (Production/Preview/Development)
4. Verify no typos in variable name

---

## Quick Reference

### Vercel Dashboard URLs:
- **Projects:** https://vercel.com/dashboard
- **Project Settings:** https://vercel.com/[username]/[project]/settings
- **Environment Variables:** Settings → Environment Variables
- **Deployments:** https://vercel.com/[username]/[project]/deployments

### Useful Commands:
```bash
# Deploy to production
vercel --prod

# Deploy preview
vercel

# View logs
vercel logs

# Link local project
vercel link
```

---

## Security Best Practices

1. ✅ **Never commit `.env` file** - Already in `.gitignore`
2. ✅ **Use Vercel Environment Variables** - Secure and encrypted
3. ✅ **Restrict API Keys** - Set HTTP referrer restrictions in Google Cloud Console
4. ✅ **Rotate Keys** - If accidentally exposed, revoke and create new key
5. ✅ **Use Different Keys** - Use separate keys for development and production

---

## Next Steps

1. ✅ Deploy frontend to Vercel
2. ✅ Set environment variables
3. ✅ Test your app
4. ✅ (Optional) Deploy backend separately
5. ✅ (Optional) Set up custom domain

Your app is now live on Vercel! 🎉

---

## Support

- **Vercel Docs:** https://vercel.com/docs
- **Vite Deployment:** https://vitejs.dev/guide/static-deploy.html#vercel
- **Environment Variables:** https://vercel.com/docs/concepts/projects/environment-variables
