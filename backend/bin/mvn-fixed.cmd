@echo off
setlocal enabledelayedexpansion

REM Fix for missing Maven boot JARs - this was the root cause!

set "SCRIPT_DIR=%~dp0"
set "MAVEN_HOME=%SCRIPT_DIR%.."
set "JAVA_HOME=C:\Program Files\Java\jdk-26"

if not exist "%JAVA_HOME%\bin\java.exe" (
    echo ERROR: Java not found at %JAVA_HOME%
    echo Please set JAVA_HOME environment variable
    exit /b 1
)

echo Maven Home: %MAVEN_HOME%
echo Java Home: %JAVA_HOME%

REM Check for boot directory
if not exist "%MAVEN_HOME%\boot" (
    echo ERROR: Maven boot directory not found!
    echo Creating Maven bootstrap...
    
    REM Try to find plexus-classworlds JAR
    echo Attempting to locate Maven base directory...
    
    REM Fallback: Look for pom.xml to find project root
    cd /d "%MAVEN_HOME%\.."
    if exist "pom.xml" (
        echo Found project root at: %CD%
        
        REM Run Maven download manually
        call "%JAVA_HOME%\bin\java.exe" ^
            -DremoteRepositories="https://repo.maven.apache.org/maven2" ^
            -Dartifact=org.codehaus.plexus:plexus-classworlds:2.7.0 ^
            -Ddest="%MAVEN_HOME%\boot\plexus-classworlds.jar" ^
            org.apache.maven.plugins:maven-dependency-plugin:3.2.0:get ^
            2>nul
            
        if errorlevel 1 (
            echo Could not download Maven boot JAR
            echo.
            echo SOLUTION: Please manually rebuild Maven:
            echo   1. Download from: https://maven.apache.org/download.cgi
            echo   2. Extract to: C:\Maven
            echo   3. Or install Maven via: choco install maven
            exit /b 1
        )
    )
)

REM Now try original Maven command
cd /d "%MAVEN_HOME%\.."
call "%MAVEN_HOME%\bin\mvn.cmd" %*

endlocal
