#!/usr/bin/env bash
# Start Appium with ANDROID_HOME set (Windows: User env may not reach terminals opened before setx).
set -euo pipefail

resolve_android_sdk() {
  if [ -n "${ANDROID_HOME:-}" ]; then
    echo "$ANDROID_HOME"
    return
  fi
  if command -v powershell.exe >/dev/null 2>&1; then
    local win
    win="$(powershell.exe -NoProfile -Command '[Environment]::GetEnvironmentVariable("ANDROID_HOME","User")' 2>/dev/null | tr -d '\r' || true)"
    if [ -n "$win" ]; then
      # Node/Appium on Windows expect a normal path, not MSYS /c/... unless cygpath is used.
      if command -v cygpath >/dev/null 2>&1; then
        cygpath -m "$win"
      else
        echo "$win" | tr '\\' '/'
      fi
      return
    fi
  fi
  echo "C:/Users/IT16/Android"
}

SDK="$(resolve_android_sdk)"
export ANDROID_HOME="$SDK"
export ANDROID_SDK_ROOT="${ANDROID_SDK_ROOT:-$SDK}"
# platform-tools MUST be first — a second adb (e.g. BlueStacks/old ~/bin v36) on PATH
# starts a different daemon and Appium (client 41) will kill it mid-session → device offline.
export PATH="$ANDROID_HOME/platform-tools:$PATH"

ADB_BIN="$ANDROID_HOME/platform-tools/adb"
if [ -x "${ADB_BIN}.exe" ]; then ADB_BIN="${ADB_BIN}.exe"; fi

echo "ANDROID_HOME=$ANDROID_HOME"
echo "ANDROID_SDK_ROOT=$ANDROID_SDK_ROOT"
"$ADB_BIN" version 2>/dev/null | head -1 || true

# Warn if another adb.exe still shadows PATH after our prepend (rare on Windows).
OTHER_ADB="$(command -v adb 2>/dev/null || true)"
if [ -n "$OTHER_ADB" ] && [ -x "$ADB_BIN" ]; then
  case "$OTHER_ADB" in
    *platform-tools*) ;;
    *)
      echo "WARNING: another adb is on PATH: $OTHER_ADB" >&2
      echo "  Appium uses ANDROID_HOME adb, but a mismatched daemon causes 'device offline'." >&2
      echo "  Prefer only: $ADB_BIN" >&2
      ;;
  esac
fi

"$ADB_BIN" start-server >/dev/null 2>&1 || true
"$ADB_BIN" devices 2>/dev/null || true

exec appium --address 127.0.0.1 --port 4723 --relaxed-security --allow-insecure adb_shell "$@"
