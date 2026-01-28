# Troubleshooting: Frontend Cannot See Zones

## Current Status ✅

- ✅ Backend is running on port 3001
- ✅ Backend has 54 zones available
- ✅ `.env` file configured with `VITE_API_URL=http://localhost:3001`

## Common Issues & Solutions

### Issue 1: Frontend Not Restarted After .env Changes

**Problem:** Vite caches environment variables. If you changed `.env` after starting the frontend, it won't pick up the changes.

**Solution:**
1. Stop the frontend server (Ctrl+C)
2. Restart it: `npm run dev`
3. Hard refresh the browser (Ctrl+Shift+R or Ctrl+F5)

### Issue 2: Check Browser Console

**Steps:**
1. Open browser Developer Tools (F12)
2. Go to Console tab
3. Look for messages starting with `[ZoneStorage]`
4. Check for any red error messages

**Expected messages:**
```
[ZoneStorage] Loading zones from server: http://localhost:3001/api/zones/default
[ZoneStorage] Server response: {success: true, zones: Array(54)}
[ZoneStorage] Loaded 54 zones from server
```

**If you see errors:**
- `Failed to fetch` → Backend is not running or CORS issue
- `API URL not configured` → Frontend didn't pick up .env file (restart frontend)
- `HTTP 404` → Profile doesn't exist (should auto-create)

### Issue 3: Verify Backend is Accessible

**Test in browser:**
1. Open: `http://localhost:3001/api/zones/default`
2. Should see JSON with zones array
3. If you see the map instead → Wrong server (frontend is on port 3001)

**Test in PowerShell:**
```powershell
Invoke-WebRequest -Uri "http://localhost:3001/api/zones/default" -UseBasicParsing | Select-Object -ExpandProperty Content
```

### Issue 4: Profile ID Mismatch

**Check:**
1. Open browser console
2. Type: `localStorage.getItem('current-profile-id')`
3. Should return: `"default"` or `null` (defaults to "default")

**If different:**
- The frontend might be using a different profile ID
- Check ProfileSelector component to see which profile is selected

### Issue 5: CORS Issues

**Symptoms:**
- Browser console shows CORS errors
- Network tab shows OPTIONS request failing

**Solution:**
- Backend already has CORS enabled
- Make sure backend is running on port 3001
- Make sure frontend is on port 3000 (different port)

## Quick Fix Steps

1. **Restart both servers:**
   ```bash
   # Terminal 1 - Backend
   cd server
   npm start
   
   # Terminal 2 - Frontend  
   npm run dev
   ```

2. **Clear browser cache:**
   - Hard refresh: Ctrl+Shift+R
   - Or clear browser cache completely

3. **Check browser console:**
   - Look for `[ZoneStorage]` messages
   - Check Network tab for API calls to `localhost:3001`

4. **Verify zones file:**
   ```powershell
   cd "c:\Development Projects\New folder\KWC-Beat-App"
   $zones = Get-Content "server\data\profile-default.json" | ConvertFrom-Json
   Write-Host "Zones in file: $($zones.Count)"
   ```

## Still Not Working?

1. Check browser Network tab:
   - Look for request to `http://localhost:3001/api/zones/default`
   - Check status code (should be 200)
   - Check response body (should have zones array)

2. Check browser console:
   - Look for any error messages
   - Check if `[ZoneStorage]` messages appear

3. Verify both servers are running:
   - Backend: `http://localhost:3001/api/health` should return JSON
   - Frontend: `http://localhost:3000` should show the map

4. Try accessing zones directly:
   - Open `http://localhost:3001/api/zones/default` in browser
   - Should see JSON with 54 zones
