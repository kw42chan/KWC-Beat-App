# Quick Deployment Guide

## 🚀 Deploy to GitHub Pages in 5 Steps

### Step 1: Create GitHub Repository
1. Go to https://github.com/new
2. Create a new repository (e.g., `kwc-beat-app`)
3. **Don't** initialize with README (if you already have code)

### Step 2: Push Your Code
```bash
# If you haven't initialized git yet
git init
git add .
git commit -m "Initial commit"

# Add your GitHub repository
git remote add origin https://github.com/YOUR_USERNAME/kwc-beat-app.git
git branch -M main
git push -u origin main
```

### Step 3: Update Repository Name in Config
Edit `vite.config.ts` and change:
```typescript
base: process.env.NODE_ENV === 'production' ? '/YOUR_REPO_NAME/' : '/',
```
Replace `YOUR_REPO_NAME` with your actual repository name.

### Step 4: Set GitHub Secrets (For API Keys)
1. Go to your repository → **Settings** → **Secrets and variables** → **Actions**
2. Click **New repository secret**
3. Add:
   - Name: `VITE_GOOGLE_MAPS_API_KEY`
   - Value: Your Google Maps API key
4. (Optional) Add backend URL:
   - Name: `VITE_API_URL`
   - Value: Your backend URL (if deploying backend separately)

### Step 5: Enable GitHub Pages
1. Go to **Settings** → **Pages**
2. Under **Source**, select **GitHub Actions**
3. Save

### ✅ Done!
- Every push to `main` branch will automatically deploy
- Your app will be live at: `https://YOUR_USERNAME.github.io/YOUR_REPO_NAME/`
- Check deployment status in **Actions** tab

---

## 📝 Notes

- **No Backend?** The app works standalone using browser storage (IndexedDB/localStorage)
- **Need Backend?** See `DEPLOYMENT.md` for backend hosting options
- **Custom Domain?** Update `base: '/'` in `vite.config.ts` and configure in GitHub Pages settings

---

## 🔧 Troubleshooting

**404 Errors?**
- Check `base` path in `vite.config.ts` matches your repo name
- Ensure GitHub Actions workflow completed successfully

**Map Not Loading?**
- Verify `VITE_GOOGLE_MAPS_API_KEY` secret is set correctly
- Check Google Cloud Console for API key restrictions

**Need Help?**
- See full guide: `DEPLOYMENT.md`
- Check GitHub Actions logs in **Actions** tab
