# KWC Beat App - Backend Server

Backend API server for saving and loading zone data.

## Features

- RESTful API for zone and profile management
- File-based storage (JSON files)
- CORS enabled for frontend access
- Automatic fallback to local storage if server unavailable

## Installation

```bash
cd server
npm install
```

## Running the Server

### Development Mode (with auto-reload)
```bash
npm run dev
```

### Production Mode
```bash
npm start
```

The server will run on `http://localhost:3001` by default.

You can change the port by setting the `PORT` environment variable:
```bash
PORT=3002 npm start
```

## API Endpoints

### Zones

- `GET /api/zones/:profileId` - Get all zones for a profile
- `POST /api/zones/:profileId` - Save zones for a profile

### Profiles

- `GET /api/profiles` - Get all profiles
- `POST /api/profiles` - Create a new profile
- `PUT /api/profiles/:profileId` - Update a profile
- `DELETE /api/profiles/:profileId` - Delete a profile

### Health Check

- `GET /api/health` - Check if server is running

## Data Storage

Zone and profile data is stored in JSON files in the `server/data/` directory:

- `profile-{profileId}.json` - Zone data for each profile
- `profiles.json` - List of all profiles

## Frontend Configuration

To enable server storage in the frontend, add to your `.env` file:

```
VITE_API_URL=http://localhost:3001
```

If `VITE_API_URL` is not set, the app will use IndexedDB/localStorage as fallback.

## Deployment

For production deployment:

1. Set the `PORT` environment variable
2. Ensure the `server/data/` directory is writable
3. Consider adding authentication/authorization
4. Use a process manager like PM2 or systemd
5. Set up HTTPS with SSL certificates
