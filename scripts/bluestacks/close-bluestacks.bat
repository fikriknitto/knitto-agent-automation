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
echo === Close BlueStacks instances ===
echo Menghentikan semua HD-Player.exe: taskkill /F /IM HD-Player.exe
echo (default) launch state dari last start:instances
echo Contoh: %~nx0 --all
echo         %~nx0 --only Pie64,Pie64_15
echo         %~nx0 --dry-run
echo.

echo %* | findstr /i /c:"--dry-run" >nul
if errorlevel 1 (
  taskkill /F /IM HD-Player.exe >nul 2>&1
  if errorlevel 1 (
    echo [INFO] HD-Player.exe tidak berjalan atau sudah berhenti
  ) else (
    echo [OK] HD-Player.exe dihentikan
  )
) else (
  echo [dry-run] Would run: taskkill /F /IM HD-Player.exe
)
echo.

pnpm close:instances -- %*
set "EXIT_CODE=%ERRORLEVEL%"
if not "%EXIT_CODE%"=="0" (
  echo.
  echo [ERROR] Gagal (exit %EXIT_CODE%)
  exit /b %EXIT_CODE%
)

echo.
echo [OK] Instance ditutup. Jalankan disconnect-adb.bat jika perlu.
endlocal
