# Knitto Browser Agent

Aplikasi otomatisasi **browser** dan **Android (mobile)** untuk menjelajahi dan menguji sistem internal Knitto (`knitto.co.id`, CMS lokal, dll.) menggunakan AI agent + Puppeteer / Appium.

Arsitektur **monorepo** (pnpm 11.5.2): React frontend dan Express backend terpisah, berkomunikasi lewat REST + WebSocket. Protokol & tipe dibagi lewat package `@knitto/shared`.

---

## Arsitektur

```
[ Frontend — React + Vite + Tailwind :3000 ]
         │  /api/*  +  /ws (proxy Vite / nginx)
         ▼
[ Backend — Express + WebSocket :3080 ]
    ├── Bridge Gemini   (browser: Puppeteer MCP | mobile: Appium MCP)
    ├── Bridge Cursor   (Cursor SDK + MCP stdio)
    └── Bridge 9Router  (browser: Puppeteer MCP | mobile: Appium MCP)
         ▼
[ Chrome / Chromium ]     [ Android emulator / device via Appium + ADB ]
```

**1 proses backend** menjalankan HTTP API, WebSocket hub, dan semua bridge. Gemini dan 9Router memanggil Puppeteer in-process; Cursor SDK men-spawn subprocess MCP (`mcp-stdio-server.ts`) yang memakai modul browser yang sama.

HTTP server listen **segera** saat startup; inisialisasi bridge (verifikasi API key) berjalan di background agar `/api/`* tersedia tanpa menunggu bridge selesai.

---

## Struktur folder

```
knitto-browser-agent/
├── apps/
│   ├── frontend/              # @knitto/frontend — React + Vite + Tailwind v4
│   │   └── src/
│   │       ├── components/    # Chat, file manager, prompt editor, agent media, …
│   │       └── lib/           # WS client, file-manager API, types
│   └── backend/               # @knitto/backend — Express + Puppeteer
│       └── src/
│           ├── automation/    # Browser tools, MCP, recording
│           ├── mobile-automation/  # Appium tools, MCP, recording
│           ├── controllers/   # REST controllers
│           ├── services/      # Bridge runners, storage, queue
│           ├── websocket/     # WS hub
│           └── server.ts
├── packages/
│   └── shared/                # @knitto/shared — Zod schemas + types (compile → dist/)
├── docker/
│   └── nginx.conf             # Reverse proxy /api + /ws untuk image frontend
├── prompt-shortcuts/          # Template prompt Knitto (.md)
├── scripts/                   # BlueStacks launcher + adb connect (Windows)
│   └── bluestacks/
├── memory/                    # Memori otomatisasi per app (agent)
├── storage/                   # File manager — lampiran prompt (local)
├── screenshoot/               # Bukti agent per job
│   └── agents/{jobId}/        # *.png + recording.mp4 (atau tc-01.mp4, tc-02.mp4, …)
├── Dockerfile                 # Multi-stage build (build / backend / frontend)
├── docker-compose.yml
├── docker.env                 # Env default container backend (browser + mobile MCP)
├── .env.example               # Override secret/port Compose (salin → .env)
├── .nvmrc                     # Node 24.16.0 (nvm / fnm)
├── package.json
└── pnpm-workspace.yaml
```

---



## Prasyarat



### Development lokal

- Node.js **24.16.0** (lihat `.nvmrc` / `.node-version`; `corepack enable` disarankan)
- pnpm **11.5.2** (`corepack prepare pnpm@11.5.2 --activate` — juga diatur di `packageManager` root)
- **ffmpeg** di PATH (`ffmpeg -version`) — wajib untuk rekaman video **browser**; opsional `AUTOMATION_FFMPEG_PATH`
- API key: Gemini dan/atau Cursor (Web UI atau `.env`)
- 9Router opsional (`NINEROUTER_BASE_URL`)



### Docker

- Docker Desktop / Docker Engine **24+**
- Docker Compose v2

---



## Mobile automation (Android)

Prasyarat:

1. **Appium** — jalankan `appium` (default `http://127.0.0.1:4723`, atur `APPIUM_SERVER_URL` jika beda)
2. **ADB** di PATH — emulator/device terhubung (`adb devices`)
3. UiAutomator2 driver terkonfigurasi di Appium



### BlueStacks multi-instance (Windows, opsional)

Launch dan ADB connect dipisah agar instance sempat boot sebelum `adb connect`:

```bash
# Launch N instance pertama dari bluestacks.conf
pnpm start:instances -- emulator=3

# ADB connect ke instance yang baru dilaunch (baca .bluestacks/last-launched.json)
pnpm connect:instances

# Atau sekaligus (default 3 instance):
pnpm instances:up
```

**Windows (.bat)** — double-click atau dari CMD di folder repo:

```bat
scripts\bluestacks\start-bluestacks.bat emulator=3
scripts\bluestacks\connect-adb.bat
scripts\bluestacks\instances-up.bat

scripts\bluestacks\close-bluestacks.bat
scripts\bluestacks\disconnect-adb.bat
scripts\bluestacks\stop-emulator.bat
```

Opsi lain: `pnpm connect:instances -- --all` (semua instance di config), `--only Pie64,Pie64_15`, `--dry-run`.

Env script BlueStacks (opsional): `BLUESTACKS_DATA_DIR`, `BLUESTACKS_INSTALL_DIR`, `BLUESTACKS_CONF_PATH`, `BLUESTACKS_PLAYER_PATH`, `BLUESTACKS_ADB_HOST`, `BLUESTACKS_ADB_CONNECT_DELAY_MS`.

### Di Web UI

1. Toggle **Platform → Mobile** di composer
2. **Device** — daftar live via SSE (`/api/mobile/devices/stream`); pilih Auto (pool) atau UDID. Jika tidak ada device, combobox dan tombol **Send** dinonaktifkan
3. **Package** (wajib) — daftar app terinstall di device yang dipilih
4. Kirim prompt — agent memakai tool `mobile_*` (tap, scroll, snapshot, upload, dll.)

Memory mobile terpisah di `memory/mobile/` (tab Mobile di Settings → Memory).

Rekaman video mobile: Appium `startRecordingScreen` / `stopRecordingScreen` → `screenshoot/agents/{jobId}/recording.mp4` (job tunggal) atau `tc-XX.mp4` (multi-TC).

Env terkait: bagian Mobile di `apps/backend/.env.example` dan tabel env di bawah.

---



## Hybrid multi test case (Browser + Mobile)

Satu prompt dapat menjalankan beberapa **test case** lintas browser dan/atau mobile. Pilih platform composer **Hybrid**.

### Konsep


| Konsep                        | Arti                                                                                                                                        |
| ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| **Test case (TC)**            | Satu unit kerja dengan heading `## Test Case N`. Satu TC = satu video (`tc-01.mp4`, …) + satu blok hasil di UI                              |
| **System prompt / shortcut**  | Template di `prompt-shortcuts/*.md` (label, platform, url/appPackage, variabel `{nama}`)                                                    |
| **Multi-shortcut dalam 1 TC** | Satu TC boleh merujuk beberapa system prompt berurutan (satu video, beberapa langkah)                                                       |
| **Handoff**                   | Data antar TC lewat baris `[HANDOFF] KEY=value` di summary agent TC sebelumnya                                                              |
| **Segment recording**         | Video per TC; state lintas process di `screenshoot/agents/{jobId}/.segment-state.json` (penting untuk Cursor MCP subprocess)                |
| **Close guard**               | Saat multi-TC, agent **tidak** boleh close browser/app/session di tengah jalan; orchestrator menutup semua platform **sekali** di akhir job |
| **Memory**                    | Learning per app di `memory/` (browser) atau `memory/mobile/` — `upsert_section` + `sectionKey` per TC                                      |




### Workflow (alur job)

```text
Composer (Hybrid) + prompt ## Test Case …
        │
        ▼
┌───────────────────────────────┐
│  Parse & resolve TC           │  shortcuts, Platform/App/Url, variabel
│  markJobSegmentManaged        │
└───────────────┬───────────────┘
                │
     untuk setiap TC (berurutan):
                │
                ├─ startSegmentRecording (pending → file state)
                ├─ inject handoff + system prompt(s) ke agent
                ├─ agent jalan (browser MCP / mobile MCP)
                │     └─ navigate / launch → start segment video (tc-XX.mp4)
                ├─ stopSegmentRecording (Cursor: stop via MCP + file poller)
                ├─ kumpulkan screenshot/videoUrl ke testCaseResults
                └─ extract [HANDOFF] dari summary → state untuk TC berikutnya
                │
                ▼
┌───────────────────────────────┐
│  clearJobSegmentManaged       │
│  cleanupJobPlatforms          │  close browser + mobile app/session
│  (FORCE_CLOSE untuk Cursor)   │
└───────────────────────────────┘
```

**Cursor vs Gemini/9Router**

- **Cursor:** browser/mobile jalan di MCP subprocess terpisah → pending segment & stop/close harus lewat **file state** + tool MCP (bukan hanya memory process backend).
- **Gemini / 9Router:** MCP in-process → segment & close di process yang sama.



### Aturan format prompt

- Maksimal **5** test case per prompt; maksimal **5** system prompt per TC
- **1 TC = 1 video** → `screenshoot/agents/{jobId}/tc-01.mp4`, `tc-02.mp4`, …
- **1 TC = 1 blok RESULT** di UI (`testCaseResults[]`: summary, screenshot, video)
- Browser/app/session **tetap hidup** selama job; close hanya di akhir (success / error / cancel)
- Screenshot multi-TC: prefix `tc-01-*.png`, …
- Platform resolve: baris `Platform:` → metadata shortcut → infer URL → default `browser`
- TC mobile wajib `appPackage` (shortcut, `App:` di TC, atau fallback package di composer)



### Contoh prompt

**Multi TC + handoff + multi-shortcut dalam satu TC:**

```markdown
## Test Case 1
Ikuti system prompt "Take Order - Login" lalu system prompt "Take Order".
```

ip_address=192.168.21.35
username=main
password=11221122
cabang=Holis
order_dari=TOKO
cari_customer=28886351120

```
Setelah order selesai, tulis di summary:
[HANDOFF] NO_ORDER=<nomor_order>

## Test Case 2
Ikuti system prompt "Portal - Cek Status Order".
Pakai NO_ORDER dari handoff (jangan default OHXXX).

## Test Case 3
Platform: mobile
App: com.baseapprn.development

Uji Text Input dengan variabel:
```

small=hello
medium=world

```

```

**Referensi shortcut**


| Cara                | Contoh                                     |
| ------------------- | ------------------------------------------ |
| Label               | `system prompt "Take Order - Login"`       |
| ID file             | `shortcut:login-take-order`                |
| Beberapa dalam 1 TC | `system prompt "A" lalu system prompt "B"` |


**Variabel:** `{nama}` di template shortcut; isi di TC dengan `key=value` (boleh dalam code fence). Shared untuk semua shortcut dalam TC yang sama.

**Override opsional per TC:** `Platform: browser|mobile`, `App: <package>`, `Url: <url>`

### Handoff antar TC

1. TC penghasil menulis di summary (wajib format ketat):
  ```text
   [HANDOFF] NO_ORDER=OH12345
  ```
2. Orchestrator extract & merge ke state
3. TC berikutnya mendapat blok di prompt:
  ```text
   Handoff dari test case sebelumnya:
   - NO_ORDER = OH12345
  ```
4. Agent TC penerima memakai nilai handoff (bukan menebak)

Value handoff = token tanpa spasi. Key bebas (`NO_ORDER`, `ORDER_NO`, …) — TC berikutnya harus memakai **key yang sama**.

### Video per TC (segment recording)


| Aspek                  | Perilaku                                                     |
| ---------------------- | ------------------------------------------------------------ |
| Start                  | Ditunda sampai page navigasi (browser) / app launch (mobile) |
| File                   | `tc-01.mp4`, `tc-02.mp4`, … (bukan hanya `recording.mp4`)    |
| Cross-process (Cursor) | State di `.segment-state.json`; stop lewat MCP tool + poller |
| UI                     | Player per TC di stack hasil jika `videoUrl` ada             |


Job tunggal (bukan hybrid multi-TC) tetap bisa memakai `recording.mp4` satu file.

### Close platform di akhir job

- Di tengah multi-TC, tool `automation_close_browser` / `mobile_close_app` / `mobile_close_session` **diblokir** (env `AUTOMATION_MULTI_TC` / `MOBILE_MULTI_TC` atau flag segment-managed).
- Setelah semua TC selesai, cleanup memanggil close dengan `FORCE_CLOSE` agar guard tidak menolak tutup yang disengaja orchestrator.

Detail arsitektur lebih dalam: `docs/CHECKPOINT-hybrid-multi-platform.md`

---



## Instalasi & menjalankan (development)

```bash
corepack enable
corepack prepare pnpm@11.5.2 --activate
pnpm install
cp apps/backend/.env.example apps/backend/.env
cp apps/frontend/.env.example apps/frontend/.env
pnpm dev
```


| Layanan     | URL                                                                  |
| ----------- | -------------------------------------------------------------------- |
| Web UI      | [http://localhost:3000](http://localhost:3000)                       |
| Backend API | [http://localhost:3080/api/health](http://localhost:3080/api/health) |
| WebSocket   | ws://localhost:3000/ws (proxy Vite)                                  |


> **Port backend & frontend harus selaras:** `BACKEND_PORT` di `apps/backend/.env` harus sama dengan `VITE_BACKEND_PORT` dan `VITE_WS_PORT` di `apps/frontend/.env`. Jika backend gagal start (`EADDRINUSE`), hentikan proses lama di port tersebut lalu jalankan ulang `pnpm dev`.

Jalankan terpisah:

```bash
pnpm dev:frontend   # hanya Vite
pnpm dev:backend    # hanya backend (tsx watch)
```

**Production lokal:**

```bash
pnpm build          # shared → backend → frontend
pnpm start          # backend production (node dist/server.js)
pnpm preview        # preview UI dari apps/frontend/dist
```

Serve UI dari `apps/frontend/dist` lewat reverse proxy ke backend, atau deploy static + API terpisah.

---



## Docker (production)

Stack production siap pakai dengan **multi-stage build** — image terpisah untuk backend (Node + Chromium + ADB) dan frontend (nginx).

### Prasyarat

- Docker Desktop / Engine **24+** + Compose v2 (daemon harus running)
- Untuk **mobile / hybrid**: Appium di host (`http://localhost:4723`) + ADB server yang listen ke jaringan Docker (lihat di bawah)

### Menjalankan

```bash
# Opsional: secret & port
cp .env.example .env
# edit GEMINI_API_KEY / CURSOR_API_KEY / NINEROUTER_API_KEY

docker compose up -d --build
```

| Layanan     | URL                                                                  | Image                                  |
| ----------- | -------------------------------------------------------------------- | -------------------------------------- |
| Web UI      | [http://localhost:3000](http://localhost:3000)                       | nginx + static Vite build              |
| Backend API | [http://localhost:3080/api/health](http://localhost:3080/api/health) | Node 24.16.0 + Chromium + ffmpeg + adb |

Di panel Connection Web UI, host/port default **`localhost:3080`** (backend dipublish). REST `/api` dari UI memakai same-origin lewat nginx di port 3000.

### Mobile / hybrid dari Docker

Container **tidak** menjalankan Appium atau emulator. Ia menghubungi host:

1. Jalankan Appium di host (port **4723**).
2. Pastikan `adb devices` di host melihat emulator/device.
3. Expose ADB server ke Docker (satu kali per boot host):

```bash
adb kill-server
adb -a nodaemon server start
```

4. `docker.env` sudah mengarahkan:

- `APPIUM_SERVER_URL=http://host.docker.internal:4723`
- `ADB_SERVER_SOCKET=tcp:host.docker.internal:5037`
- `MOBILE_MCP_PATH=apps/backend/dist/mobile-automation/mcp-stdio-server.js`

Tanpa langkah ADB `-a`, daftar device di UI Docker biasanya kosong.

### Stage build (`Dockerfile`)

| Stage          | Fungsi                                                   |
| -------------- | -------------------------------------------------------- |
| `build`        | Install deps + compile (`pnpm build:*`) — tanpa Chromium |
| `backend-deps` | Hanya production deps backend (tanpa paket frontend)     |
| `browser-base` | Chromium + ffmpeg + `android-tools-adb`                  |
| `backend`      | Runtime API + automation (health: `/api/health`)         |
| `frontend`     | nginx (`docker/nginx.conf`) + `apps/frontend/dist`       |

### Konfigurasi

- **`docker.env`** — env default backend di container (headless, MCP compiled, Appium/ADB host gateway, dll.)
- **`.env` di root** (dari `.env.example`) — override secret & port untuk Compose:

```env
GEMINI_API_KEY=your-key
CURSOR_API_KEY=your-key
NINEROUTER_API_KEY=your-key
FRONTEND_PORT=3000
BACKEND_PORT=3080
```

### Volume persisten

| Volume / mount       | Path container          | Isi                               |
| -------------------- | ----------------------- | --------------------------------- |
| `knitto-storage`     | `/app/storage`          | Lampiran file manager             |
| `knitto-screenshoot` | `/app/screenshoot`      | Screenshot & video agent          |
| `knitto-memory`      | `/app/memory`           | Memori otomatisasi per app        |
| `./prompt-shortcuts` | `/app/prompt-shortcuts` | Template prompt (bind mount host) |

### Catatan Docker

- Browser **tidak muncul di layar host** — container headless; pantau lewat screenshot/video di Web UI.
- `NINEROUTER_BASE_URL` / `APPIUM_SERVER_URL` memakai `host.docker.internal` agar container menjangkau layanan di host.
- `shm_size: 1gb` untuk stabilitas Chromium.
- Frontend mem-proxy `/api` dan `/ws` ke service `backend`.

Perintah berguna:

```bash
docker compose ps
docker compose logs -f backend
docker compose down
docker compose down -v   # hapus volume (data storage/screenshoot/memory)
```

---



## Environment variables

Salin `apps/backend/.env.example` → `apps/backend/.env`. Hanya variabel di bawah yang perlu dikonfigurasi; sisanya memakai default di kode.

### Backend (`apps/backend/.env`)


| Variabel                                    | Deskripsi                                             | Default                  |
| ------------------------------------------- | ----------------------------------------------------- | ------------------------ |
| `BACKEND_HOST`                              | Bind host HTTP + WS                                   | `0.0.0.0`                |
| `BACKEND_PORT`                              | Port HTTP + WebSocket                                 | `3080`                   |
| `GEMINI_API_KEY`                            | API key Gemini                                        | —                        |
| `CURSOR_API_KEY`                            | API key Cursor                                        | —                        |
| `KNITTO_BRIDGE_MODEL`                       | Model default Gemini / Cursor                         | `gemini-2.5-flash`       |
| `KNITTO_BRIDGE_MAX_CONCURRENT`              | Job paralel per channel                               | `1`                      |
| `KNITTO_BRIDGE_JOB_TIMEOUT_MS`              | Timeout job (ms)                                      | `600000`                 |
| `KNITTO_BRIDGE_MAX_TOOL_CALLS`              | Maks. tool call per job                               | `40`                     |
| `AUTOMATION_HEADLESS`                       | `true` = headless, `false` = browser terlihat (lokal) | `false`                  |
| `AUTOMATION_VIEWPORT_WIDTH` / `HEIGHT`      | Ukuran viewport                                       | `1366` / `768`           |
| `AUTOMATION_RECORD_VIDEO`                   | Rekam sesi per job sebagai MP4                        | `true`                   |
| `AUTOMATION_RECORD_FPS`                     | Frame rate rekaman                                    | `20`                     |
| `AUTOMATION_FFMPEG_PATH`                    | Path eksplisit ffmpeg (opsional)                      | PATH sistem              |
| `STORAGE_ROOT`                              | Root file manager                                     | `./storage`              |
| `STORAGE_MAX_UPLOAD_BYTES`                  | Batas ukuran upload                                   | `52428800`               |
| `NINEROUTER_BASE_URL`                       | Base URL 9Router                                      | `http://localhost:20128` |
| `NINEROUTER_API_KEY`                        | API key 9Router                                       | —                        |
| `NINEROUTER_MODEL`                          | Model default 9Router                                 | `KNITTO_BRIDGE_MODEL`    |
| `NINEROUTER_MAX_RETRIES` / `RETRY_DELAY_MS` | Retry rate-limit                                      | `5` / `2000`             |
| `KNITTO_MCP_LOG_LEVEL`                      | Log backend & automation                              | `info`                   |


Path otomatis (tanpa env): `memory/`, `screenshoot/`, entry MCP stdio di `apps/backend/src/automation/mcp-stdio-server.ts`.

Override lanjutan (jarang dipakai): `KNITTO_BRIDGE_CWD`, `AUTOMATION_MCP_COMMAND`, `AUTOMATION_MCP_PATH`, `AUTOMATION_MEMORY_DIR`, `AUTOMATION_SCREENSHOT_DIR`, `AUTOMATION_SLOW_MO_MS`, `AUTOMATION_BROWSER_TIMEOUT_MS`, `AUTOMATION_UPLOAD_DIR`, `AUTOMATION_UPLOAD_MAX_BYTES`, `AUTOMATION_VIDEO_FILENAME`.

#### Mobile / Appium


| Variabel                           | Deskripsi                                | Default                  |
| ---------------------------------- | ---------------------------------------- | ------------------------ |
| `APPIUM_SERVER_URL`                | URL server Appium                        | `http://127.0.0.1:4723`  |
| `MOBILE_UDID`                      | UDID default (opsional)                  | —                        |
| `MOBILE_DEVICE_UDIDS`              | Daftar UDID pool (koma)                  | semua dari `adb devices` |
| `MOBILE_DEVICE_POOL_ENABLED`       | Pool device idle/busy                    | `true`                   |
| `MOBILE_DEVICE_ACQUIRE_TIMEOUT_MS` | Timeout acquire device                   | `60000`                  |
| `MOBILE_IMPLICIT_WAIT_MS`          | Implicit wait Appium                     | `5000`                   |
| `MOBILE_SNAPSHOT_MAX_ELEMENTS`     | Maks elemen di snapshot UI               | `200`                    |
| `MOBILE_RECORD_VIDEO`              | Rekam layar per job (Appium)             | `true`                   |
| `MOBILE_RECORD_TIME_LIMIT_SEC`     | Batas durasi rekaman (detik)             | `600`                    |
| `MOBILE_RECORD_FPS`                | FPS rekaman mobile                       | `20`                     |
| `MOBILE_RECORD_BIT_RATE`           | Bitrate rekaman (bps)                    | `4000000`                |
| `MOBILE_VIDEO_FILENAME`            | Nama file video                          | `recording.mp4`          |
| `MOBILE_DEVICES_POLL_MS`           | Interval polling `adb devices` untuk SSE | `3000`                   |
| `MOBILE_PACKAGES_CACHE_TTL_MS`     | TTL cache `pm list packages`             | `60000`                  |
| `MOBILE_MEMORY_DIR`                | Memori mobile per app                    | `memory/mobile`          |
| `MOBILE_UPLOAD_DIR`                | Upload file ke device                    | `storage/mobile-uploads` |
| `MOBILE_UPLOAD_MAX_BYTES`          | Batas ukuran upload mobile               | `52428800`               |


**Khusus Docker** (`docker.env`): `AUTOMATION_MCP_COMMAND=node`, `AUTOMATION_MCP_PATH=apps/backend/dist/automation/mcp-stdio-server.js`, `MOBILE_MCP_PATH=apps/backend/dist/mobile-automation/mcp-stdio-server.js`, `PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium`, `APPIUM_SERVER_URL` / `ADB_SERVER_SOCKET` → `host.docker.internal`.

### Frontend (`apps/frontend/.env`)


| Variabel               | Deskripsi                   | Default              |
| ---------------------- | --------------------------- | -------------------- |
| `VITE_DEV_PORT`        | Port Vite dev server        | `3000`               |
| `VITE_BACKEND_HOST`    | Host backend (proxy `/api`) | `localhost`          |
| `VITE_BACKEND_PORT`    | Port backend (proxy)        | `3080`               |
| `VITE_WS_HOST`         | Default host panel koneksi  | `localhost`          |
| `VITE_WS_PORT`         | Default port panel koneksi  | `3080`               |
| `VITE_DEFAULT_CHANNEL` | Channel WebSocket default   | `automation-default` |


> Di production Docker, WebSocket otomatis memakai same-origin via nginx — nilai `VITE_WS_*` tidak dipakai di browser.

---



## REST API


| Method   | Path                                               | Fungsi                                   |
| -------- | -------------------------------------------------- | ---------------------------------------- |
| `GET`    | `/api/health`                                      | Health check                             |
| `GET`    | `/api/bridges`                                     | Daftar bridge + model                    |
| `GET`    | `/api/shortcuts`                                   | Prompt shortcuts                         |
| `GET`    | `/api/config/public`                               | Konfigurasi publik                       |
| `GET`    | `/api/file-manager/entries`                        | List folder/file (`?path=`)              |
| `GET`    | `/api/file-manager/files/serve`                    | Serve file (preview gambar)              |
| `GET`    | `/api/file-manager/files/content`                  | Konten file (base64)                     |
| `POST`   | `/api/file-manager/upload`                         | Upload file                              |
| `POST`   | `/api/file-manager/folders`                        | Buat folder                              |
| `PATCH`  | `/api/file-manager/entries`                        | Ubah nama file/folder (`{ path, name }`) |
| `DELETE` | `/api/file-manager/entries`                        | Hapus file/folder (`{ path }`)           |
| `GET`    | `/api/agent-screenshots/:jobId/:filename`          | Screenshot bukti agent                   |
| `GET`    | `/api/agent-videos/:jobId/:filename`               | Rekaman video sesi agent (MP4)           |
| `GET`    | `/api/mobile/devices`                              | Daftar device Android (snapshot)         |
| `GET`    | `/api/mobile/devices/stream`                       | SSE update daftar device                 |
| `GET`    | `/api/mobile/devices/:udid/packages`               | Daftar package terinstall                |
| `GET`    | `/api/mobile/devices/:udid/packages/:pkg/activity` | Resolve launcher activity                |


WebSocket: `ws://<host>:<port>/ws` — job progress (`agent_job` dengan `screenshots`, `videoUrl`), bridge status, credentials request.

---



## Penggunaan Web UI

1. Buka [http://localhost:3000](http://localhost:3000)
2. Panel kiri: set **host / port / channel**, klik **Connect**
3. Isi **Bridge credentials** (Gemini / Cursor / 9Router) dan simpan
4. Pilih **bridge + model**, platform **Browser**, **Mobile**, atau **Hybrid** (multi-TC), tulis prompt di editor TipTap atau pakai **Knitto Shortcuts**
5. Lampirkan file: upload, paste gambar, atau modal **Storage** (`storage/`)
6. Kirim prompt — pantau chat, progress, screenshot, dan **video** di hasil job (multi-TC: video per test case di stack hasil)
7. Ringkasan agent dalam **Bahasa Indonesia**; respons agent mendukung **Markdown** (termasuk tabel GFM)

Layout: sidebar koneksi + credentials; area utama chat + shortcuts.

---



## Bukti agent (screenshot & video)


| Aspek                   | Browser                                                     | Mobile                      |
| ----------------------- | ----------------------------------------------------------- | --------------------------- |
| Screenshot              | PNG per tool / akhir job                                    | PNG via tool mobile         |
| Video (job tunggal)     | `puppeteer-screen-recorder` + **ffmpeg** → `recording.mp4`  | Appium → `recording.mp4`    |
| Video (hybrid multi-TC) | Segment per TC → `tc-01.mp4`, `tc-02.mp4`, …                | Sama (Appium segment)       |
| Path                    | `screenshoot/agents/{jobId}/`                               | sama                        |
| WS payload              | `screenshots[]`, `videoUrls` / `testCaseResults[].videoUrl` | sama                        |
| Matikan video           | `AUTOMATION_RECORD_VIDEO=false`                             | `MOBILE_RECORD_VIDEO=false` |


UI menampilkan `<video controls>` di chat (atau per TC); retry otomatis jika file belum siap.

Job panjang (timeout default 10 menit) dapat menghasilkan file video besar.

---



## File manager & lampiran

- Penyimpanan lokal di `storage/` (via `STORAGE_ROOT`)
- Modal **Storage**: grid/list, upload, folder baru, drag & drop, search & sort
- **Ubah nama / hapus**: hover item (ikon pensil & hapus) atau klik kanan → toolbar **Ubah nama** / **Hapus**
- Thumbnail gambar di grid/list dan chip lampiran prompt
- Maksimal **4 lampiran** per prompt; path relatif dikirim ke agent (`automation_upload_file`)

---



## Scripts (monorepo)


| Command                     | Fungsi                                                  |
| --------------------------- | ------------------------------------------------------- |
| `pnpm dev`                  | Frontend + backend bersamaan                            |
| `pnpm dev:frontend`         | Frontend saja (Vite)                                    |
| `pnpm dev:backend`          | Backend saja (tsx watch)                                |
| `pnpm build`                | Build shared → backend → frontend                       |
| `pnpm build:shared`         | Compile `@knitto/shared` ke `packages/shared/dist/`     |
| `pnpm build:backend`        | Compile backend ke `apps/backend/dist/`                 |
| `pnpm build:frontend`       | Build Vite ke `apps/frontend/dist/`                     |
| `pnpm typecheck`            | Typecheck semua workspace                               |
| `pnpm start`                | Backend production                                      |
| `pnpm preview`              | Preview build frontend (Vite)                           |
| `pnpm clean`                | Hapus folder `dist/` di workspace                       |
| `pnpm start:instances`      | Launch BlueStacks instances (tanpa adb connect)         |
| `pnpm connect:instances`    | `adb connect` ke instance yang dilaunch / `--all`       |
| `pnpm close:instances`      | Tutup instance BlueStacks (quit / taskkill)             |
| `pnpm disconnect:instances` | `adb disconnect` dari instance                          |
| `pnpm instances:up`         | `start:instances --emulator=3` lalu `connect:instances` |
| `pnpm instances:down`       | `close:instances` lalu `disconnect:instances`           |


---



## Semantic locator (penulisan prompt)

Agent memakai semantic locator, bukan CSS selector:

- **Ref snapshot**: `e12` dari `automation_get_page_snapshot`
- **Role + name**: `role="button"`, `name="Simpan"`
- **Label / placeholder / text**: teks yang terlihat di halaman

Lihat `memory/` untuk pola navigasi CMS Knitto dan `prompt-shortcuts/` untuk template prompt.

---



## Troubleshooting


| Gejala                                                    | Penyebab umum                                                                            | Solusi                                                                                                                                   |
| --------------------------------------------------------- | ---------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `ECONNREFUSED` pada `/api/*` saat `pnpm dev`              | Backend belum listen atau port salah                                                     | Pastikan log `Backend listening on…`; samakan port di kedua `.env`                                                                       |
| `PATCH`/`DELETE` file-manager **404**                     | Proses backend lama tanpa route baru                                                     | Hentikan proses di `BACKEND_PORT`, restart `pnpm dev`; atau `pnpm build:backend` untuk production                                        |
| Video tidak muncul, refresh baru ada                      | ffmpeg masih menulis MP4                                                                 | Sudah ditangani retry UI + tunggu file di backend; restart backend jika versi lama                                                       |
| Video browser **hitam penuh** (Windows)                   | `AUTOMATION_HEADLESS=true` + `puppeteer-screen-recorder` sering menghasilkan frame hitam | Set `AUTOMATION_HEADLESS=false` untuk rekaman yang terlihat; pastikan browser sudah navigasi sebelum segment start                       |
| Video TC kosong / tidak ada file                          | Segment recording gagal start (browser/app belum siap) atau split-process Cursor         | Cek log `segment-recording`; pastikan navigate/launch terjadi; cek `.segment-state.json` di folder job                                   |
| Video corrupt / tidak bisa diputar                        | `AUTOMATION_FFMPEG_PATH` salah atau ffmpeg tidak di PATH                                 | `ffmpeg -version`; set `AUTOMATION_FFMPEG_PATH` ke binary yang benar                                                                     |
| File MP4 sangat kecil (<10 KB)                            | Rekaman gagal atau hanya frame hitam                                                     | Lihat warning di log backend; ulangi dengan headless=false (browser) atau pastikan activity app sudah visible (mobile)                   |
| Platform (browser/app) tetap terbuka setelah job multi-TC | Close guard menolak cleanup (versi lama) atau FORCE_CLOSE belum aktif                    | Restart backend terbaru; cek log `test-case-cleanup` / `cursor-mcp-tool-runner` — close harus `ok`, bukan "Multi-TC job — orchestrator…" |
| Dropdown pilih opsi salah (mis. TOKO → TOKOPEDIA)         | Partial/contains match / fill+Enter tanpa exact                                          | Perjelas di shortcut TC: wajib exact option; verifikasi field setelah pilih                                                              |
| `EADDRINUSE`                                              | Port backend sudah dipakai                                                               | `netstat` / `taskkill` proses di port tersebut                                                                                           |
| Docker: `backend unhealthy`                               | Build lama / env salah                                                                   | `docker compose up -d --build`; cek `docker compose logs backend`                                                                        |
| Docker: Chromium tidak terlihat                           | Container tanpa display GUI                                                              | Normal — pantau lewat screenshot/video di UI                                                                                             |
| Docker: device mobile kosong                              | ADB server host hanya localhost                                                          | `adb kill-server && adb -a nodaemon server start`                                                                                        |
| Docker: Appium error                                      | URL salah dari container                                                                 | Pastikan Appium di host:4723; `APPIUM_SERVER_URL=http://host.docker.internal:4723`                                                       |
| Docker: 9Router tidak terjangkau                          | URL salah dari dalam container                                                           | Pakai `host.docker.internal` (sudah di `docker.env`) atau sesuaikan `NINEROUTER_BASE_URL`                                                |
| `docker compose` gagal build pnpm                         | Node/pnpm tidak selaras                                                                  | Pakai Node **24.16.0** + pnpm **11.5.2** (sama dengan image Docker & `package.json` engines)                                             |
| Mobile: tidak ada device di UI                            | ADB kosong / belum connect                                                               | `adb devices`; untuk BlueStacks: `pnpm connect:instances` setelah launch                                                                 |
| Mobile: Send disabled                                     | Package belum dipilih atau device kosong                                                 | Pilih package; hubungkan emulator/USB                                                                                                    |
| Mobile: Appium error                                      | Server tidak jalan                                                                       | `appium` di host; cek `APPIUM_SERVER_URL`                                                                                                |
| Mobile: request lambat (banyak tab)                       | Polling ADB berlebihan                                                                   | Naikkan `MOBILE_DEVICES_POLL_MS`; pastikan satu SSE per tab (sudah dioptimasi)                                                           |


