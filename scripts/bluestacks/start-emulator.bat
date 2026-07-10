@echo off
setlocal EnableExtensions
cd /d "%~dp0..\.."

echo === Launch BlueStacks + ADB connect ===
echo.

if "%~1"=="" (
  call "%~dp0start-bluestacks.bat" emulator=3
) else (
  call "%~dp0start-bluestacks.bat" %*
)
if errorlevel 1 exit /b 1

echo.
echo Menunggu boot (BLUESTACKS_ADB_CONNECT_DELAY_MS dari .env)...
echo.

call "%~dp0connect-adb.bat"
exit /b %ERRORLEVEL%
