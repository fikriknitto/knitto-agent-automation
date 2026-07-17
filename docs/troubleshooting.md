# Gejala & Solusi

---

## Pendahuluan

Katalog masalah umum saat development lokal dan Docker untuk Knitto Agent Automation.

---

## Tujuan Dokumen

- Mempercepat diagnosis QA/dev
- Menghindari duplikasi tabel panjang di README

---

## Ruang Lingkup

Gejala operasional. Jika app mobile masih relaunch setelah job: pastikan backend memuat patch cleanup `FORCE_CLOSE` + `MULTI_TC` (lihat [mcp.md](mcp.md) / [mobile.md](mobile.md)).

---

## Tabel

| Gejala | Penyebab umum | Solusi |
|--------|---------------|--------|
| `ECONNREFUSED` pada `/api/*` saat `pnpm dev` | Backend belum listen / port salah | Samakan port di `apps/backend` & `apps/frontend` `.env` |
| `PATCH`/`DELETE` file-manager **404** | Proses backend lama | Restart backend / `pnpm build:backend` |
| Video tidak muncul, refresh baru ada | ffmpeg masih menulis | Retry UI; restart backend jika versi lama |
| Video browser hitam penuh (Windows) | `AUTOMATION_HEADLESS=true` | Set `false`; pastikan navigate sebelum segment |
| Video TC kosong | Segment gagal / Cursor split-process | Cek log segment; `.segment-state.json`; navigate/launch dulu |
| Video corrupt | ffmpeg path salah | `ffmpeg -version`; set `AUTOMATION_FFMPEG_PATH` |
| MP4 &lt; 10 KB | Rekaman gagal / frame hitam | headless=false atau pastikan activity visible |
| Platform tetap terbuka setelah multi-TC | Close guard / FORCE_CLOSE | Restart backend terbaru; cek log `test-case-cleanup` |
| App mobile tutup lalu buka lagi setelah job | Cleanup Cursor early `createSession` (versi lama) | Restart backend terbaru (MULTI_TC + FORCE_CLOSE di cleanup spawn); cek log `skip early createSession` |
| Dropdown opsi salah | Partial match | Perjelas exact option di shortcut |
| `EADDRINUSE` | Port terpakai | Kill proses di `BACKEND_PORT` |
| Docker: `backend unhealthy` | Build/env | `docker compose up -d --build`; `logs backend` |
| Docker: Chromium tak terlihat | Headless container | Normal — pakai screenshot/video UI |
| Docker: Appium error | Port / targets | `logs appium`; `curl :4723/status`; matikan Appium host |
| Docker: device UI kosong, Appium OK | ADB hanya localhost | `adb -a nodaemon server start`; cek `ADB_SERVER_SOCKET` |
| Docker: 9Router unreachable | URL dari container | `host.docker.internal` di `NINEROUTER_BASE_URL` |
| Compose build pnpm gagal | Node/pnpm mismatch | Node **24.16.0** + pnpm **11.5.2** |
| Mobile: tidak ada device di UI | ADB kosong | `adb devices`; `pnpm connect:instances` |
| Mobile: Send disabled | Package/device kosong | Pilih package; hubungkan device |
| Mobile: Appium error (lokal) | Server / `ANDROID_HOME` | Appium global + `ANDROID_HOME`; atau `pnpm docker:appium` |
| Mobile: request lambat banyak tab | Poll ADB | Naikkan `MOBILE_DEVICES_POLL_MS` |
| Mobile: device "device" di `adb devices` tapi semua `adb shell` gagal (`error: closed`) | Setting **Android Debug Bridge** di dalam Android BlueStacks ter-reset (sering setelah update BlueStacks) | Buka Settings di dalam Android BlueStacks → Advanced/Developer options → aktifkan lagi **Android Debug Bridge**; restart adb server tidak cukup |
| Mobile: `mobile_launch_app`/tool lain gagal dengan pesan "instrumentation process is not running" atau UiAutomator2 crash di tengah sesi | UiAutomator2 crash — umum di BlueStacks, jarang di AVD/device fisik | Sejak backend versi terbaru: auto-recovery sekali (lihat log `[WARN][mobile-session] Instrumentation crash detected`); kalau masih gagal, pertimbangkan AVD/device fisik dibanding BlueStacks |
| Job mobile via Cursor selesai dengan hasil "MCP server `mobile` tidak ada" / "autentikasi (`mcp_auth`) ditolak" | **Bukan** masalah kredensial/config MCP — biasanya device/ADB putus di tengah run (cek `adb devices` selama job jalan) | Pastikan device tetap online & responsif sepanjang job; cek `docs/mobile.md` untuk health check device pool |
| Backend/frontend/BlueStacks mati mendadak tanpa error di log saat job mobile mulai jalan | RAM habis (OOM) — kombinasi BlueStacks + Appium + dev stack + Cursor SDK job cukup berat, ~4GB+ free RAM disarankan | Cek `Get-CimInstance Win32_OperatingSystem` (PowerShell) untuk free RAM sebelum test; tutup app lain yang tidak perlu |
