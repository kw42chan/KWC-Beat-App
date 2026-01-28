# Fix: App Not Refreshing

## Step-by-Step Solution

### 1. Stop All Running Servers
- Press `Ctrl + C` in ALL terminal windows running `npm run dev`
- Make sure no Node processes are running

### 2. Clear Browser Cache Completely
**Option A: Hard Refresh**
- Press `Ctrl + Shift + Delete` (Windows) or `Cmd + Shift + Delete` (Mac)
- Select "Cached images and files"
- Click "Clear data"

**Option B: Use Incognito/Private Window**
- Open a new incognito/private window
- Go to `http://localhost:3000`

### 3. Restart Dev Server Fresh
```bash
cd "c:\Development Projects\New folder\KWC-Beat-App"
npm run dev
```

### 4. Wait for Server to Start
You should see:
```
VITE v5.x.x  ready in xxx ms
➜  Local:   http://localhost:3000/
```

### 5. Open Browser
- If it doesn't open automatically, manually go to `http://localhost:3000`
- Use a **fresh incognito window** if possible

### 6. Verify Changes Are Visible
Look for the **map style toggle buttons** (☀️ and 🌙) in the **top right corner** of the map, below the search bar.

## If Still Not Working

### Check Browser Console
1. Press `F12` to open DevTools
2. Go to Console tab
3. Look for any red errors
4. Check Network tab - make sure files are loading (status 200)

### Verify File Changes
1. Make a visible test change:
   - Open `src/components/MapScreen.tsx`
   - Change line 313 from `☀️` to `SUN`
   - Save the file
2. Check terminal - should show `[vite] hmr update` or `[vite] page reload`
3. Browser should update automatically

### Force Full Reload
If HMR isn't working:
1. Save any file
2. Manually refresh browser (`F5` or `Ctrl + R`)
3. Changes should appear

## Quick Test

To verify the map style toggle is working:

1. **Look for buttons**: You should see two buttons (☀️ and 🌙) in the top right
2. **Click the moon button**: Map should turn dark
3. **Click the sun button**: Map should turn light
4. **Check active state**: The active button should have a blue border

If you don't see the buttons at all, the code changes aren't being loaded. Try the steps above.
