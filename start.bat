@echo off
echo Starting PromptCraft...
echo.

echo Step 1: Setting up environment...
if not exist "server\.env" (
    echo Creating server\.env from template...
    copy "server\env.example" "server\.env"
    echo.
    echo IMPORTANT: Please edit server\.env and add your API keys!
    echo - For OpenAI: Get your API key from https://platform.openai.com/api-keys
    echo - For Hugging Face: Get your API key from https://huggingface.co/settings/tokens
    echo.
    pause
)

echo Step 2: Installing dependencies...
echo Installing frontend dependencies...
cd frontend
call npm install
cd ..

echo Installing server dependencies...
cd server
call npm install
cd ..

echo.
echo Step 3: Starting services...
echo Starting backend server in new window...
start "PromptCraft Backend" cmd /k "cd server && npm run dev"

echo Waiting for backend to start...
timeout /t 3 /nobreak >nul

echo Starting frontend in new window...
start "PromptCraft Frontend" cmd /k "cd frontend && npm start"

echo.
echo PromptCraft is starting up!
echo - Backend: http://localhost:3001
echo - Frontend: http://localhost:3000
echo.
echo Press any key to close this window...
pause >nul
