# Troubleshooting - App Not Refreshing

## Quick Fixes

### 1. Hard Refresh Browser
- **Windows/Linux**: `Ctrl + Shift + R` or `Ctrl + F5`
- **Mac**: `Cmd + Shift + R`

### 2. Restart Dev Server
1. Stop the current server: Press `Ctrl + C` in the terminal
2. Start again: `npm run dev`

### 3. Clear Browser Cache
- Open browser DevTools (F12)
- Right-click the refresh button
- Select "Empty Cache and Hard Reload"

### 4. Check Dev Server Status
Make sure you see this in the terminal:
```
VITE v5.x.x  ready in xxx ms
➜  Local:   http://localhost:3000/
```

## Hot Module Replacement (HMR)

Vite uses Hot Module Replacement by default. Changes should appear automatically without full page refresh.

### If HMR isn't working:

1. **Check browser console** for errors
2. **Verify dev server is running** - terminal should show "ready"
3. **Try manual refresh** - Sometimes HMR needs a kickstart
4. **Check file watchers** - Make sure your OS isn't blocking file watching

## Common Issues

### Issue: Changes not appearing
- **Solution**: Hard refresh browser (`Ctrl + Shift + R`)
- **Check**: Terminal shows "page reload" messages when you save files

### Issue: Dev server stopped
- **Solution**: Restart with `npm run dev`
- **Check**: No errors in terminal

### Issue: Port 3000 in use
- **Solution**: Change port in `vite.config.ts`:
  ```typescript
  server: {
    port: 3001,
  }
  ```

### Issue: Browser shows old version
- **Solution**: Clear browser cache completely
- **Alternative**: Use incognito/private window

## Verify HMR is Working

1. Make a small change (e.g., change text in a component)
2. Save the file
3. Check terminal - should show "hmr update" or "page reload"
4. Browser should update automatically (or show update notification)

If none of these work, restart the dev server completely.
