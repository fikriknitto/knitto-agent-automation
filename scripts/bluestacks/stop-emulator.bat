@echo off
setlocal EnableExtensions
cd /d "%~dp0..\.."

echo === Close BlueStacks + ADB disconnect ===
echo.

call "%~dp0close-bluestacks.bat" %*
if errorlevel 1 exit /b 1

echo.

call "%~dp0disconnect-adb.bat"
exit /b %ERRORLEVEL%
