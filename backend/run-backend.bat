@echo off
REM Set JAVA_HOME to current Java installation
for /f "tokens=*" %%i in ('where java') do (
    set JAVA_BIN=%%i
    goto :java_found
)

:java_found
echo Found Java at: %JAVA_BIN%

REM Navigate to backend directory
cd /d "%~dp0\.."

REM Set JAVA_HOME for Maven
set JAVA_HOME=%JAVA_BIN%\..\..\

echo JAVA_HOME: %JAVA_HOME%
echo Starting Maven Spring Boot...

REM Run Spring Boot with Maven
call .\bin\mvn.cmd -DskipTests clean spring-boot:run

pause
