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

Gejala operasional. Hardening / bug terbuka (mis. relaunch app setelah cleanup): lihat [mobile.md](mobile.md) dan [features.md](features.md).

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
| App mobile tutup lalu buka lagi setelah job | Cleanup Cursor `createSession` | Lihat [mobile.md](mobile.md) pitfall / ROADMAP P0 |
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
