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

HTTP server listen **segera** saat startup; inisialisasi bridge (verifikasi API key) berjalan di background agar `/api/*` tersedia tanpa menunggu bridge selesai.

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
├── docker.env                 # Env default container backend
├── .nvmrc                     # Node 24.16.0 (nvm / fnm)
├── package.json
└── pnpm-workspace.yaml
```

---

## Prasyarat

### Development lokal

- Node.js **24.16.0** (lihat `.nvmrc` / `.node-version`; `corepack enable` disarankan)
- pnpm **11.5.2** (`corepack prepare pnpm@11.5.2 --activate` — juga diatur di `packageManager` root)
- **ffmpeg** di PATH (`ffmpeg -version`) — wajib untuk rekaman video **browser**; opsional `AUTOMATION_FFMPEG_PATH` (mobile tidak memakai ffmpeg)
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

Rekaman video mobile: Appium `startRecordingScreen` / `stopRecordingScreen` → `screenshoot/agents/{jobId}/recording.mp4` (bukan ffmpeg).

Env terkait: bagian Mobile di `apps/backend/.env.example` dan tabel env di bawah.

---

## Hybrid multi test case (Browser + Mobile)

Satu prompt dapat menjalankan beberapa **test case** lintas browser dan/atau mobile.

### Aturan

- **1 test case = 1 video** → `screenshoot/agents/{jobId}/tc-01.mp4`, `tc-02.mp4`, …
- **1 test case = 1 blok RESULT** di UI — ringkasan, screenshot, dan video dikelompokkan per TC (`testCaseResults[]`)
- Browser/app/session tetap hidup selama job; orchestrator **menutup semua platform sekali** setelah semua TC selesai (success, error, atau cancel)
- Screenshot multi-TC memakai prefix `tc-01-*.png` agar mudah dipetakan ke TC
- Platform composer: **Hybrid**
- Format prompt naratif (disarankan):

```markdown
## Test Case 1
Ikuti system prompt "Take Order - Login".

## Test Case 2
Ikuti system prompt "Order pesanan".
produk=produk A
qty=1
Wajib: [HANDOFF] NO_ORDER=<nomor>

## Test Case 3
Buka https://portal.example.com/status dan cari NO_ORDER dari handoff.
```

- **System prompt** = file di `prompt-shortcuts/` (metadata: `platform`, `url`, `appPackage`)
- Referensi TC: `system prompt "Label"` atau `shortcut:kebab-id`
- Variabel: `{nama}` di template shortcut; inisialisasi di TC dengan `key=value`
- Platform resolve: `Platform:` eksplisit → metadata shortcut → infer URL → default `browser`
- TC mobile wajib punya `appPackage` (dari shortcut, `App:` di TC, atau fallback composer)
- Override eksplisit (opsional): `Platform:`, `App:`, `Url:`
- Handoff antar TC: `[HANDOFF] KEY=value` di output agent
- Memory: `upsert_section` + `sectionKey` (bukan blind append)

Detail arsitektur: `docs/CHECKPOINT-hybrid-multi-platform.md`

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

| Layanan | URL |
|---------|-----|
| Web UI | http://localhost:3000 |
| Backend API | http://localhost:3080/api/health |
| WebSocket | ws://localhost:3000/ws (proxy Vite) |

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

Stack production siap pakai dengan **multi-stage build** — image terpisah untuk backend (Node + Chromium) dan frontend (nginx).

### Menjalankan

```bash
docker compose up -d --build
```

| Layanan | URL | Image |
|---------|-----|-------|
| Web UI | http://localhost:3000 | nginx + static Vite build |
| Backend API | http://localhost:3080/api/health | Node 24.16.0 + Chromium + ffmpeg |

### Stage build (`Dockerfile`)

| Stage | Fungsi |
|-------|--------|
| `build` | Install deps + compile (`pnpm build:*`) — tanpa Chromium |
| `backend-deps` | Hanya production deps backend (tanpa paket frontend) |
| `browser-base` | Chromium + ffmpeg untuk Puppeteer |
| `backend` | Runtime API + automation |
| `frontend` | nginx + `apps/frontend/dist` |

### Konfigurasi

- **`docker.env`** — env default backend di container (headless, ffmpeg path, MCP compiled, dll.)
- **`.env` di root repo** (opsional) — override secret & port untuk Compose:

```env
GEMINI_API_KEY=your-key
CURSOR_API_KEY=your-key
NINEROUTER_API_KEY=your-key
FRONTEND_PORT=3000
BACKEND_PORT=3080
```

### Volume persisten

| Volume | Path container | Isi |
|--------|----------------|-----|
| `knitto-storage` | `/app/storage` | Lampiran file manager |
| `knitto-screenshoot` | `/app/screenshoot` | Screenshot & video agent |
| `knitto-memory` | `/app/memory` | Memori otomatisasi per app |

### Catatan Docker

- Browser **tidak muncul di layar host** — container tidak punya display GUI; automation tetap jalan headless di dalam container. Lihat hasil lewat screenshot/video di Web UI.
- `NINEROUTER_BASE_URL` default ke `http://host.docker.internal:20128` agar container bisa menjangkau 9Router di host.
- `shm_size: 1gb` diset untuk stabilitas Chromium.
- Frontend mem-proxy `/api` dan `/ws` ke service `backend` — koneksi WebSocket dari browser memakai same-origin (`window.location.host`).

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

| Variabel | Deskripsi | Default |
|----------|-----------|---------|
| `BACKEND_HOST` | Bind host HTTP + WS | `0.0.0.0` |
| `BACKEND_PORT` | Port HTTP + WebSocket | `3080` |
| `GEMINI_API_KEY` | API key Gemini | — |
| `CURSOR_API_KEY` | API key Cursor | — |
| `KNITTO_BRIDGE_MODEL` | Model default Gemini / Cursor | `gemini-2.5-flash` |
| `KNITTO_BRIDGE_MAX_CONCURRENT` | Job paralel per channel | `1` |
| `KNITTO_BRIDGE_JOB_TIMEOUT_MS` | Timeout job (ms) | `600000` |
| `KNITTO_BRIDGE_MAX_TOOL_CALLS` | Maks. tool call per job | `40` |
| `AUTOMATION_HEADLESS` | `true` = headless, `false` = browser terlihat (lokal) | `false` |
| `AUTOMATION_VIEWPORT_WIDTH` / `HEIGHT` | Ukuran viewport | `1366` / `768` |
| `AUTOMATION_RECORD_VIDEO` | Rekam sesi per job sebagai MP4 | `true` |
| `AUTOMATION_RECORD_FPS` | Frame rate rekaman | `20` |
| `AUTOMATION_FFMPEG_PATH` | Path eksplisit ffmpeg (opsional) | PATH sistem |
| `STORAGE_ROOT` | Root file manager | `./storage` |
| `STORAGE_MAX_UPLOAD_BYTES` | Batas ukuran upload | `52428800` |
| `NINEROUTER_BASE_URL` | Base URL 9Router | `http://localhost:20128` |
| `NINEROUTER_API_KEY` | API key 9Router | — |
| `NINEROUTER_MODEL` | Model default 9Router | `KNITTO_BRIDGE_MODEL` |
| `NINEROUTER_MAX_RETRIES` / `RETRY_DELAY_MS` | Retry rate-limit | `5` / `2000` |
| `KNITTO_MCP_LOG_LEVEL` | Log backend & automation | `info` |

Path otomatis (tanpa env): `memory/`, `screenshoot/`, entry MCP stdio di `apps/backend/src/automation/mcp-stdio-server.ts`.

Override lanjutan (jarang dipakai): `KNITTO_BRIDGE_CWD`, `AUTOMATION_MCP_COMMAND`, `AUTOMATION_MCP_PATH`, `AUTOMATION_MEMORY_DIR`, `AUTOMATION_SCREENSHOT_DIR`, `AUTOMATION_SLOW_MO_MS`, `AUTOMATION_BROWSER_TIMEOUT_MS`, `AUTOMATION_UPLOAD_DIR`, `AUTOMATION_UPLOAD_MAX_BYTES`, `AUTOMATION_VIDEO_FILENAME`.

#### Mobile / Appium

| Variabel | Deskripsi | Default |
|----------|-----------|---------|
| `APPIUM_SERVER_URL` | URL server Appium | `http://127.0.0.1:4723` |
| `MOBILE_UDID` | UDID default (opsional) | — |
| `MOBILE_DEVICE_UDIDS` | Daftar UDID pool (koma) | semua dari `adb devices` |
| `MOBILE_DEVICE_POOL_ENABLED` | Pool device idle/busy | `true` |
| `MOBILE_DEVICE_ACQUIRE_TIMEOUT_MS` | Timeout acquire device | `60000` |
| `MOBILE_IMPLICIT_WAIT_MS` | Implicit wait Appium | `5000` |
| `MOBILE_SNAPSHOT_MAX_ELEMENTS` | Maks elemen di snapshot UI | `200` |
| `MOBILE_RECORD_VIDEO` | Rekam layar per job (Appium) | `true` |
| `MOBILE_RECORD_TIME_LIMIT_SEC` | Batas durasi rekaman (detik) | `600` |
| `MOBILE_RECORD_FPS` | FPS rekaman mobile | `20` |
| `MOBILE_RECORD_BIT_RATE` | Bitrate rekaman (bps) | `4000000` |
| `MOBILE_VIDEO_FILENAME` | Nama file video | `recording.mp4` |
| `MOBILE_DEVICES_POLL_MS` | Interval polling `adb devices` untuk SSE | `3000` |
| `MOBILE_PACKAGES_CACHE_TTL_MS` | TTL cache `pm list packages` | `60000` |
| `MOBILE_MEMORY_DIR` | Memori mobile per app | `memory/mobile` |
| `MOBILE_UPLOAD_DIR` | Upload file ke device | `storage/mobile-uploads` |
| `MOBILE_UPLOAD_MAX_BYTES` | Batas ukuran upload mobile | `52428800` |

**Khusus Docker** (`docker.env`): `AUTOMATION_MCP_COMMAND=node`, `AUTOMATION_MCP_PATH=apps/backend/dist/automation/mcp-stdio-server.js`, `PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium`.

### Frontend (`apps/frontend/.env`)

| Variabel | Deskripsi | Default |
|----------|-----------|---------|
| `VITE_DEV_PORT` | Port Vite dev server | `3000` |
| `VITE_BACKEND_HOST` | Host backend (proxy `/api`) | `localhost` |
| `VITE_BACKEND_PORT` | Port backend (proxy) | `3080` |
| `VITE_WS_HOST` | Default host panel koneksi | `localhost` |
| `VITE_WS_PORT` | Default port panel koneksi | `3080` |
| `VITE_DEFAULT_CHANNEL` | Channel WebSocket default | `automation-default` |

> Di production Docker, WebSocket otomatis memakai same-origin via nginx — nilai `VITE_WS_*` tidak dipakai di browser.

---

## REST API

| Method | Path | Fungsi |
|--------|------|--------|
| `GET` | `/api/health` | Health check |
| `GET` | `/api/bridges` | Daftar bridge + model |
| `GET` | `/api/shortcuts` | Prompt shortcuts |
| `GET` | `/api/config/public` | Konfigurasi publik |
| `GET` | `/api/file-manager/entries` | List folder/file (`?path=`) |
| `GET` | `/api/file-manager/files/serve` | Serve file (preview gambar) |
| `GET` | `/api/file-manager/files/content` | Konten file (base64) |
| `POST` | `/api/file-manager/upload` | Upload file |
| `POST` | `/api/file-manager/folders` | Buat folder |
| `PATCH` | `/api/file-manager/entries` | Ubah nama file/folder (`{ path, name }`) |
| `DELETE` | `/api/file-manager/entries` | Hapus file/folder (`{ path }`) |
| `GET` | `/api/agent-screenshots/:jobId/:filename` | Screenshot bukti agent |
| `GET` | `/api/agent-videos/:jobId/:filename` | Rekaman video sesi agent (MP4) |
| `GET` | `/api/mobile/devices` | Daftar device Android (snapshot) |
| `GET` | `/api/mobile/devices/stream` | SSE update daftar device |
| `GET` | `/api/mobile/devices/:udid/packages` | Daftar package terinstall |
| `GET` | `/api/mobile/devices/:udid/packages/:pkg/activity` | Resolve launcher activity |

WebSocket: `ws://<host>:<port>/ws` — job progress (`agent_job` dengan `screenshots`, `videoUrl`), bridge status, credentials request.

---

## Penggunaan Web UI

1. Buka http://localhost:3000
2. Panel kiri: set **host / port / channel**, klik **Connect**
3. Isi **Bridge credentials** (Gemini / Cursor / 9Router) dan simpan
4. Pilih **bridge + model**, platform **Browser** atau **Mobile**, tulis prompt di editor TipTap atau pakai **Knitto Shortcuts**
5. Lampirkan file: upload, paste gambar, atau modal **Storage** (`storage/`)
6. Kirim prompt — pantau chat, progress, screenshot, dan **video** di hasil job
7. Ringkasan agent dalam **Bahasa Indonesia**; respons agent mendukung **Markdown** (termasuk tabel GFM)

Layout: sidebar koneksi + credentials; area utama chat + shortcuts.

---

## Bukti agent (screenshot & video)

| Aspek | Browser | Mobile |
|-------|---------|--------|
| Screenshot | PNG per tool / akhir job | PNG via tool mobile |
| Video | `puppeteer-screen-recorder` + **ffmpeg** | Appium `startRecordingScreen` (tanpa ffmpeg) |
| Path | `screenshoot/agents/{jobId}/recording.mp4` | sama |
| WS payload | `screenshots[]`, `videoUrl` pada `completed` / `error` / `cancelled` | sama |
| Matikan video | `AUTOMATION_RECORD_VIDEO=false` | `MOBILE_RECORD_VIDEO=false` |

UI menampilkan `<video controls>` di chat; retry otomatis jika file belum siap.

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

| Command | Fungsi |
|---------|--------|
| `pnpm dev` | Frontend + backend bersamaan |
| `pnpm dev:frontend` | Frontend saja (Vite) |
| `pnpm dev:backend` | Backend saja (tsx watch) |
| `pnpm build` | Build shared → backend → frontend |
| `pnpm build:shared` | Compile `@knitto/shared` ke `packages/shared/dist/` |
| `pnpm build:backend` | Compile backend ke `apps/backend/dist/` |
| `pnpm build:frontend` | Build Vite ke `apps/frontend/dist/` |
| `pnpm typecheck` | Typecheck semua workspace |
| `pnpm start` | Backend production |
| `pnpm preview` | Preview build frontend (Vite) |
| `pnpm clean` | Hapus folder `dist/` di workspace |
| `pnpm start:instances` | Launch BlueStacks instances (tanpa adb connect) |
| `pnpm connect:instances` | `adb connect` ke instance yang dilaunch / `--all` |
| `pnpm close:instances` | Tutup instance BlueStacks (quit / taskkill) |
| `pnpm disconnect:instances` | `adb disconnect` dari instance |
| `pnpm instances:up` | `start:instances --emulator=3` lalu `connect:instances` |
| `pnpm instances:down` | `close:instances` lalu `disconnect:instances` |

---

## Semantic locator (penulisan prompt)

Agent memakai semantic locator, bukan CSS selector:

- **Ref snapshot**: `e12` dari `automation_get_page_snapshot`
- **Role + name**: `role="button"`, `name="Simpan"`
- **Label / placeholder / text**: teks yang terlihat di halaman

Lihat `memory/` untuk pola navigasi CMS Knitto dan `prompt-shortcuts/` untuk template prompt.

---

## Troubleshooting

| Gejala | Penyebab umum | Solusi |
|--------|---------------|--------|
| `ECONNREFUSED` pada `/api/*` saat `pnpm dev` | Backend belum listen atau port salah | Pastikan log `Backend listening on…`; samakan port di kedua `.env` |
| `PATCH`/`DELETE` file-manager **404** | Proses backend lama tanpa route baru | Hentikan proses di `BACKEND_PORT`, restart `pnpm dev`; atau `pnpm build:backend` untuk production |
| Video tidak muncul, refresh baru ada | ffmpeg masih menulis MP4 | Sudah ditangani retry UI + tunggu file di backend; restart backend jika versi lama |
| Video browser **hitam penuh** (Windows) | `AUTOMATION_HEADLESS=true` + `puppeteer-screen-recorder` sering menghasilkan frame hitam | Set `AUTOMATION_HEADLESS=false` untuk rekaman yang terlihat; pastikan browser sudah navigasi sebelum segment start |
| Video TC kosong / tidak ada file | Segment recording gagal start (browser/app belum siap) | Cek log backend `segment-recording` / `browser-recording`; pastikan `mobile_launch_app` sukses untuk TC mobile |
| Video corrupt / tidak bisa diputar | `AUTOMATION_FFMPEG_PATH` salah atau ffmpeg tidak di PATH | `ffmpeg -version`; set `AUTOMATION_FFMPEG_PATH` ke binary yang benar |
| File MP4 sangat kecil (<10 KB) | Rekaman gagal atau hanya frame hitam | Lihat warning di log backend; ulangi dengan headless=false (browser) atau pastikan activity app sudah visible (mobile) |
| `EADDRINUSE` | Port backend sudah dipakai | `netstat` / `taskkill` proses di port tersebut |
| Docker: `backend unhealthy` | Build lama / env salah | `docker compose up -d --build`; cek `docker compose logs backend` |
| Docker: Chromium tidak terlihat | Container tanpa display GUI | Normal — pantau lewat screenshot/video di UI |
| Docker: 9Router tidak terjangkau | URL salah dari dalam container | Pakai `host.docker.internal` (sudah di `docker.env`) atau sesuaikan `NINEROUTER_BASE_URL` |
| `docker compose` gagal build pnpm | Node/pnpm tidak selaras | Pakai Node **24.16.0** + pnpm **11.5.2** (sama dengan image Docker & `package.json` engines) |
| Mobile: tidak ada device di UI | ADB kosong / belum connect | `adb devices`; untuk BlueStacks: `pnpm connect:instances` setelah launch |
| Mobile: Send disabled | Package belum dipilih atau device kosong | Pilih package; hubungkan emulator/USB |
| Mobile: Appium error | Server tidak jalan | `appium` di host; cek `APPIUM_SERVER_URL` |
| Mobile: request lambat (banyak tab) | Polling ADB berlebihan | Naikkan `MOBILE_DEVICES_POLL_MS`; pastikan satu SSE per tab (sudah dioptimasi) |
