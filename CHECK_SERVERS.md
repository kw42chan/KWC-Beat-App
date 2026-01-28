# How to Check Your Zone Data

## Two Servers Must Be Running

### 1. Backend API Server (Port 3001)
- **Location**: `server/` folder
- **Command**: `npm run dev` or `node server.js`
- **Purpose**: Serves API endpoints for zone data
- **URL**: `http://localhost:3001`

### 2. Frontend React App (Port 3000 or 3007)
- **Location**: Project root folder
- **Command**: `npm run dev`
- **Purpose**: Serves the React map application
- **URL**: `http://localhost:3000` or `http://localhost:3007`

## How to Access Zone Data

### Step 1: Make sure backend server is running
Open a terminal and run:
```bash
cd server
npm run dev
```

You should see:
```
🚀 Server running on http://localhost:3001
📁 Data directory: ...
```

### Step 2: Access API endpoints
Open these URLs in your browser (NOT in the React app):

**Check all profiles:**
```
http://localhost:3001/api/profiles
```

**Check zones for a profile (replace `default` with your profile ID):**
```
http://localhost:3001/api/zones/default
```

**Health check:**
```
http://localhost:3001/api/health
```

## Important Notes

- ✅ The backend API (`http://localhost:3001`) should return **JSON data**
- ❌ If you see the **map** at `http://localhost:3001`, the frontend is running on that port instead
- ✅ The frontend app should be on `http://localhost:3000` or `http://localhost:3007`
- ✅ Both servers must run **simultaneously** in **separate terminals**

## Troubleshooting

**If you see the map instead of JSON:**
1. Stop all running servers
2. Start backend first: `cd server && npm run dev`
3. Wait for "Server running on http://localhost:3001"
4. Start frontend in another terminal: `npm run dev`
5. Frontend should use port 3000 (or auto-switch if taken)
6. Now `http://localhost:3001/api/profiles` should return JSON
