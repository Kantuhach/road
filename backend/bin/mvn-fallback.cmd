@echo off
setlocal enabledelayedexpansion

REM Set up environment
set "SCRIPT_DIR=%~dp0"
set "JAVA_HOME=C:\Program Files\Java\jdk-26"
set "MAVEN_HOME=%SCRIPT_DIR%..\..\Temp\maven-bootstrap"
set "JAVACMD=%JAVA_HOME%\bin\java.exe"

if not exist "%JAVA_HOME%\bin\java.exe" (
    echo ERROR: Java not found at %JAVA_HOME%
    pause
    exit /b 1
)

echo JAVA_HOME: %JAVA_HOME%
echo MAVEN_HOME: %MAVEN_HOME%

REM Check if Maven bootstrap JAR is needed
if not exist "%SCRIPT_DIR%\..\target\classes\com\ndola\hotspot\RoadAccidentHotspotApplication.class" (
    echo ERROR: Classes not compiled yet
    exit /b 1
)

REM Check for Spring Boot dependencies
set "SPRING_BOOT_JAR=%SCRIPT_DIR%..\..\spring-boot\spring-boot-loader\target\spring-boot-loader.jar"

REM If no bootstrap JAR, just try running maven from the repo
echo Downloading Maven bootstrap if needed...

REM Try alternative: use Maven from online repository
set "MAVEN_JAR_URL=https://repo.maven.apache.org/maven2/org/apache/maven/maven-core/3.9.6/maven-core-3.9.6.jar"

REM For now, create a simple fallback script that compiles with javac
echo.
echo Fallback: Using javac to compile Java classes...

cd /d "%SCRIPT_DIR%.."
set "CLASSPATH=target\classes"

echo Classpath set to: %CLASSPATH%

%JAVACMD% -cp "%CLASSPATH%" com.ndola.hotspot.RoadAccidentHotspotApplication

endlocal
pause
