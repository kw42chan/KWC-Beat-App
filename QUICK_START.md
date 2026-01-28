# Quick Start - Web App

## Step 1: Install Dependencies

```bash
npm install
```

## Step 2: Add Google Maps API Key

1. Get your API key from [Google Cloud Console](https://console.cloud.google.com/)
2. Copy the example environment file:
   ```bash
   cp .env.example .env
   ```
3. Open `.env` and add your API key:
   ```
   VITE_GOOGLE_MAPS_API_KEY=your_actual_api_key_here
   ```

**Note**: The `.env` file is not committed to Git, so your API key stays secure!

## Step 3: Run the App

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

## Build for Production

```bash
npm run build
```

The built files will be in the `dist` folder.

## Preview Production Build

```bash
npm run preview
```

## Troubleshooting

### Map doesn't load
- Check that your Google Maps API key is correctly set
- Ensure Maps JavaScript API is enabled in Google Cloud Console
- Check browser console for errors

### Zones not showing
- Verify `src/data/zones.json` contains zone data
- Check browser console for errors

### Port 3000 already in use
- Change the port in `vite.config.ts`:
  ```typescript
  server: {
    port: 3001, // or any other port
  }
  ```
