# Start both backend and frontend servers
Write-Host "=========================================="
Write-Host "Starting KWC Beat App - Both Servers"
Write-Host "=========================================="
Write-Host ""

# Start backend in a new window
Write-Host "Starting backend server (port 3001) in new window..."
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd 'c:\Development Projects\New folder\KWC-Beat-App\server'; Write-Host 'Backend Server (Port 3001)'; Write-Host '========================'; npm start"

# Wait a moment for backend to start
Start-Sleep -Seconds 3

# Start frontend in current window
Write-Host "Starting frontend client (port 3000)..."
Write-Host ""
npm run dev
