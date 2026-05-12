@echo off
setlocal enabledelayedexpansion

cd /d "c:\Users\kantu\Desktop\ROAD ACCIDENT SYSTEM\frontend"

echo.
echo ================================================
echo Starting Frontend Server on port 3000
echo ================================================
echo.

call npm run dev

endlocal
pause
