# Docker Compose & Mobile Host Bridge

---

## Pendahuluan

Dokumen ini mendokumentasikan deployment **Docker Compose** untuk Knitto Agent Automation: service **Appium** + **backend** + **frontend**, termasuk checklist BlueStacks/emulator di host dan **dua jalur ADB**.

---

## Tujuan Dokumen

- Menjadi panduan operasional `pnpm docker:up`
- Mencegah kebingungan `ADB_SERVER_SOCKET` vs `ADB_CONNECT_TARGETS`
- Menjelaskan volume/bind-mount dan health dependency

---

## Ruang Lingkup

Mencakup: services, env, volumes, checklist mobile, build stages.

Tidak mencakup Appium global di host saja — lihat [mobile.md](mobile.md).

---

## 1. Services (`docker-compose.yml`)

| Service | Container | Port host (default) | Dependensi |
|---------|-----------|---------------------|------------|
| `appium` | `knitto-appium` | `APPIUM_PORT`→4723 | health `GET /status` |
| `backend` | `knitto-backend` | `BACKEND_PORT`→3080 | `appium` healthy |
| `frontend` | `knitto-frontend` | `FRONTEND_PORT`→80 | `backend` healthy |

Build: root `Dockerfile` targets `backend` / `frontend`; Appium dari `docker/appium/`.

---

## 2. Menjalankan

```bash
cp .env.example .env
# edit keys + ADB_CONNECT_TARGETS bila multi-instance
pnpm docker:up
# atau: docker compose up -d --build
```

| Layanan | URL |
|---------|-----|
| Web UI | http://localhost:3000 |
| Backend | http://localhost:3080/api/health |
| Appium | http://127.0.0.1:4723/status |

Matikan Appium global di host port **4723** agar tidak bentrok.

---

## 3. Dual ADB (penting)

| Siapa | Env | Cara |
|-------|-----|------|
| **Appium** container | `ADB_CONNECT_TARGETS` (default `host.docker.internal:5555`) | ADB lokal di container + `socat` ke port emulator host. Entrypoint **unset** `ADB_SERVER_SOCKET`. |
| **Backend** container | `ADB_SERVER_SOCKET=tcp:host.docker.internal:5037` | Client ke ADB server host (`adb -a`) untuk daftar device/package di UI |

UDID di capabilities biasanya `127.0.0.1:<port>` agar match socat di dalam Appium.

---

## 4. Checklist: emulator host → Appium Docker

### 4.1 Emulator / BlueStacks

```bash
pnpm instances:up
# atau: pnpm start:instances -- emulator=3 && pnpm connect:instances
adb devices   # status harus "device"
```

### 4.2 Expose ADB server (wajib untuk UI backend)

```bash
adb kill-server
adb -a nodaemon server start
# verifikasi 0.0.0.0:5037 (bukan hanya 127.0.0.1)
```

Setiap `pnpm connect:instances` me-reset ADB — ulangi langkah ini.

### 4.3 Compose & verifikasi

```bash
docker compose up -d --build
curl http://127.0.0.1:4723/status
docker compose exec appium sh -c 'echo ANDROID_HOME=$ANDROID_HOME; adb devices'
```

Device di container Appium harus muncul sebagai `127.0.0.1:<port>`.

### 4.4 Test UI

Connect `localhost:3080` → platform Mobile/Hybrid → device + package → prompt singkat.

### 4.5 Matikan

```bash
adb kill-server
pnpm docker:down
pnpm instances:down
```

---

## 5. Konfigurasi

- **`docker.env`** — default backend container (`env_file`)
- **Root `.env`** (dari `.env.example`) — secrets/ports/overrides Compose:

```env
FRONTEND_PORT=3000
BACKEND_PORT=3080
APPIUM_PORT=4723
GEMINI_API_KEY=
CURSOR_API_KEY=
NINEROUTER_API_KEY=
NINEROUTER_BASE_URL=http://host.docker.internal:20128
APPIUM_SERVER_URL=http://appium:4723
ADB_SERVER_SOCKET=tcp:host.docker.internal:5037
ADB_CONNECT_TARGETS=host.docker.internal:5555
```

---

## 6. Volume / mount

| Mount | Path container | Tipe |
|-------|----------------|------|
| `knitto-storage` | `/app/storage` | named volume |
| `knitto-screenshoot` | `/app/screenshoot` | named volume |
| `./memory` | `/app/memory` | bind |
| `./prompt-shortcuts` | `/app/prompt-shortcuts` | bind |

`docker compose down -v` menghapus named volume saja — **tidak** menghapus `./memory` / `./prompt-shortcuts` di host.

---

## 7. Stage build (`Dockerfile`)

| Stage | Fungsi |
|-------|--------|
| `build` | Compile monorepo |
| `backend-deps` | Prod deps backend |
| `browser-base` | Chromium + ffmpeg + adb |
| `backend` | Runtime + health `/api/health` |
| `frontend` | nginx + static |

Appium image: Appium 3.1 + UiAutomator2 4.2.3 + adb + socat (`docker/appium/`).

---

## 8. Catatan

- Browser headless di container — pantau lewat UI media
- `extra_hosts: host.docker.internal:host-gateway` pada appium & backend
- Backend `shm_size: 1gb`
- Hanya Appium: `pnpm docker:appium`

```bash
docker compose logs -f backend
docker compose logs -f appium
```
