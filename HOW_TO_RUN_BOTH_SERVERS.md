# How to Run Both Backend and Frontend Servers

## The Problem

When you run `npm start` in the server directory, the terminal becomes **blocked** because the server runs in the **foreground**. You cannot run another command in the same terminal while the server is running.

## Solution: Use TWO Separate Terminals

### Method 1: Two Terminal Windows (Recommended)

**Terminal 1 - Backend Server:**
```bash
cd "c:\Development Projects\New folder\KWC-Beat-App\server"
npm start
```
- Keep this terminal open
- Server runs on `http://localhost:3001`
- You'll see zone import messages here

**Terminal 2 - Frontend Client:**
```bash
cd "c:\Development Projects\New folder\KWC-Beat-App"
npm run dev
```
- This opens your web app
- Frontend runs on `http://localhost:3000`
- Browser should open automatically

### Method 2: Use the Start-All Script

From the project root, run:
```bash
npm run start-all
```

This will:
- Open a new PowerShell window for the backend server
- Start the frontend in the current terminal
- Both servers run simultaneously

### Method 3: Run Backend in Background (Advanced)

In PowerShell, you can run backend as a background job:

```powershell
# Start backend in background
cd server
$job = Start-Job -ScriptBlock { npm start }

# Now you can run frontend in the same terminal
cd ..
npm run dev

# To stop backend later:
Stop-Job -Id $job.Id
Remove-Job -Id $job.Id
```

## Quick Reference

| Server | Port | Command | Location |
|--------|------|---------|----------|
| Backend API | 3001 | `npm start` | `server/` folder |
| Frontend App | 3000 | `npm run dev` | Project root |

## Important Notes

- ✅ **Both servers must run at the same time**
- ✅ **Use separate terminals for each server**
- ✅ **Backend must start first** (to load zones)
- ✅ **Frontend connects to backend** at `http://localhost:3001`

## Troubleshooting

**If frontend can't connect to backend:**
1. Make sure backend is running on port 3001
2. Check `http://localhost:3001/api/health` in browser
3. Verify `.env` file has `VITE_API_URL=http://localhost:3001`

**If port 3001 is already in use:**
- Stop the existing server: `npm run stop` (in server folder)
- Or use: `Get-NetTCPConnection -LocalPort 3001 | Stop-Process -Id {OwningProcess}`
