# Checkpoint: Hybrid Multi-Platform (Browser + Mobile)

Dokumen ini merangkum diskusi dan rencana implementasi agar **satu prompt** bisa menjalankan beberapa test case lintas **browser** dan/atau **mobile**, dengan aturan media:

> **1 test case = 1 video** — 3 test case dalam satu prompt → **3 file video** terpisah.

> Status: **Planning** — belum diimplementasi. Tambahkan poin di bagian [Open questions](#open-questions) jika ada yang kurang.

---

## Summary (ringkasan eksekutif)

### Tujuan

Satu **prompt** menjalankan beberapa **test case** lintas **browser** dan/atau **mobile** (hybrid), dengan:

- **1 test case = 1 video** (`tc-01.mp4`, `tc-02.mp4`, …)
- **Memory per platform** yang tidak menumpuk konten usang (`upsert_section`, bukan blind `append`)
- **Handoff antar TC** (mis. `ORDER_NO`) lewat orchestrator, bukan file memory

### Arsitektur singkat

```
Prompt → Orchestrator (loop per TC) → Composite MCP (browser + mobile tools)
         ├── segment recording per TC
         ├── handoff state antar TC
         └── memory read/write per TC sesuai platform
```

### Keputusan utama

| Area | Keputusan |
|------|-----------|
| Platform job | `hybrid` (+ tetap `browser` / `mobile` single-TC) |
| Video | N TC → N file di `screenshoot/agents/{jobId}/tc-{nn}.mp4` |
| Memory store | Tetap terpisah: `memory/` (web) vs `memory/mobile/` (app) |
| Memory write | Default `upsert_section` + `sectionKey`; `replace` untuk full file |
| Handoff | Runtime di orchestrator; **jangan** simpan ORDER_NO ke `.md` |
| UI video | **Stack vertikal** — satu player per TC (`tc-01`, `tc-02`, …) |
| UI mobile config | **Package per TC** di prompt (`App: com.example.app`); composer = fallback |
| Eksekusi kode | **Belum** — tunggu perintah eksplisit |

### Fase implementasi (urutan)

0. Infra (Appium, ADB) → 1. Protocol → 2. Orchestrator → 3. Segment recording → 4. Composite MCP → 5. Prompt per TC → 6. Bridge runners → 7. Media API → 8. Frontend → 9. Memory upsert → 10. Docs & QA

---

## Latar belakang

### Kebutuhan user

Contoh skenario (satu prompt):

1. **Test Case 1 (Browser)** — buat order di web → video `tc-01.mp4`
2. **Test Case 2 (Mobile)** — verifikasi order di app → video `tc-02.mp4`
3. **Test Case 3 (Browser)**** — cek status order di CMS → video `tc-03.mp4`

Semua dalam **satu prompt / satu job**, tanpa kirim ulang manual, dengan **satu video per test case**.

### Kondisi saat ini

| Aspek | Perilaku sekarang |
|-------|-------------------|
| Platform per job | `browser` **atau** `mobile` (binary) |
| MCP per job | Satu client: `automation_*` **atau** `mobile_*` |
| Workaround | N prompt terpisah → N video (satu job per kirim) |
| Video per job | **1 file** `recording.mp4` (rekaman kontinyu seluruh job) |
| Video vs test case | Banyak TC dalam 1 prompt ≠ banyak video ❌ |

### Kesimpulan feasibility

**Bisa direfactor** — nama tool tidak bentrok (`automation_*` vs `mobile_*`), folder bukti per job sudah ada (`screenshoot/agents/{jobId}/`), dan segment recording bisa ditambah di layer browser (ffmpeg) + mobile (Appium start/stop).

**Catatan:** 1 TC = 1 video **tidak cukup** hanya menggabungkan MCP hybrid; perlu **batas test case eksplisit** + **start/stop rekaman per segmen**.

---

## Aturan video (keputusan produk)

| Aturan | Detail |
|--------|--------|
| **1 TC = 1 video** | Setiap test case menghasilkan tepat satu file MP4 (jika recording aktif) |
| **N TC = N video** | 3 TC → `tc-01.mp4`, `tc-02.mp4`, `tc-03.mp4` (atau pola serupa) |
| **Lokasi file** | `screenshoot/agents/{jobId}/tc-{nn}.mp4` |
| **Platform per TC** | Tiap TC bisa `browser`, `mobile`, atau diturunkan dari konfigurasi fase |
| **UI** | Chat job menampilkan **daftar video** (`videoUrls[]`), bukan satu `videoUrl` saja |
| **Screenshot** | Tetap multi-file per tool (tidak berubah) |

---

## Target akhir (Definition of Done)

- [ ] User pilih platform **Hybrid** di composer (+ wajib device & package mobile).
- [ ] Satu prompt / satu job menjalankan **beberapa test case** berurutan.
- [ ] **Setiap test case** menghasilkan **1 video** sendiri.
- [ ] Test case bisa campuran browser + mobile (TC1 web, TC2 app, TC3 web, …).
- [ ] Handoff antar TC (mis. `ORDER_NO`) lewat state terstruktur atau konvensi `[HANDOFF]`.
- [ ] Cleanup per TC / akhir job: tidak leak session browser atau device Appium.
- [ ] WS payload & UI: `videoUrls: string[]` (urutan sesuai TC).
- [ ] Berlaku juga untuk job **browser-only** atau **mobile-only** multi-TC (bukan hanya hybrid).
- [ ] README + env + contoh prompt diperbarui.

---

## Arsitektur target

```
[ 1 prompt — platform: hybrid | browser | mobile ]
         │
         ▼
[ Test case orchestrator ]
    ├── parse / definisi TC-1..N (platform per TC)
    ├── untuk setiap TC:
    │     ├── start segment recording  → tc-{nn}.mp4
    │     ├── jalankan agent + tools (composite MCP jika perlu)
    │     ├── stop segment recording
    │     └── simpan handoff state (ORDER_NO, dll.)
    └── cleanup global
         │
         ▼
[ Composite MCP Client ]  (saat TC butuh browser dan/atau mobile)
    ├── automation_*  → Puppeteer / Chrome
    └── mobile_*      → WebdriverIO → Appium → Android
```

**Prinsip:** batas test case **deterministik di backend** (bukan mengandalkan LLM stop recording sendiri). Agent fokus ke langkah TC; orchestrator yang membuka/tutup rekaman.

---

## Model test case

### Opsi A — Structured di prompt (disarankan MVP)

User menulis blok jelas; parser backend atau LLM planner ekstrak:

```markdown
## Test Case 1
Platform: browser
...

## Test Case 2
Platform: mobile
App: com.knitto.app
...
```

TC mobile **wajib** punya `App: <package>` di blok TC (atau fallback dari composer — lihat [Desain UI](#desain-ui-hybrid--multi-tc)).

### Opsi B — Metadata di UI (fase berikutnya)

Form multi-step: TC1 platform + instruksi, TC2 platform + instruksi, …

### Schema shared (draft)

```ts
type TestCaseSpec = {
  id: string;           // "tc-01"
  platform: "browser" | "mobile";
  instruction: string;
  appPackage?: string;  // wajib jika platform mobile (dari baris App: di prompt)
  udid?: string;        // opsional per TC; fallback mobileConfig.udid
  deepLink?: string;    // opsional per TC
};

type MultiTestJob = {
  platform: "browser" | "mobile" | "hybrid";
  testCases: TestCaseSpec[];
  mobileConfig?: MobileConfig;
};
```

**Keputusan sementara:** MVP pakai **Opsi A** (parse dari prompt) + validasi minimal jumlah TC.

---

## Segment recording (desain teknis)

### Browser (Puppeteer + ffmpeg)

- Saat ini: satu `PuppeteerScreenRecorder` aktif per job.
- Target:
  - `startBrowserSegment(jobId, segmentId)` → mulai rekaman ke `tc-{nn}.mp4`
  - `stopBrowserSegment()` → flush ffmpeg, file siap serve
- Dipanggil orchestrator **sebelum/sesudah** eksekusi agent per TC.

### Mobile (Appium)

- Saat ini: `startRecordingScreen` di `createSession`, `stopRecordingScreen` di `closeSession`.
- Target:
  - Per TC mobile: `startRecordingScreen` → … tool mobile … → `stopRecordingScreen` → tulis `tc-{nn}.mp4`
  - Session Appium **tetap hidup** antar TC mobile (hindari boot ulang), hanya rekaman yang stop/start
  - TC browser di tengah: boleh biarkan session mobile idle atau pause (lihat open questions)

### Tool MCP baru (opsional, untuk debugging manual)

| Tool | Fungsi |
|------|--------|
| `automation_begin_test_case` | Orchestrator internal; bisa tidak diekspos ke LLM |
| `automation_end_test_case` | Tutup segmen + emit progress `videoUrls` partial |

Default: **orchestrator memanggil API internal**, bukan tool agent — agar 1 TC = 1 video terjamin.

---

## Rencana implementasi bertahap

### Fase 0 — Prasyarat infra

- [x] Appium + ADB + BlueStacks scripts
- [x] Mobile env di `apps/backend/.env`
- [ ] Dev machine: minimal 1 device idle untuk uji multi-TC mobile

### Fase 1 — Protocol & shared types

**File:** `packages/shared/src/protocol/bridge.ts`

- [ ] `platform: "hybrid"` (+ tetap dukung `browser` | `mobile`)
- [ ] `testCases?: TestCaseSpec[]` (opsional; fallback parse dari prompt)
- [ ] `agentJobMessageSchema`: `videoUrls?: string[]` (ganti/deprecate `videoUrl` tunggal dengan backward compat)
- [ ] Progress event per TC: `testCaseIndex`, `testCaseId`, `testCaseStatus`

### Fase 2 — Test case orchestrator

**File baru:** `apps/backend/src/services/shared/test-case-orchestrator.ts`

- [ ] Parse test case dari prompt (`## Test Case N`, `Platform:`, `App:` untuk mobile)
- [ ] Loop TC 1..N:
  1. Set platform aktif untuk TC ini
  2. `startSegmentRecording(jobId, tcId, platform)`
  3. Jalankan sub-prompt agent (instruksi TC + handoff dari TC sebelumnya)
  4. `stopSegmentRecording()` → `screenshoot/agents/{jobId}/tc-{nn}.mp4`
  5. Ekstrak handoff untuk TC berikutnya
- [ ] Emit WS progress + append `videoUrls` setelah tiap TC selesai

### Fase 3 — Segment recording layer

**Browser:** `apps/backend/src/automation/libs/browser/recording.ts`

- [ ] Refactor: dukung multiple segment per job (bukan satu global recorder)
- [ ] `startBrowserSegment` / `stopBrowserSegment`

**Mobile:** `apps/backend/src/mobile-automation/libs/recording.ts`

- [ ] `startMobileSegment(driver, outputFilename)` / `stopMobileSegment`
- [ ] Decouple dari `createSession`/`closeSession` (session hidup, recording per TC)

**Shared:** `apps/backend/src/services/shared/segment-recording.ts`

- [ ] Facade `startSegmentRecording` / `stopSegmentRecording` by platform

### Fase 4 — Composite MCP client

- [ ] `createHybridMcpClient()` — merge browser + mobile tools
- [ ] `connectAutomationMcp()` — branch per platform TC aktif
- [ ] Session browser + Appium bisa hidup bersamaan selama job hybrid

### Fase 5 — Prompt builder

- [ ] `buildTestCasePrompt(tc, handoff, jobContext)` — instruksi fokus satu TC
- [ ] `buildHybridOverviewPrompt()` — penjelasan multi-TC + format handoff `[HANDOFF] KEY=value`
- [x] Larangan agent memanggil `close_session` / `close_browser` di tengah multi-TC (hanya orchestrator akhir job)

### Fase 6 — Bridge runners

- [ ] Gemini / NineRouter: ganti single `generateContent` loop → **orchestrator loop** per TC
- [ ] Cursor: dual MCP + orchestrator (fase lanjutan jika SDK kompleks)
- [x] `closeMcpSession` — cleanup hanya setelah TC terakhir
- [ ] `queue.ts` — validasi hybrid + mobileConfig

### Fase 7 — Media & API

- [ ] `jobMediaPayloadAsync` — tunggu semua `tc-*.mp4` yang diharapkan (atau timeout per file)
- [ ] `agent-videos.ts` — allow `tc-\d+\.mp4` pattern
- [ ] `agentVideoServeUrls(jobId)` → list semua video TC

### Fase 8 — Frontend

> Detail UX: [Desain UI (hybrid + multi-TC)](#desain-ui-hybrid--multi-tc)

- [ ] `PlatformSelector`: pill **Browser | Mobile | Hybrid**
- [ ] Hybrid: validasi prompt (`## Test Case` + `Platform:`); warning + blokir Send jika tidak valid
- [ ] Hybrid: validasi TC mobile punya `App:` (atau fallback composer)
- [ ] `MobileDevicesProvider` aktif saat `platform === "hybrid"` (SSE device list)
- [ ] User bubble: badge `[Hybrid] [N test cases]` (atau `[Browser]` / `[Mobile]`)
- [ ] `TestCaseProgress`: stepper **teks** saat job running (✓ ● ○ per TC)
- [ ] `AgentVideoStack`: **stack vertikal** dari `videoUrls[]` (satu player per TC + label)
- [ ] `MarkdownPreview` + `merge-agent-chat-line`: dukung `videoUrls[]` (backward compat `videoUrl`)
- [ ] (Opsional pasca-MVP) preview video per TC saat job masih running

### Fase 9 — App memory (hybrid + multi-TC)

> **Status:** disepakati di diskusi — **belum dieksekusi** di kode. Detail lengkap: [Strategi memory](#strategi-memory-hybrid--multi-tc).

- [ ] `app-memory-sections.ts` + update `app-memory-store.ts`
- [ ] Tool `*_update_app_memory`: hapus default `append`
- [ ] Orchestrator: read/write memory per TC + inject `sectionKey`
- [ ] Prompt builder: instruksi memory per TC

### Fase 10 — Dokumentasi & verifikasi

- [ ] README — multi-TC, 1 TC = 1 video, memory upsert_section
- [ ] `.env.example` — `RECORD_VIDEO_PER_TEST_CASE=true` (default true untuk multi-TC jobs)
- [ ] Manual test: 3 TC (browser → mobile → browser) → 3 video di UI
- [ ] Manual test: upsert section yang sama dua kali → satu section di file, tidak duplikat

---

## Contoh prompt multi-TC (3 video)

```
## Test Case 1
Platform: browser
- Login knitto.co.id dan buat order.
- Handoff: [HANDOFF] ORDER_NO=<nomor>

## Test Case 2
Platform: mobile
App: com.knitto.app
- Buka app, cari order dengan ORDER_NO dari handoff.
- Verifikasi order tampil di daftar.

## Test Case 3
Platform: browser
- Buka halaman admin order, cari ORDER_NO yang sama.
- Verifikasi status order = "confirmed" (atau sesuai ekspektasi).

Ringkasan akhir: Bahasa Indonesia, sebut hasil tiap TC.
```

**Hasil yang diharapkan:** `tc-01.mp4`, `tc-02.mp4`, `tc-03.mp4` di folder job yang sama.

---

## Desain UI (hybrid + multi-TC)

> **Status:** disepakati di diskusi — **belum dieksekusi** di kode.

### Prinsip

- Prompt tetap **markdown bebas** — tidak ada form builder TC di MVP.
- UI **parse & validasi** struktur TC; tampilkan progress dan hasil multi-video.
- Perilaku `browser` / `mobile` single-TC **tetap seperti sekarang**.

### Layout keseluruhan

```
┌─────────────────────────────────────────────────────────────┐
│  Chat history                                               │
│  [User]  [Hybrid] [3 test cases]  + prompt markdown         │
│  [Agent running]  TestCaseProgress (stepper teks)           │
│  [Agent done]     ringkasan markdown + AgentVideoStack      │
├─────────────────────────────────────────────────────────────┤
│  Composer: Platform [Browser][Mobile][Hybrid]               │
│  Mobile fallback (device / package / deeplink)              │
│  Bridge + Model                              [Send]         │
└─────────────────────────────────────────────────────────────┘
```

### 1. Platform selector

Pill ketiga: **Browser | Mobile | Hybrid**.

| Mode | Field mobile di composer |
|------|--------------------------|
| Browser | Tersembunyi |
| Mobile | Device + Package (wajib) + Deep link |
| Hybrid | Device + Package + Deep link sebagai **fallback** — lihat §3 |

Hint saat Hybrid dipilih:

> Satu TC = satu video. Gunakan `## Test Case N`, `Platform: browser|mobile`, dan `App:` untuk TC mobile.

### 2. Validasi prompt (Hybrid)

**Blokir Send** + tampilkan warning jika:

- Tidak ada minimal satu heading `## Test Case` (atau `## Test Case 1`, dst.)
- Ada TC tanpa baris `Platform: browser` atau `Platform: mobile`
- Ada TC `Platform: mobile` tanpa `App: <package>` **dan** composer package kosong

Contoh warning:

```
⚠ Prompt hybrid membutuhkan heading test case.
  Tambahkan:

  ## Test Case 1
  Platform: browser
  - Langkah…

  ## Test Case 2
  Platform: mobile
  App: com.knitto.app
  - Langkah…
```

**Preview ringan** (opsional, non-blocking setelah valid): `Detected: 3 test cases · 2 browser · 1 mobile`

### 3. Mobile config — package per TC di prompt (Opsi B)

Setiap blok TC mobile mendefinisikan package sendiri:

```markdown
## Test Case 2
Platform: mobile
App: com.knitto.customer
- Verifikasi order di app customer

## Test Case 4
Platform: mobile
App: com.knitto.admin
- Verifikasi di app admin
```

| Sumber | Prioritas |
|--------|-----------|
| `App:` di blok TC | **Utama** — orchestrator pakai ini per TC |
| Composer `mobileConfig.appPackage` | **Fallback** jika TC mobile tidak punya `App:` |
| Composer `udid` / `deepLink` | Default global; override opsional per TC nanti |

**Memory mobile** memakai `appPackage` dari TC yang sedang jalan (bukan satu package global job).

Composer hybrid tetap menampilkan field mobile agar user bisa set fallback + device pool; **tidak** menggantikan `App:` per TC.

### 4. User bubble — badge

Chip kecil di atas isi prompt (history chat):

| Platform | Badge |
|----------|--------|
| Browser | `[Browser]` |
| Mobile | `[Mobile]` |
| Hybrid | `[Hybrid]` + `[N test cases]` (N dari parse client) |

Memudahkan membedakan job multi-TC di riwayat tanpa membaca seluruh prompt.

### 5. Progress saat running — stepper teks

Komponen `TestCaseProgress` — **tanpa progress bar per TC**:

```
Test cases
✓ TC1 · Browser · Selesai
● TC2 · Mobile · Berjalan — mobile_tap
○ TC3 · Browser · Menunggu
```

Opsional satu baris global: `TC 2 dari 3`.

Data WS (rencana): `testCaseIndex`, `testCaseTotal`, `testCasePlatform`, `testCaseStatus`, `toolName` untuk TC aktif.

### 6. Hasil — video stack vertikal

**Keputusan:** stack vertikal (bukan tab).

Setiap TC selesai → satu blok player di bawah ringkasan agent:

```
Recordings

TC1 · Browser
┌──────────────────────────────┐
│  ▶  tc-01.mp4                │
└──────────────────────────────┘

TC2 · Mobile · com.knitto.app
┌──────────────────────────────┐
│  ▶  tc-02.mp4                │
└──────────────────────────────┘
```

- Komponen baru: `AgentVideoStack` (atau perluas `AgentVideos`)
- `MarkdownPreview`: terima `videoUrls[]` + metadata label per item
- Backward compat: satu `videoUrl` tetap seperti sekarang

Video **tidak** di-inline di markdown agent — hanya di komponen video.

### 7. Error & cancel

| Skenario | UI |
|----------|-----|
| TC gagal di tengah | Stepper: TC ✗ merah; TC berikutnya skipped atau cancelled |
| User Stop | TC pending dibatalkan; video TC selesai tetap ditampilkan |
| Partial success | Ringkasan agent + video TC yang berhasil |

### File frontend (rencana eksekusi)

| File | Perubahan |
|------|-----------|
| `platform-selector.tsx` | Pill Hybrid + hint |
| `prompt-editor.tsx` | Validasi hybrid, parse TC, SSE hybrid |
| `job-progress.tsx` | `TestCaseProgress` + badge user bubble |
| `agent-videos.tsx` | Stack multi-video |
| `markdown-preview.tsx` | `videoUrls[]` |
| `types.ts`, `merge-agent-chat-line.ts` | Field TC progress + `videoUrls` |
| `App.tsx` | `MobileDevicesProvider` untuk hybrid |

### Pasca-MVP (bukan scope sekarang)

- Tab video (hemat scroll jika TC > 4)
- Form builder TC di UI
- Panel debug handoff (`ORDER_NO`, dll.)
- Live preview video per TC saat job masih running

---

## Strategi memory (hybrid + multi-TC)

### Mengapa berubah dari model lama?

| Model lama (1 platform / 1 job) | Model baru (hybrid + multi-TC) |
|---------------------------------|--------------------------------|
| 1 job = 1 platform | 1 job = banyak TC, tiap TC bisa browser atau mobile |
| Update memory sekali di akhir job | Update memory **per TC** (jika ada learning) |
| Default `append` → file membengkak & duplikat | **`upsert_section`** → section usang **diganti** |
| Data antar langkah di prompt saja | **Handoff** antar TC via orchestrator |

**Kode saat ini masih model lama** (`append` default di `automation_update_app_memory` / `mobile_update_app_memory`).

### Tiga lapisan data (jangan dicampur)

| Lapisan | Isi | Contoh | Disimpan di |
|---------|-----|--------|-------------|
| **Handoff runtime** | Data sekali jalan, antar TC | `ORDER_NO=12345` | State orchestrator (per job) |
| **Memory browser** | Pola web reusable | flow checkout, locator menu | `memory/{appId}.md` |
| **Memory mobile** | Pola app reusable | tab Orders, cara search | `memory/mobile/{appPackage}.md` |

**Jangan** simpan ke file memory: nomor order konkret, token, password, data user sekali pakai.  
**Simpan**: locator, urutan navigasi, quirks UI, **pola** verifikasi (bukan nilai run).

### Tidak ada folder `memory/hybrid/`

Hybrid = satu job memakai **dua store** sesuai platform tiap TC:

| TC platform | Tool baca | Tool tulis | appId |
|-------------|-----------|------------|-------|
| `browser` | `automation_get_app_memory` | `automation_update_app_memory` | slug web, mis. `knitto-co-id` |
| `mobile` | `mobile_get_app_memory` | `mobile_update_app_memory` | `App:` di prompt TC (fallback `mobileConfig.appPackage`) |

TC1 (web) menulis `memory/knitto-co-id.md`; TC2 (app) menulis `memory/mobile/com.example.app.md` — tidak saling timpa.

### Siklus memory per test case

Orchestrator menjalankan per TC:

```
1. READ   → get_app_memory (platform + appId TC ini)
2. RUN    → agent + tools (dapat handoff dari TC sebelumnya)
3. WRITE  → update_app_memory (upsert_section) — hanya jika ada learning baru
```

Agent **tidak** menutup browser/session di tengah multi-TC; cleanup di akhir job (orchestrator).

### Format file & sectionKey

Satu file `.md` per app, banyak section:

```markdown
## [order-checkout]

### Flow
- Login → cart → checkout

### Locators
- Tombol bayar: role=button name="Bayar"

## [order-list-verify]

### Flow
- Tab Orders → search by order number
```

**`sectionKey`** = slug stabil (`order-checkout`, `order-list-verify`).

**Mapping contoh (hybrid 3 TC):**

| TC | Platform | appId | sectionKey (contoh) |
|----|----------|-------|---------------------|
| TC1 | browser | `knitto-co-id` | `order-checkout` |
| TC2 | mobile | `com.knitto.app` | `order-list-verify` |
| TC3 | browser | `knitto-cms` | `order-admin-status` |

**Pola penamaan `sectionKey` (belum final):**

- **Per flow** (`order-checkout`) — reusable lintas run
- **Per TC** (`tc-01-order-checkout`) — jelas di job multi-TC; orchestrator bisa inject otomatis

### Mode tulis

| Mode | Pemakaian |
|------|-----------|
| **`upsert_section`** (default agent) | Baca file → ganti section `## [sectionKey]` → dedupe key duplikat lama |
| **`replace`** | Timpa seluruh file — UI Settings, migrasi manual |

**`append` dihapus** dari tool agent (rencana) — sumber duplikat/usang.

**Alur upsert (saat eksekusi):**

1. Baca `{appId}.md`
2. Normalisasi `sectionKey` → slug
3. Hapus semua section dengan key sama
4. Tulis section baru + pertahankan preamble & section lain

### Contoh alur hybrid (memory + handoff)

**TC1 — Browser (buat order)**

- Read: `automation_get_app_memory("knitto-co-id")`
- Run: buat order
- Handoff orchestrator → TC2: `ORDER_NO=12345` (bukan ke `.md`)
- Write: `upsert_section`, key `order-checkout`

**TC2 — Mobile (cek order)**

- Read: `mobile_get_app_memory(appPackage)`
- Prompt + handoff: `ORDER_NO` dari orchestrator
- Write: `upsert_section`, key `order-list-verify`

**TC3 — Browser (cek CMS)**

- Read: `automation_get_app_memory("knitto-cms")` (appId boleh beda per TC)
- Handoff: `ORDER_NO` dari state job
- Write: `upsert_section`, key `order-admin-status`

### Komponen kode (rencana eksekusi)

| File | Peran |
|------|-------|
| `app-memory-sections.ts` (baru) | Parse `##`, dedupe, upsert |
| `app-memory-store.ts` | `writeAppMemory(mode, sectionKey?)` |
| `test-case-orchestrator.ts` | Inject appId, sectionKey, handoff per TC |
| `prompt-builder.ts` | Instruksi read → run → upsert per TC |
| `*_update_app_memory` tools | Default `upsert_section`, wajib `sectionKey` |

### (Opsional pasca-MVP) Journey memory

File `memory/journeys/knitto-order-web-mobile.md` — dokumentasi E2E (urutan TC, appId browser + package mobile). **Bukan** pengganti memory per platform.

---

## Perbandingan: sebelum vs sesudah

### Platform & video

| Skenario | Sekarang | Target |
|----------|----------|--------|
| 1 prompt, 1 TC | 1 video | 1 video (`tc-01.mp4`) |
| 1 prompt, 3 TC | 1 video panjang | **3 video** |
| 3 prompt terpisah | 3 video | 3 video (tetap valid) |
| Hybrid 2 TC (web + app) | tidak bisa 1 prompt | 2 video |

### Memory

| Skenario | Sekarang | Target |
|----------|----------|--------|
| Update akhir job | `append` (default) | `upsert_section` per TC |
| Section duplikat | Menumpuk | Dedupe by `sectionKey` |
| ORDER_NO antar TC | Manual / prompt | Orchestrator handoff |
| Hybrid 2 TC | 1 platform saja | TC1 → `memory/`, TC2 → `memory/mobile/` |

---

## Referensi teknis

### WebdriverIO vs Appium

| Komponen | Peran |
|----------|--------|
| **WebdriverIO** | Client SDK di Node |
| **Appium** | Server automation Android |
| **Mobile video** | `startRecordingScreen` / `stopRecordingScreen` per segmen TC |
| **Browser video** | `PuppeteerScreenRecorder` + ffmpeg per segmen TC |

### File kunci existing

| Area | Path |
|------|------|
| Platform schema | `packages/shared/src/protocol/bridge.ts` |
| Browser recording | `apps/backend/src/automation/libs/browser/recording.ts` |
| Mobile recording | `apps/backend/src/mobile-automation/libs/recording.ts` |
| Media payload | `apps/backend/src/services/shared/job-media-payload.ts` |
| App memory (rencana) | `app-memory-store.ts` + `app-memory-sections.ts` (belum ada) |
| UI video | `apps/frontend/src/components/agent-videos.tsx` |
| UI platform | `apps/frontend/src/components/platform-selector.tsx` |
| UI progress | `apps/frontend/src/components/job-progress.tsx` |

---

## Format naratif + shortcut resolver (implemented)

### Authoring

```markdown
## Test Case 1
Ikuti system prompt "Take Order - Login".

## Test Case 2
Ikuti system prompt "Order pesanan".
produk=produk A
qty=1
Wajib: [HANDOFF] NO_ORDER=<nomor>
```

### System prompt metadata (`prompt-shortcuts/*.md`)

```yaml
platform: browser   # atau mobile (default: browser)
appPackage: com.example.app  # wajib jika mobile
url: https://portal.example.com/order
```

### Resolve platform (prioritas)

1. `Platform:` eksplisit di TC
2. `platform` di metadata shortcut
3. Infer `https?://` di instruksi
4. Default `browser`

### Parser

- `parseTestCaseDrafts` → `resolveTestCaseDrafts` di `packages/shared/src/protocol/test-case.ts`
- Backend: `loadShortcutRegistry()` + `resolveJobTestCasesAsync`
- Prompt agent: inline isi shortcut (bukan hanya path file)
- Video stack & memory `upsert_section` tidak berubah arsitektur

### Backward compat

Format kaku `Platform:` / `App:` tetap didukung sebagai override.

---

## Open questions

1. **Bridge MVP:** Gemini + NineRouter dulu, atau Cursor wajib dari awal?
2. ~~**Format parse TC:**~~ **Disepakati:** `## Test Case N` + `Platform:` + `App:` (mobile). JSON/YAML tidak untuk MVP.
3. **Handoff:** cukup `[HANDOFF] KEY=value` di output TC, atau state object di orchestrator?
4. **Nama file:** `tc-01.mp4` vs `tc-01-browser.mp4` (suffix platform)?
5. **Session mobile antar TC browser:** keep Appium session idle (hemat boot) vs stop/start session tiap TC mobile?
6. **Max TC per prompt:** batasi (mis. 5) untuk hindari job timeout?
7. **Recording mati:** jika `RECORD_VIDEO=false`, skip file tapi TC tetap jalan?
8. **Memory sectionKey:** per flow (`order-checkout`) vs per TC (`tc-01-...`) — orchestrator inject yang mana?
9. **Memory write:** wajib setiap TC atau hanya jika agent mendeteksi learning baru?
10. _(Tambahkan poin kamu di sini)_

---

## Yang tidak masuk scope (kecuali diminta)

- Docker / CI pipeline hybrid
- Perubahan BlueStacks scripts
- Editor visual multi-TC di UI (form TC terpisah) — pasca MVP

---

## Changelog dokumen

| Tanggal | Perubahan |
|---------|-----------|
| 2026-07-10 | Draft awal: hybrid 1 prompt, arsitektur refactor |
| 2026-07-10 | **Update:** 1 test case = 1 video (N TC = N video); orchestrator + segment recording masuk MVP |
| 2026-07-10 | **Diskusi memory:** rencana `upsert_section` + dedupe (belum dieksekusi di kode) |
| 2026-07-10 | **Checkpoint:** section Strategi memory hybrid + summary eksekutif |
| 2026-07-10 | **Desain UI:** stack vertikal, package per TC (`App:`), stepper teks, badge hybrid, validasi heading |
| 2026-07-10 | **Implementasi:** segment recording retry (pending state), cleanup platform end-of-job, `testCaseResults[]` di UI, troubleshooting video hitam |

### Troubleshooting video hitam / kosong

| Platform | Penyebab | Mitigasi |
|----------|----------|----------|
| Browser | Segment start sebelum `getPage()` / navigasi; `startJobRecording` di-skip saat segment mode | `ensureSegmentRecordingStarted` dipanggil dari `getPage()`; pending segment disimpan sampai browser siap |
| Browser (Windows) | `AUTOMATION_HEADLESS=true` + puppeteer-screen-recorder | Set `AUTOMATION_HEADLESS=false` untuk rekaman yang terlihat |
| Browser | ffmpeg path salah | `AUTOMATION_FFMPEG_PATH` + cek ukuran file setelah stop (<10 KB = warning di log) |
| Mobile | `startMobileSegment` dipanggil sebelum `mobile_launch_app` | Retry setelah launch app / session aktif |
| Keduanya | Session reuse antar TC; recording per TC via segment start/stop | Orchestrator `cleanupJobPlatforms` hanya di akhir job (`multi-test-bridge` finally) |

### Hasil per test case (UI)

Chat job terminal menampilkan blok **RESULT** per TC: judul, status, ringkasan (markdown), gallery screenshot TC tersebut, dan player video `tc-NN.mp4`. Payload WS: `testCaseResults[]` (struktur) + field `result` (markdown gabungan untuk copy/search).
