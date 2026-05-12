@echo off
setlocal enabledelayedexpansion

REM Set paths
set "JAVA_HOME=C:\Program Files\Java\jdk-26"
set "PATH=%JAVA_HOME%\bin;%PATH%"

REM Navigate to project
cd /d "c:\Users\kantu\Desktop\ROAD ACCIDENT SYSTEM\backend"

echo.
echo Checking environment...
echo JAVA_HOME=%JAVA_HOME%
java -version

echo.
echo Checking Maven...
if exist ".\bin\mvn.cmd" (
    echo Maven wrapper found at .\bin\mvn.cmd
) else (
    echo ERROR: Maven wrapper not found
    pause
    exit /b 1
)

echo.
echo Checking MongoDB...
for /f %%i in ('wmic process list brief ^| findstr mongod') do (
    echo MongoDB is running
    goto mongodb_ok
)
echo WARNING: MongoDB may not be running
:mongodb_ok

echo.
echo Building project...
echo.

REM Clean and package
call .\bin\mvn.cmd clean package -DskipTests -q

if errorlevel 1 (
    echo.
    echo Build FAILED!
    pause
    exit /b 1
)

echo Build successful!
echo.
echo Locating JAR file...

for /r ".\target" %%f in (*-SNAPSHOT.jar) do (
    if not "%%f"=="*-sources.jar" (
        set "JAR_FILE=%%f"
        goto found_jar
    )
)

:found_jar
if defined JAR_FILE (
    echo Found JAR: !JAR_FILE!
    echo.
    echo Starting application...
    echo.
    call java -jar "!JAR_FILE!"
) else (
    echo ERROR: Could not find executable JAR
    pause
    exit /b 1
)

endlocal
pause
