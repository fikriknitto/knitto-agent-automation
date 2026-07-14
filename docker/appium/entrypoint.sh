#!/bin/sh
set -eu

# Appium's appium-adb invokes `adb -P 5037`, which talks to a *local* adb
# daemon in this container. Do not use ADB_SERVER_SOCKET here — that fights
# with -P and ends up with an empty device list + endless "reconnect offline".
unset ADB_SERVER_SOCKET || true

echo "[appium-entrypoint] Starting local adb server…"
adb start-server

# Reach BlueStacks / emulator ADB ports on the Docker host.
# Override via ADB_CONNECT_TARGETS (comma-separated host:port).
# Backend/host often list UDID as 127.0.0.1:PORT — socat makes the same
# address work inside this container so Appium capabilities match.
TARGETS="${ADB_CONNECT_TARGETS:-host.docker.internal:5555}"
OLD_IFS=$IFS
IFS=,
for target in $TARGETS; do
  target=$(echo "$target" | tr -d '[:space:]')
  [ -n "$target" ] || continue
  host=${target%:*}
  port=${target##*:}
  if [ "$host" = "$port" ] || [ -z "$port" ]; then
    echo "[appium-entrypoint] skip invalid target: $target"
    continue
  fi
  echo "[appium-entrypoint] socat 127.0.0.1:${port} → ${host}:${port}"
  socat TCP-LISTEN:"${port}",bind=127.0.0.1,fork,reuseaddr TCP:"${host}:${port}" &
  sleep 0.3
  echo "[appium-entrypoint] adb connect 127.0.0.1:${port}"
  adb connect "127.0.0.1:${port}" || true
done
IFS=$OLD_IFS

echo "[appium-entrypoint] adb devices:"
adb devices

echo "[appium-entrypoint] Starting Appium…"
exec appium --address 0.0.0.0 --port 4723 --base-path / --relaxed-security --allow-insecure adb_shell
