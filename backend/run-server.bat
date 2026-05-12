@echo off
setlocal enabledelayedexpansion

REM Set Java Home
set "JAVA_HOME=C:\Program Files\Java\jdk-26"
set "PATH=%JAVA_HOME%\bin;%PATH%"

REM Navigate to backend directory  
cd /d "%~dp0"

echo.
echo ========================================
echo Road Accident Hotspot Backend Launcher
echo ========================================
echo.
echo Java Home: %JAVA_HOME%
echo.
echo Checking MongoDB connection...
curl http://localhost:27017/ >nul 2>&1
if errorlevel 1 (
    echo.
    echo ERROR: MongoDB is not running!
    echo Please start MongoDB first with: net start MongoDB
    echo Or run: mongod
    echo.
    pause
    exit /b 1
)
echo MongoDB OK!
echo.

echo Attempting to build and run...
echo.

REM Try to run with Maven
if exist ".\bin\mvn.cmd" (
    echo Using Maven wrapper...
    call ".\bin\mvn.cmd" spring-boot:run -DskipTests
) else (
    echo Maven wrapper not found!
    exit /b 1
)

pause
endlocal
