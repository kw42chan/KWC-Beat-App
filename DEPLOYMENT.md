# Deployment Guide - KWC Beat App

This guide covers deploying the frontend to various platforms and options for backend hosting.

## Table of Contents
1. [Frontend Deployment Options](#frontend-deployment-options)
   - [Vercel (Recommended)](#vercel-recommended)
   - [GitHub Pages](#github-pages)
2. [Backend Deployment Options](#backend-deployment-options)
3. [Full Stack Deployment](#full-stack-deployment)

---

## Frontend Deployment Options

### Vercel (Recommended) ⭐

**Best for:** Production apps, automatic deployments, easy environment variable management

**Quick Start:**
1. Push code to GitHub
2. Import project in Vercel dashboard
3. Set environment variables (see [VERCEL_DEPLOYMENT.md](./VERCEL_DEPLOYMENT.md))
4. Deploy!

**📖 Full Guide:** See [VERCEL_DEPLOYMENT.md](./VERCEL_DEPLOYMENT.md) for complete instructions.

**Key Features:**
- ✅ Free hosting with HTTPS
- ✅ Automatic deployments on git push
- ✅ Easy environment variable configuration
- ✅ Global CDN
- ✅ Preview deployments for pull requests

### GitHub Pages

---

## Frontend Deployment (GitHub Pages)

GitHub Pages is free and perfect for hosting static React apps. The app will work standalone using browser storage (IndexedDB/localStorage) even without a backend.

### Step 1: Prepare Repository

1. **Create a GitHub repository:**
   ```bash
   # If you haven't already, initialize git
   git init
   
   # Add all files
   git add .
   
   # Commit
   git commit -m "Initial commit"
   
   # Create repository on GitHub, then:
   git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
   git branch -M main
   git push -u origin main
   ```

2. **Update Vite config for GitHub Pages:**
   The `vite.config.ts` has been updated with `base: '/YOUR_REPO_NAME/'` - update it with your actual repo name.

### Step 2: Build the App

1. **Set up environment variables:**
   ```bash
   # Copy .env.example to .env if you haven't
   cp .env.example .env
   ```
   
   **Important:** For GitHub Pages, you can either:
   - **Option A:** Set `VITE_API_URL` to your backend URL (if you deploy backend separately)
   - **Option B:** Leave it empty - app will use browser storage (IndexedDB/localStorage)

2. **Build for production:**
   ```bash
   npm run build
   ```
   
   This creates a `dist/` folder with optimized production files.

### Step 3: Deploy to GitHub Pages

#### Option A: Manual Deployment

1. **Enable GitHub Pages:**
   - Go to your repository on GitHub
   - Click **Settings** → **Pages**
   - Under **Source**, select **GitHub Actions** (recommended) or **Deploy from a branch**
   - If using branch: Select `main` branch and `/dist` folder
   - Click **Save**

2. **Push dist folder:**
   ```bash
   # Build the app
   npm run build
   
   # Add dist to git (temporarily)
   git add dist
   git commit -m "Add dist for deployment"
   git push
   ```

#### Option B: Automatic Deployment (GitHub Actions) - Recommended

1. **Create GitHub Actions workflow:**
   A workflow file has been created at `.github/workflows/deploy.yml`
   
2. **Update repository name:**
   Edit `.github/workflows/deploy.yml` and replace `YOUR_USERNAME/YOUR_REPO_NAME` with your actual repository path.

3. **Push to GitHub:**
   ```bash
   git add .github
   git commit -m "Add GitHub Actions deployment"
   git push
   ```

4. **Automatic deployment:**
   - Every push to `main` branch will automatically build and deploy
   - Check **Actions** tab in GitHub to see deployment status
   - Your app will be live at: `https://YOUR_USERNAME.github.io/YOUR_REPO_NAME/`

### Step 4: Verify Deployment

1. Visit your GitHub Pages URL: `https://YOUR_USERNAME.github.io/YOUR_REPO_NAME/`
2. Check browser console for any errors
3. Test zone loading and map functionality

---

## Backend Deployment Options

The backend server needs separate hosting since GitHub Pages only serves static files.

### Option 1: Render.com (Free Tier Available)

1. **Create account:** https://render.com
2. **Create new Web Service:**
   - Connect your GitHub repository
   - Select the `server` folder as root directory
   - Build command: `cd server && npm install`
   - Start command: `cd server && npm start`
   - Environment: Node
3. **Set environment variables:**
   - `PORT` (usually auto-set by Render)
   - Add any other needed variables
4. **Deploy:**
   - Render will auto-deploy on every push
   - Get your backend URL (e.g., `https://your-app.onrender.com`)

5. **Update frontend:**
   - Update `VITE_API_URL` in `.env` to your Render backend URL
   - Rebuild and redeploy frontend

### Option 2: Railway.app (Free Trial)

1. **Create account:** https://railway.app
2. **New Project** → **Deploy from GitHub repo**
3. **Select server folder** and configure:
   - Build: `npm install`
   - Start: `npm start`
4. **Get backend URL** and update frontend

### Option 3: Heroku (Paid, but has free alternatives)

1. **Create account:** https://heroku.com
2. **Install Heroku CLI**
3. **Deploy:**
   ```bash
   cd server
   heroku create your-app-name
   git subtree push --prefix server heroku main
   ```

### Option 4: Vercel (Serverless Functions)

You can convert the Express server to Vercel serverless functions. More complex but free.

### Option 5: Keep Backend Local (Development Only)

For development/testing, you can run the backend locally and set `VITE_API_URL=http://localhost:3001` in your `.env` file.

---

## Full Stack Deployment

### Recommended Setup:

1. **Frontend:** GitHub Pages (free, automatic)
2. **Backend:** Render.com or Railway.app (free tier available)
3. **Database:** File-based (included with backend) or upgrade to MongoDB/PostgreSQL if needed

### Step-by-Step:

1. **Deploy Backend First:**
   - Choose a hosting provider (Render.com recommended)
   - Deploy the `server/` folder
   - Note the backend URL

2. **Update Frontend Environment:**
   ```bash
   # Update .env file
   VITE_API_URL=https://your-backend.onrender.com
   ```

3. **Rebuild Frontend:**
   ```bash
   npm run build
   ```

4. **Deploy Frontend:**
   - Push to GitHub (GitHub Actions will auto-deploy)
   - Or manually push `dist/` folder

5. **Test:**
   - Visit your GitHub Pages URL
   - Verify zones load from backend
   - Test creating/editing zones

---

## Environment Variables

### Frontend (.env)
```env
VITE_GOOGLE_MAPS_API_KEY=your_google_maps_api_key
VITE_API_URL=https://your-backend-url.com  # Optional - leave empty for browser-only mode
```

### Backend (Set in hosting provider)
```env
PORT=3001  # Usually auto-set
NODE_ENV=production
```

---

## Troubleshooting

### Frontend Issues:

**Problem:** Blank page or 404 errors
- **Solution:** Check `base` path in `vite.config.ts` matches your repo name
- **Solution:** Ensure `dist/` folder is deployed correctly

**Problem:** Map doesn't load
- **Solution:** Verify Google Maps API key is set correctly
- **Solution:** Check API key restrictions in Google Cloud Console

**Problem:** Zones don't load
- **Solution:** If using backend, verify `VITE_API_URL` is correct
- **Solution:** Check browser console for CORS errors
- **Solution:** Verify backend is running and accessible

### Backend Issues:

**Problem:** Backend won't start
- **Solution:** Check Node.js version (needs >= 18)
- **Solution:** Verify `server/package.json` has correct dependencies
- **Solution:** Check hosting provider logs

**Problem:** CORS errors
- **Solution:** Backend already has CORS enabled, but verify frontend URL is allowed
- **Solution:** Check hosting provider firewall settings

---

## Security Notes

1. **Never commit `.env` files** - They're in `.gitignore`
2. **Google Maps API Key:** Set restrictions in Google Cloud Console:
   - HTTP referrer restrictions for frontend
   - IP restrictions for backend (if possible)
3. **Backend:** Consider adding authentication if storing sensitive data
4. **Rate Limiting:** Consider adding rate limiting to backend API

---

## Quick Reference

### Build Commands:
```bash
# Frontend
npm run build          # Build for production
npm run preview        # Preview production build locally

# Backend
cd server
npm start              # Start production server
npm run dev            # Start development server with watch
```

### Deployment URLs:
- **Frontend:** `https://YOUR_USERNAME.github.io/YOUR_REPO_NAME/`
- **Backend:** `https://your-backend.onrender.com` (or your hosting provider URL)

---

## Next Steps

1. ✅ Deploy frontend to GitHub Pages
2. ✅ (Optional) Deploy backend to Render.com or similar
3. ✅ Update frontend with backend URL
4. ✅ Test full functionality
5. ✅ Share your app URL!

For questions or issues, check the GitHub repository issues or documentation.
