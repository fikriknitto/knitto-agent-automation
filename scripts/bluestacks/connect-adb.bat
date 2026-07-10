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
echo === ADB connect BlueStacks ===
echo (default) instance dari last start-bluestacks / start:instances
echo Contoh: %~nx0 --all
echo         %~nx0 --only Pie64,Pie64_15
echo         %~nx0 --dry-run
echo.
echo Env: BLUESTACKS_ADB_CONNECT_DELAY_MS di apps\backend\.env
echo.

echo %* | findstr /i /c:"--dry-run" >nul
if errorlevel 1 (
  where adb >nul 2>&1
  if errorlevel 1 (
    echo [WARN] adb tidak ditemukan di PATH — kill-server dilewati
  ) else (
    echo Restarting ADB server ^(adb kill-server^)...
    adb kill-server
    if errorlevel 1 (
      echo [WARN] adb kill-server gagal — lanjut connect
    )
  )
  echo.
)

pnpm connect:instances -- %*
set "EXIT_CODE=%ERRORLEVEL%"
if not "%EXIT_CODE%"=="0" (
  echo.
  echo [ERROR] Gagal (exit %EXIT_CODE%)
  exit /b %EXIT_CODE%
)

echo.
echo [OK] Cek device: adb devices
endlocal
