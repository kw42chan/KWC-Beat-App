# Start backend server in background
Write-Host "Starting backend server in background..."
$job = Start-Job -ScriptBlock {
    Set-Location "c:\Development Projects\New folder\KWC-Beat-App\server"
    npm start
}
Write-Host "Backend server started in background (Job ID: $($job.Id))"
Write-Host "To stop: Stop-Job -Id $($job.Id); Remove-Job -Id $($job.Id)"
Write-Host ""
Write-Host "You can now run the frontend in this same terminal:"
Write-Host "  cd .."
Write-Host "  npm run dev"
