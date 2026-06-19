# Knitto Browser Agent 🤖🕸️

Aplikasi agen otomatisasi browser lokal mandiri yang dirancang khusus untuk menjelajahi dan menguji sistem internal Knitto (`knitto.co.id`, `portal.knitto.org`, dan CMS lokal) menggunakan **Cursor SDK Agent** + **Puppeteer MCP Server**.

Aplikasi ini menggunakan pola arsitektur *bridge* yang terinspirasi dari plugin Figma Knitto, dikemas ulang ke dalam proyek mandiri berbasis web agar mudah dijalankan secara lokal tanpa dependensi monorepo.

---

## 🏗️ Arsitektur Sistem

Proyek ini berjalan melalui koordinasi 4 komponen utama:

```
[ Web UI (React + Vite) ]
         ▲
         │ (WebSocket Connection - Port 3077)
         ▼
[ WebSocket Relay Server ]
         ▲
         │ (Job & Progress Events)
         ▼
[ Bridge Client (Cursor SDK) ] ◄──► [ Puppeteer MCP Server ] ◄──► [ Chrome / Chromium ]
```

1. **Web UI (React + Vite)**: Halaman obrolan interaktif bergaya ChatGPT yang memiliki panel kontrol koneksi, panel credential model AI, status progress pengerjaan, live preview screenshot, dan jalan pintas (*shortcuts*) untuk tugas-tugas Knitto.
2. **WebSocket Relay Server**: Hub perantara yang mendistribusikan instruksi dari Web UI ke Bridge Client, serta mengalirkan log proses serta screenshot kembali ke Web UI.
3. **Bridge Client**: Otak AI utama yang menginisialisasi Agen dari `@cursor/sdk` (menggunakan model pilihan Anda, contoh: `composer-2.5`) dan menautkan MCP server lokal untuk mengendalikan browser.
4. **Puppeteer MCP Server**: Pelaksana teknis yang menyediakan set *actions* browser lokal (buka halaman, klik tombol, isi formulir, ambil tangkapan layar, dsb.) dalam bentuk tool terstandar Model Context Protocol (MCP) yang dapat dipanggil otomatis oleh model AI.

---

## 📁 Struktur Folder Proyek

```
knitto-browser-agent/
├── src/
│   ├── bridge/                # Proses jembatan antara AI SDK dan socket
│   │   ├── cursor/            # Runner & konfigurasi spesifik Cursor SDK
│   │   │   ├── agent-runner.ts
│   │   │   ├── config.ts
│   │   │   └── ws-client.ts
│   │   ├── shared/            # Type definitions & helper bersama
│   │   │   ├── queue.ts
│   │   │   └── prompt-builder.ts
│   │   └── bridge.ts          # Entry point untuk memulai Bridge Client
│   │
│   ├── mcp/                   # Server Model Context Protocol (MCP)
│   │   ├── core/              # Kerangka dasar server MCP (JSON-RPC stdio)
│   │   │   ├── server.ts
│   │   │   └── logger.ts
│   │   ├── libs/              # Implementasi browser Puppeteer & memori
│   │   │   ├── browser/       # Logika Puppeteer (session, snapshot, screenshot)
│   │   │   ├── memory/        # Penyimpanan berkas memori pengujian (.md)
│   │   │   ├── tools/         # Defini 16 tool browser (click, fill, navigate, dll.)
│   │   │   └── registry.ts    # Pendaftaran tool MCP
│   │   └── index.ts           # Entry point untuk memulai MCP Server
│   │
│   ├── socket/                # Server perantara WebSocket Relay
│   │   └── server.ts
│   │
│   └── webapp/                # Kode Frontend Web (React + Vite)
│       ├── components/        # Komponen UI (Chat, Credentials, Screenshot)
│       ├── lib/               # WS client & protokol komunikasi frontend
│       ├── App.tsx            # Halaman utama aplikasi web
│       ├── main.tsx
│       └── styles.css         # Styling modern glassmorphism dark theme
│
├── index.html                 # Entry point HTML untuk Vite
├── package.json
├── tsconfig.json
└── vite.config.ts
```

---

## ⚙️ Variabel Lingkungan (Environment Variables)

Anda dapat mengonfigurasi variabel berikut melalui file `.env` di root direktori proyek, atau mengekspornya langsung di terminal sebelum menjalankan proses:

| Nama Variabel | Deskripsi | Nilai Bawaan |
|---|---|---|
| `CURSOR_API_KEY` | API Key dari akun Cursor Pro/Business Anda untuk menjalankan model AI | (Kosong, dapat diinput via Web UI) |
| `AUTOMATION_HEADLESS` | Menjalankan Puppeteer dalam mode tanpa kepala (`true`) atau headed/terlihat (`false`) | `false` (Headed, agar Anda dapat melihat aksi browser) |
| `AUTOMATION_WS_PORT` | Port untuk server perantara WebSocket Relay | `3077` |
| `AUTOMATION_WS_SERVER`| Host dari WebSocket Relay server | `localhost` |
| `KNITTO_BRIDGE_MODEL` | Default model AI yang digunakan oleh Cursor SDK | `composer-2.5` |
| `AUTOMATION_BROWSER_TIMEOUT_MS` | Timeout maksimal interaksi browser dalam milidetik | `30000` (30 detik) |

---

## 🚀 Cara Instalasi & Menjalankan Proyek

### Prasyarat
* Node.js versi `24.x` atau lebih baru.
* Akun Cursor Pro/Business untuk mendapatkan `CURSOR_API_KEY`.

### 1. Instalasi Dependensi
Jalankan perintah berikut di root folder proyek:
```bash
npm install
```

### 2. Jalankan Layanan (Butuh 3 Terminal Berbeda)

Buka 3 jendela terminal di root proyek `knitto-browser-agent/`:

* **Terminal 1: WebSocket Relay Server**
  ```bash
  npm run start:socket
  ```
  *Output sukses:* `[INFO][automation-socket] Automation socket relay listening on ws://0.0.0.0:3077`

* **Terminal 2: Bridge Client (Cursor SDK)**
  *(Jika API key belum di-set di `.env`, Anda dapat menginputkannya secara interaktif lewat Web UI nanti)*
  ```bash
  npm run start:bridge
  ```
  *Output sukses:* `[INFO][bridge-cursor-ws] Connected to socket server` & `Bridge registered: cursor-xxx`

* **Terminal 3: React Web UI (Vite Dev Server)**
  ```bash
  npm run dev
  ```
  *Output sukses:* `  ➜  Local:   http://localhost:3000/`

---

## 🎯 Cara Penggunaan di Web UI

1. Buka browser dan akses **[http://localhost:3000](http://localhost:3000)**.
2. Periksa status indikator di panel sebelah kiri:
   * **Socket**: Harus berstatus `connected` (berwarna hijau).
   * **Bridge**: Harus berstatus `Online` (berwarna hijau).
3. Di panel **Bridge credentials** (kiri bawah):
   * Masukkan **Cursor API Key** Anda jika belum dikonfigurasi melalui `.env`.
   * Klik tombol **Save to Cursor bridge** (koneksi AI akan diverifikasi secara real-time).
4. Mulai berinteraksi:
   * Ketik instruksi alami di chatbox, contoh: `"buka knitto.co.id lalu cari produk combed 30s"` dan tekan tombol **Send prompt**.
   * Atau, gunakan salah satu tombol pintasan **Knitto Shortcuts** di bawah kolom chat untuk pengetesan instan pada target situs Knitto.
5. Anda dapat melihat:
   * Jendela Chrome/Chromium otomatis terbuka secara lokal dan mulai mengetik/menjelajahi halaman secara otomatis.
   * Langkah kerja AI tampil secara langsung di UI obrolan: `🔧 Using automation_navigate…`
   * Progress bar berjalan secara real-time.
   * Tangkapan layar browser paling aktual akan tampil di panel **Live screenshot** sisi kiri.

---

## 🛠️ Panduan Semantic Locator (Untuk Penulisan Prompt)

Agen ini tidak bergantung pada atribut sensitif kode seperti `data-testid` atau selector CSS yang rumit. Agen menggunakan **Semantic Locators** untuk mengenali elemen seperti manusia:

* **Ref Snapshot**: Mengacu pada nomor elemen interaktif hasil pemindaian otomatis, contoh: `e1` untuk kotak pencarian, `e12` untuk tombol submit (sangat direkomendasikan).
* **Role + Name**: Kombinasi peran elemen dan teks yang terlihat, contoh: `role="button"`, `name="Cari"`.
* **Label**: Teks pada tag `<label>` yang terikat pada input, contoh: `label="Email"`.
* **Placeholder**: Teks placeholder pada form input, contoh: `placeholder="Masukkan nama kain..."`.
* **Text**: Teks umum yang terlihat pada layar, contoh: `text="Combed 30s Putih"`.

Ketika menulis prompt kustom, Anda dapat memberikan panduan langsung berdasarkan teks yang Anda lihat di layar untuk membantu pemahaman model AI.
