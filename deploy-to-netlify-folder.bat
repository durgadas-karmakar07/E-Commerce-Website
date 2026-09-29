@echo off
title Prepare and Open Netlify Deploy Folder
color 0a
echo ========================================================
echo        NETLIFY DEPLOYMENT HELPER (AURA STORE)
echo ========================================================
echo.
set "PATH=C:\Users\USER\nodejs;%PATH%"

echo [1/3] Building production bundle with Netlify SPA redirects...
call npm --prefix client run build

if %errorlevel% neq 0 (
    echo [ERROR] Build failed! Please fix errors above.
    pause
    exit /b 1
)

echo.
echo [2/3] Verifying Netlify _redirects rule...
if exist "client\dist\_redirects" (
    echo [OK] client\dist\_redirects is present (/* /index.html 200).
) else (
    echo /*    /index.html   200 > client\dist\_redirects
    echo [CREATED] client\dist\_redirects
)

echo.
echo [3/3] Opening client\dist folder and Netlify Drop in browser...
explorer "d:\E-commerce\client\dist"
start https://app.netlify.com/drop

echo.
echo ========================================================
echo INSTRUCTIONS:
echo 1. The browser opened: https://app.netlify.com/drop
echo 2. DRAG THE WHOLE "dist" FOLDER into Netlify Drop!
echo    (Path: D:\E-commerce\client\dist)
echo.
echo Note: DO NOT drag the entire "E-commerce" folder.
echo       ONLY drag the "dist" folder!
echo ========================================================
pause
