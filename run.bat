@echo off
echo GeoWise Demo
where node >nul 2>nul
if errorlevel 1 (
  echo Node.js is required.
  exit /b 1
)
where npm >nul 2>nul
if errorlevel 1 (
  echo npm is required.
  exit /b 1
)
if not exist node_modules (
  echo Installing frontend dependencies...
  call npm install
)
echo Starting Vite development server...
echo GeoWise Demo
echo Frontend: http://localhost:43173
echo Environment: DEMO
start "" "http://localhost:43173"
call npm run dev
