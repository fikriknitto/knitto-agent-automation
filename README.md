# Knitto Browser Agent

Aplikasi otomatisasi browser untuk menjelajahi dan menguji sistem internal Knitto (`knitto.co.id`, CMS lokal, dll.) menggunakan AI agent + Puppeteer.

Arsitektur **monorepo**: React frontend dan Express backend terpisah, berkomunikasi lewat REST + WebSocket.

---

## Arsitektur

```
[ Frontend — React + Vite :3000 ]
         │  /api/*  +  /ws (proxy)
         ▼
[ Backend — Express + WS :3080 ]
    ├── Bridge Gemini   (in-process Puppeteer)
    ├── Bridge Cursor   (Cursor SDK + MCP stdio)
    └── Bridge 9Router  (in-process Puppeteer)
         ▼
[ Chrome / Chromium ]
```

**1 proses backend** menggantikan socket relay + 3 bridge terpisah. Gemini dan 9Router memanggil Puppeteer langsung in-process; Cursor SDK masih men-spawn MCP stdio entry di backend.

---

## Struktur folder

```
knitto-browser-agent/
├── apps/
│   ├── frontend/              # React + Vite
│   │   └── src/
│   └── backend/               # Express + TypeScript + Puppeteer
│       └── src/
│           ├── automation/    # Browser tools (lift dari MCP)
│           ├── controllers/   # MVC controllers
│           ├── services/      # Bridge runners, queue, prompt builder
│           ├── websocket/     # WS hub
│           └── server.ts
├── packages/
│   └── shared/                # Zod schemas + types (@knitto/shared)
├── prompt-shortcuts/          # Template prompt Knitto (.md)
├── memory/                    # Memori otomatisasi per app
├── screenshoot/               # Screenshot + uploads
├── .env                       # (opsional) legacy — gunakan apps/*/.env
└── package.json
```

---

## Prasyarat

- Node.js 20+ (disarankan 24.x)
- pnpm 9+
- API key: Gemini dan/atau Cursor (bisa diisi lewat Web UI)
- 9Router opsional (`NINEROUTER_BASE_URL`)

---

## Instalasi & menjalankan

```bash
pnpm install
pnpm dev
```

| Layanan | URL |
|---------|-----|
| Web UI | http://localhost:3000 |
| Backend API | http://localhost:3080/api/health |
| WebSocket | ws://localhost:3000/ws (via proxy Vite) |

**Production:**

```bash
pnpm build
pnpm start
```

---

## Environment variables

Salin `.env` per app dari contoh di masing-masing folder:

```bash
cp apps/backend/.env.example apps/backend/.env
cp apps/frontend/.env.example apps/frontend/.env
```

### Backend (`apps/backend/.env`)

| Variabel | Deskripsi | Default |
|----------|-----------|---------|
| `BACKEND_PORT` | Port HTTP + WebSocket backend | `3080` |
| `GEMINI_API_KEY` | API key Gemini | — |
| `CURSOR_API_KEY` | API key Cursor | — |
| `NINEROUTER_BASE_URL` | Base URL 9Router | `http://localhost:20128` |
| `KNITTO_BRIDGE_MODEL` | Model default | `gemini-2.5-flash` |
| `AUTOMATION_HEADLESS` | `true` = headless, `false` = browser terlihat | `false` |
| `AUTOMATION_VIEWPORT_WIDTH` | Lebar viewport | `1280` |
| `AUTOMATION_VIEWPORT_HEIGHT` | Tinggi viewport | `720` |
| `AUTOMATION_MEMORY_DIR` | Folder memori | `memory/` |
| `AUTOMATION_SCREENSHOT_DIR` | Folder screenshot | `screenshoot/` |

### Frontend (`apps/frontend/.env`)

| Variabel | Deskripsi | Default |
|----------|-----------|---------|
| `VITE_DEV_PORT` | Port Vite dev server | `3000` |
| `VITE_BACKEND_HOST` | Host backend (proxy) | `localhost` |
| `VITE_BACKEND_PORT` | Port backend (proxy) | `3080` |
| `VITE_WS_HOST` | Default host panel koneksi | `localhost` |
| `VITE_WS_PORT` | Default port panel koneksi | `3080` |
| `VITE_DEFAULT_CHANNEL` | Channel WebSocket default | `automation-default` |

---

## REST API

| Method | Path | Fungsi |
|--------|------|--------|
| `GET` | `/api/health` | Health check |
| `GET` | `/api/bridges` | Daftar bridge + model |
| `GET` | `/api/shortcuts` | Prompt shortcuts |
| `GET` | `/api/config/public` | Konfigurasi publik |

---

## Penggunaan Web UI

1. Buka http://localhost:3000
2. Pastikan status **Socket** = connected dan **Bridge** = Online
3. Isi credentials di panel kiri (Gemini / Cursor / 9Router)
4. Pilih bridge + model, ketik prompt atau gunakan **Knitto Shortcuts**
5. Pantau progress, tool calls, dan live screenshot di panel kiri

---

## Scripts

| Command | Fungsi |
|---------|--------|
| `pnpm dev` | Frontend + backend |
| `pnpm dev:frontend` | Frontend saja |
| `pnpm dev:backend` | Backend saja |
| `pnpm build` | Build semua workspace |
| `pnpm start` | Jalankan backend (production) |

---

## Semantic locator (penulisan prompt)

Agen memakai semantic locator, bukan CSS selector:

- **Ref snapshot**: `e12` dari hasil `automation_get_page_snapshot`
- **Role + name**: `role="button"`, `name="Simpan"`
- **Label / placeholder / text**: teks yang terlihat di halaman

Lihat juga file di `memory/` untuk pola navigasi CMS Knitto.
