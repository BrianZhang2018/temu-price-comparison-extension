@echo off
title Temu Price Comparison Extension - One-Click Installer
color 0A

echo.
echo ==================================================
echo    Temu Price Comparison Extension Installer
echo ==================================================
echo.

echo Checking system requirements...
echo.

REM Check if Chrome is installed
where chrome >nul 2>nul
if %errorlevel% neq 0 (
    echo ERROR: Google Chrome not found!
    echo Please install Google Chrome first.
    echo.
    pause
    exit /b 1
)
echo ✓ Google Chrome found

REM Check if required files exist
if not exist "manifest.json" (
    echo ERROR: manifest.json not found!
    echo Please run this script from the extension directory.
    echo.
    pause
    exit /b 1
)
echo ✓ Extension files found

echo.
echo Opening Chrome Extensions page...
start chrome chrome://extensions/

echo.
echo ==================================================
echo Installation Steps:
echo ==================================================
echo 1. Chrome Extensions page should now be open
echo 2. Enable "Developer mode" (toggle in top-right)
echo 3. Click "Load unpacked" button
echo 4. Select this folder: %CD%
echo 5. Pin the extension to your toolbar
echo.

echo Test URLs:
echo - https://www.amazon.com/dp/B08N5WRWNW (Echo Dot)
echo - https://www.amazon.com/dp/B07ZPKBL9V (Wireless Earbuds)
echo.

echo Installation guide created: INSTALLATION_GUIDE.md
echo.

echo ✓ Extension ready for installation!
echo.
pause 