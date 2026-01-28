# How to Preview the App

## Quick Steps

### 1. Install Dependencies

Open a terminal in the project directory and run:

```bash
npm install
```

**Note**: If you get npm cache errors, try:
```bash
npm cache clean --force
npm install
```

### 2. Start the Development Server

```bash
npm run dev
```

The app will automatically open in your browser at `http://localhost:3000`

## What You'll See

- ✅ A map centered on Kowloon, Hong Kong
- ✅ Colored zone overlays (currently 5 sample zones)
- ✅ Search bar at the top
- ✅ "Fit All Zones" button on the right
- ✅ Click any zone to see details

## Troubleshooting

### npm install fails
- Try: `npm cache clean --force` then `npm install`
- Or: Delete `node_modules` folder and `package-lock.json`, then run `npm install` again

### Port 3000 already in use
- Change the port in `vite.config.ts`:
  ```typescript
  server: {
    port: 3001, // or any other port
  }
  ```

### Map doesn't load
- Check that your `.env` file exists and contains your API key
- Verify Maps JavaScript API is enabled in Google Cloud Console
- Check browser console for errors

## Important Security Note

✅ Your API key is now in `.env` (not committed to Git)
✅ `.env.example` is safe to commit (no real keys)

Make sure you never commit your `.env` file!
