# KWC Beat App - Web Version

An interactive web application displaying 54 zones in Kowloon, Hong Kong on an interactive map.

## Features

- **Interactive Map**: Display zones as colored rectangular overlays using Google Maps
- **Zone Search**: Search and filter zones by ID or name
- **Zone Details**: Click on zones to view detailed information
- **Zoom Controls**: Fit all zones or zoom to specific zones
- **Dark/Light Mode**: Automatic theme switching based on system preferences
- **Offline Support**: Graceful handling of network connectivity issues
- **Error Handling**: Comprehensive error states and loading indicators

## Prerequisites

- Node.js >= 18
- npm or yarn
- Google Maps API key

## Installation

1. Install dependencies:
```bash
npm install
```

2. Configure Google Maps API Key:
   - Get your API key from [Google Cloud Console](https://console.cloud.google.com/)
   - Copy `.env.example` to `.env`:
     ```bash
     cp .env.example .env
     ```
   - Open `.env` and add your API key:
     ```
     VITE_GOOGLE_MAPS_API_KEY=your_api_key_here
     ```
   - The `.env` file is gitignored and won't be committed to version control

3. Add Zone Data:
   - Edit `src/data/zones.json` with your 54 zones
   - Or use the extraction script: `npm run extract-zones` (requires KML file)

## Running the App

### Development Mode
```bash
npm run dev
```

The app will open at `http://localhost:3000`

### Build for Production
```bash
npm run build
```

### Preview Production Build
```bash
npm run preview
```

## Project Structure

```
src/
├── components/
│   ├── MapScreen.tsx          # Main map component
│   ├── SearchBar.tsx          # Search/filter component
│   ├── ZoomControls.tsx       # Zoom control buttons
│   ├── ZoneDetailsModal.tsx   # Zone info modal
│   ├── LoadingSpinner.tsx     # Loading indicator
│   └── ErrorView.tsx          # Error display
├── context/
│   └── ThemeContext.tsx       # Theme management
├── data/
│   └── zones.json             # Zone coordinate data
├── types/
│   └── zone.ts                # TypeScript interfaces
├── utils/
│   ├── zoneUtils.ts           # Zone calculation utilities
│   └── mapUtils.ts            # Map helper functions
├── App.tsx                    # Root component
└── main.tsx                   # Entry point
```

## Zone Data Format

Each zone in `zones.json` should follow this structure:

```json
{
  "id": 1,
  "name": "Zone 1",
  "minLat": 22.3500,
  "maxLat": 22.3600,
  "minLng": 114.1200,
  "maxLng": 114.1300,
  "centerLat": 22.3550,
  "centerLng": 114.1250
}
```

## Technologies Used

- **React 18** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **Google Maps JavaScript API** - Map rendering
- **@react-google-maps/api** - React wrapper for Google Maps

## Deployment

### Quick Deploy to GitHub Pages

1. **Create GitHub repository** and push your code
2. **Update `vite.config.ts`** - Change `base` path to match your repo name
3. **Set GitHub Secrets:**
   - Go to Repository → Settings → Secrets → Actions
   - Add `VITE_GOOGLE_MAPS_API_KEY` with your API key
4. **Enable GitHub Pages:**
   - Go to Settings → Pages → Source: GitHub Actions
5. **Push to main branch** - Auto-deploys!

📖 **Full Guide:** See [QUICK_DEPLOY.md](./QUICK_DEPLOY.md) for quick start or [DEPLOYMENT.md](./DEPLOYMENT.md) for comprehensive instructions.

🌐 **Live Demo:** Your app will be available at `https://YOUR_USERNAME.github.io/YOUR_REPO_NAME/`

## License

Private project - All rights reserved
