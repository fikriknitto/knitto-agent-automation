@echo off

setlocal EnableExtensions

cd /d "%~dp0..\.."



where pnpm >nul 2>&1

if errorlevel 1 (

  echo [ERROR] pnpm tidak ditemukan. Jalankan: corepack enable

  exit /b 1

)



if not exist "apps\backend\.env" (

  echo [WARN] apps\backend\.env tidak ada — salin dari apps\backend\.env.example

)



echo.

echo === ADB disconnect BlueStacks ===

echo (default) instance dari last start-bluestacks / start:instances

echo Contoh: %~nx0 --all

echo         %~nx0 --only Pie64,Pie64_15

echo         %~nx0 --dry-run

echo.



pnpm disconnect:instances -- %*

set "EXIT_CODE=%ERRORLEVEL%"

if not "%EXIT_CODE%"=="0" (

  echo.

  echo [ERROR] Gagal (exit %EXIT_CODE%)

  exit /b %EXIT_CODE%

)



echo.

echo [OK] Cek device: adb devices

endlocal

