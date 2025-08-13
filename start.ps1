Write-Host "Starting PromptCraft..." -ForegroundColor Green
Write-Host ""

# Step 1: Setting up environment
Write-Host "Step 1: Setting up environment..." -ForegroundColor Yellow
if (-not (Test-Path "server\.env")) {
    Write-Host "Creating server\.env from template..." -ForegroundColor Cyan
    Copy-Item "server\env.example" "server\.env"
    Write-Host ""
    Write-Host "IMPORTANT: Please edit server\.env and add your API keys!" -ForegroundColor Red
    Write-Host "- For OpenAI: Get your API key from https://platform.openai.com/api-keys" -ForegroundColor White
    Write-Host "- For Hugging Face: Get your API key from https://huggingface.co/settings/tokens" -ForegroundColor White
    Write-Host ""
    Read-Host "Press Enter to continue..."
}

# Step 2: Installing dependencies
Write-Host "Step 2: Installing dependencies..." -ForegroundColor Yellow
Write-Host "Installing frontend dependencies..." -ForegroundColor Cyan
Set-Location frontend
npm install
Set-Location ..

Write-Host "Installing server dependencies..." -ForegroundColor Cyan
Set-Location server
npm install
Set-Location ..

Write-Host ""
Write-Host "Step 3: Starting services..." -ForegroundColor Yellow

# Start backend
Write-Host "Starting backend server..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD\server'; npm run dev" -WindowStyle Normal

# Wait for backend to start
Write-Host "Waiting for backend to start..." -ForegroundColor Cyan
Start-Sleep -Seconds 3

# Start frontend
Write-Host "Starting frontend..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD\frontend'; npm start" -WindowStyle Normal

Write-Host ""
Write-Host "PromptCraft is starting up!" -ForegroundColor Green
Write-Host "- Backend: http://localhost:3001" -ForegroundColor White
Write-Host "- Frontend: http://localhost:3000" -ForegroundColor White
Write-Host ""
Write-Host "Press Enter to close this window..." -ForegroundColor Yellow
Read-Host
