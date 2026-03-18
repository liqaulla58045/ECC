@echo off
title ECC - Enterprise Command Center
color 0A

echo.
echo  ============================================
echo   ENTERPRISE COMMAND CENTER — STARTING UP
echo  ============================================
echo.

:: ── Check PostgreSQL service
echo  [1/4] Checking PostgreSQL service...
sc query "postgresql-x64-18" | find "RUNNING" >nul 2>&1
if %errorlevel% neq 0 (
    echo  Starting PostgreSQL...
    net start postgresql-x64-18 >nul 2>&1
    timeout /t 3 /nobreak >nul
    echo  PostgreSQL started.
) else (
    echo  PostgreSQL already running.
)

echo.

:: ── Kill anything already on ports 3001, 3002, or 5173
echo  Clearing ports 3001, 3002, and 5173...
for /f "tokens=5" %%a in ('netstat -aon ^| find ":3001 "') do taskkill /f /pid %%a >nul 2>&1
for /f "tokens=5" %%a in ('netstat -aon ^| find ":3002 "') do taskkill /f /pid %%a >nul 2>&1
for /f "tokens=5" %%a in ('netstat -aon ^| find ":5173 "') do taskkill /f /pid %%a >nul 2>&1
timeout /t 1 /nobreak >nul

:: ── Start Backend API
echo  [2/4] Starting Backend API on http://localhost:3001 ...
start "ECC Backend" cmd /k "cd /d %~dp0backend\api && echo  Backend starting... && npm run dev"

timeout /t 2 /nobreak >nul

:: ── Start MCP Server
echo  [3/4] Starting MCP Server on http://localhost:3002 ...
start "ECC MCP Server" cmd /k "cd /d %~dp0backend\mcp-server && if not exist node_modules (echo  First run: installing MCP dependencies... && npm install --silent) else (echo  MCP dependencies already installed.) && if not exist "%USERPROFILE%\AppData\Local\ms-playwright" (echo  First run: installing Playwright Chromium... && npx playwright install chromium) else (echo  Playwright Chromium already installed.) && echo  MCP Server starting... && npx tsx server.ts"

echo  Waiting for MCP Server to boot (Playwright takes ~10s)...
timeout /t 10 /nobreak >nul

:: ── Start Frontend
echo  [4/4] Starting Frontend on http://localhost:5173 ...
start "ECC Frontend" cmd /k "cd /d %~dp0frontend && echo  Frontend starting... && npm run dev"

echo.
echo  ============================================
echo   All services launching in separate windows
echo.
echo   Frontend    →  http://localhost:5173
echo   Backend     →  http://localhost:3001
echo   MCP Server  →  http://localhost:3002
echo   Health      →  http://localhost:3001/health
echo  ============================================
echo.

timeout /t 5 /nobreak >nul

:: ── Open browser
echo  Opening browser...
start http://localhost:5173

echo.
echo  Press any key to close this window...
pause >nul
