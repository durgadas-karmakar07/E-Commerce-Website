@echo off
title AURA E-Commerce Launcher
color 0b
echo ========================================================
echo       AURA E-COMMERCE PLATFORM LAUNCHER
echo ========================================================
echo.
set "PATH=C:\Users\USER\nodejs;%PATH%"

echo [1/3] Checking Node.js environment...
node -v >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Node.js was not found in PATH or C:\Users\USER\nodejs!
    pause
    exit /b 1
)
echo [OK] Node.js is ready.

echo [2/3] Checking backend and frontend services...
netstat -ano | findstr :5000 >nul 2>&1
if %errorlevel% neq 0 (
    echo Starting Backend Server on port 5000...
    start /min "AURA Backend" cmd /c "cd /d D:\E-commerce && set PATH=C:\Users\USER\nodejs;%%PATH%% && npm --prefix server run dev"
) else (
    echo [OK] Backend server is already running on http://localhost:5000
)

netstat -ano | findstr :5173 >nul 2>&1
if %errorlevel% neq 0 (
    echo Starting Frontend Vite Server on port 5173...
    start /min "AURA Frontend" cmd /c "cd /d D:\E-commerce && set PATH=C:\Users\USER\nodejs;%%PATH%% && npm --prefix client run dev -- --host 0.0.0.0 --port 5173"
) else (
    echo [OK] Frontend server is already running on http://localhost:5173
)

timeout /t 2 /nobreak >nul

echo [3/3] Opening AURA Storefront in your browser...
start http://localhost:5173

echo.
echo ========================================================
echo Website opened at: http://localhost:5173
echo Admin Panel:       http://localhost:5173/admin
echo User Dashboard:    http://localhost:5173/account
echo ========================================================
timeout /t 5 >nul
