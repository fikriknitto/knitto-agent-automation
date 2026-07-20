# Start Appium with ANDROID_HOME (User env may not reach terminals opened before registry update).
$sdk = [Environment]::GetEnvironmentVariable("ANDROID_HOME", "User")
if (-not $sdk) { $sdk = "C:\Users\IT16\Android" }

$env:ANDROID_HOME = $sdk
$env:ANDROID_SDK_ROOT = [Environment]::GetEnvironmentVariable("ANDROID_SDK_ROOT", "User")
if (-not $env:ANDROID_SDK_ROOT) { $env:ANDROID_SDK_ROOT = $sdk }
# platform-tools first — avoid BlueStacks/old adb (v36) fighting Appium adb (v41).
$env:Path = "$sdk\platform-tools;$env:Path"

$adb = Join-Path $sdk "platform-tools\adb.exe"
Write-Host "ANDROID_HOME=$env:ANDROID_HOME"
Write-Host "ANDROID_SDK_ROOT=$env:ANDROID_SDK_ROOT"
& $adb version 2>$null | Select-Object -First 1
& $adb start-server 2>$null | Out-Null
& $adb devices

appium --address 127.0.0.1 --port 4723 --relaxed-security --allow-insecure adb_shell @args
