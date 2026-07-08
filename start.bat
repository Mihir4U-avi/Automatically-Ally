@echo off
echo ===================================================
echo   Starting Automatically - Ally Workspace
echo ===================================================

echo Starting Backend API...
start "Backend API" cmd /k "cd backend && .\venv\Scripts\activate.bat && uvicorn main:app --host 0.0.0.0 --port 8000 --reload"

echo Starting Frontend UI...
start "Frontend UI" cmd /k "cd frontend && npm run dev -- --host 0.0.0.0"

echo.
echo Both servers have been launched in separate windows.
echo - Frontend UI: http://localhost:5173 (or use your PC's local IP on other devices)
echo - Backend API Docs: http://localhost:8000/docs
echo.
pause
