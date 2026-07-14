# Otomasi Mobile (Android)

---

## Pendahuluan

Dokumen ini menjelaskan otomasi **Android** via Appium UiAutomator2, WebdriverIO client di backend, ADB device pool, dan rekaman layar.

---

## Tujuan Dokumen

- Menjelaskan session Appium dan capabilities
- Memisahkan jalur ADB untuk UI vs Appium (terutama Docker)
- Acuan menambah tool `mobile_*`

---

## Ruang Lingkup

Mencakup: capabilities, session, device pool, tools, recording, host vs Docker Appium.

Tidak mencakup Compose detail (`docker.md`) atau hybrid (`hybrid.md`).

---

## 1. Komponen

| Komponen | Path |
|----------|------|
| Session / caps | `mobile-automation/libs/driver/` |
| Tools | `mobile-automation/libs/tools/` |
| Cleanup ADB/state | `mobile-session-cleanup.ts` |
| MCP stdio | `mobile-automation/mcp-stdio-server.ts` |

---

## 2. Capabilities ringkas

Dari `buildAndroidCapabilities`:

- `platformName: Android`, `automationName: UiAutomator2`
- `appPackage` (+ opsional `appActivity`)
- `noReset: true`, `autoGrantPermissions: true`
- `udid` dari pool / config

**Catatan:** membuat session Appium dengan `appPackage` biasanya **meluncurkan app** (autoLaunch default).

---

## 3. Host setup

Appium **tidak** di-bundle di monorepo. Di host:

```bash
npm i -g appium@3.1.0
appium driver install uiautomator2@4.2.3
# set ANDROID_HOME
appium --address 127.0.0.1 --port 4723 --relaxed-security --allow-insecure adb_shell
```

Backend: `APPIUM_SERVER_URL=http://127.0.0.1:4723`.

BlueStacks (Windows): `pnpm instances:up` / scripts di `scripts/bluestacks/`.

---

## 4. Device pool & UI

- `GET /api/mobile/devices` + SSE `/stream`
- Package list per UDID
- Pool acquire/release per `jobId`

---

## 5. Tools utama

Daftar lengkap terdaftar di MCP: [mcp.md §3](mcp.md#3-mobile-mcp--tools-terdaftar).

Ringkas: `mobile_launch_app`, snapshot, tap, scroll, input, screenshot, upload, assert, wait, memory, `mobile_close_app` (terminateApp), `mobile_close_session` (deleteSession + release).

Urutan single-TC: **close_app → close_session**.

---

## 6. Recording

Appium `startRecordingScreen` / `stopRecordingScreen` → `recording.mp4` atau segment `tc-XX.mp4`.

Flag: `MOBILE_RECORD_VIDEO` (default true).

---

## 7. Cleanup Cursor (tanpa relaunch)

End-of-job cleanup spawn MCP dengan `FORCE_CLOSE=1` **dan** `MOBILE_MULTI_TC=1` agar close guard terbuka tetapi **early `createSession` di-skip**. App di-force-stop lewat state/ADB tanpa membuat session Appium baru yang akan me-launch `appPackage` lagi.

Detail: [mcp.md](mcp.md) § Cursor stdio.
