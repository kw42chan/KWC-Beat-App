# Stop KWC Beat App Backend Server
Write-Host "Stopping server on port 3001..."

$connections = Get-NetTCPConnection -LocalPort 3001 -ErrorAction SilentlyContinue
$stopped = $false

foreach ($conn in $connections) {
    if ($conn.OwningProcess -ne 0) {
        try {
            $proc = Get-Process -Id $conn.OwningProcess -ErrorAction SilentlyContinue
            if ($proc) {
                Write-Host "Stopping process: PID=$($conn.OwningProcess), Name=$($proc.ProcessName)"
                Stop-Process -Id $conn.OwningProcess -Force -ErrorAction Stop
                $stopped = $true
            }
        } catch {
            Write-Host "Could not stop process $($conn.OwningProcess): $_"
        }
    }
}

if ($stopped) {
    Start-Sleep -Seconds 1
    $stillRunning = Get-NetTCPConnection -LocalPort 3001 -ErrorAction SilentlyContinue
    if ($stillRunning) {
        Write-Host "⚠️  Server may still be stopping..."
    } else {
        Write-Host "✅ Server stopped successfully"
    }
} else {
    Write-Host "ℹ️  No server found running on port 3001"
}
