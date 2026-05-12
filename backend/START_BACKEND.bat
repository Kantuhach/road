@echo off
setlocal enabledelayedexpansion

REM Set environment
set "JAVA_HOME=C:\Program Files\Java\jdk-26"
set "JAVA_BIN=%JAVA_HOME%\bin\java.exe"

REM Create temp directory for Maven
set "TEMP_DIR=%TEMP%"
set "MAVEN_ZIP=%TEMP_DIR%\maven-3.9.6.zip"
set "MAVEN_DIR=%TEMP_DIR%\maven-3.9.6"
set "MAVEN_BIN=%MAVEN_DIR%\bin\mvn.cmd"

cd /d "c:\Users\kantu\Desktop\ROAD ACCIDENT SYSTEM\backend"

echo.
echo ================================================
echo Road Accident Hotspot - Complete Startup Script
echo ================================================
echo.

REM Check Java
if not exist "%JAVA_BIN%" (
    echo ERROR: Java not found at %JAVA_HOME%
    pause
    exit /b 1
)
echo [OK] Java found: %JAVA_BIN%

REM Download Maven if needed
if not exist "%MAVEN_BIN%" (
    echo.
    echo Downloading Maven 3.9.6...
    if exist "%MAVEN_ZIP%" del "%MAVEN_ZIP%"
    
    powershell -NoProfile -Command "^
        [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12; ^
        Invoke-WebRequest -Uri 'https://archive.apache.org/dist/maven/maven-3/3.9.6/binaries/apache-maven-3.9.6-bin.zip' ^
        -OutFile '%MAVEN_ZIP%' -TimeoutSec 300"
    
    if errorlevel 1 (
        echo ERROR: Failed to download Maven
        pause
        exit /b 1
    )
    
    echo Extracting Maven...
    powershell -NoProfile -Command "Expand-Archive -Path '%MAVEN_ZIP%' -DestinationPath '%TEMP_DIR%' -Force"
    
    if not exist "%MAVEN_BIN%" (
        echo ERROR: Failed to extract Maven
        pause
        exit /b 1
    )
)

echo [OK] Maven ready: %MAVEN_BIN%

REM Build backend
echo.
echo Building backend (this may take 2-3 minutes on first build)...
echo.

call "%MAVEN_BIN%" clean package -DskipTests

if errorlevel 1 (
    echo.
    echo ERROR: Build failed!
    echo.
    pause
    exit /b 1
)

echo.
echo [OK] Build successful!
echo.

REM Find JAR file
echo Locating JAR file...
for /f %%f in ('dir /b /s target\*SNAPSHOT.jar 2^>nul ^| findstr /v sources') do (
    set "JAR_FILE=%%f"
    goto found_jar
)

echo ERROR: Could not find executable JAR
pause
exit /b 1

:found_jar
echo [OK] Found: %JAR_FILE%

REM Check MongoDB
echo.
echo Checking MongoDB...
tasklist /FI "IMAGENAME eq mongod.exe" 2>NUL | find /I /N "mongod.exe">NUL
if "%ERRORLEVEL%"=="0" (
    echo [OK] MongoDB is running
) else (
    echo [WARNING] MongoDB not detected
    echo Please start MongoDB before running the application:
    echo   - Run: mongod
    echo   - Or: net start MongoDB
    echo.
)

REM Start backend
echo.
echo ================================================
echo Starting Backend Server on port 8080
echo ================================================
echo.

"%JAVA_BIN%" -jar "%JAR_FILE%"

endlocal
pause
