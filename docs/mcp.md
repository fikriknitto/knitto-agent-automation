# mcp.md — Model Context Protocol

---

## Pendahuluan

Dokumen ini menjelaskan bagaimana bridge AI memanggil tool automation lewat **MCP**: in-process (Gemini/9Router) vs stdio subprocess (Cursor), plus **katalog tool** yang di-`registerTool` untuk browser dan mobile.

---

## Tujuan Dokumen

- Mempertegas dua mode transport dan dampaknya ke session/recording/cleanup
- Mendaftar tool MCP yang tersedia di masing-masing server
- Acuan saat menambah tool atau mengubah env MCP

---

## Ruang Lingkup

Mencakup: registrasi tool (nama + fungsi ringkas), env job, segment managed flags, cleanup spawn.

Schema input/output lengkap: sumber di `apps/backend/src/{automation,mobile-automation}/libs/tools/`.

---

## 1. Entry points & registrasi

| Server | Entry | Registry export |
|--------|-------|-----------------|
| Browser | `apps/backend/src/automation/mcp-stdio-server.ts` | `automation/libs/registry.ts` |
| Mobile | `apps/backend/src/mobile-automation/mcp-stdio-server.ts` | `mobile-automation/libs/registry.ts` |

Klien in-process memuat tool yang sama lewat `in-process-mcp-client.ts` (browser / mobile).

Env builder: `services/shared/automation-mcp-config.ts` (`automationMcpEnv`, `mobileMcpEnv`).

Urutan di stdio server = urutan `server.registerTool(...)`.

---

## 2. Browser MCP — tools terdaftar

Prefix: `automation_*`. Total **20** tool.

| Tool | Fungsi ringkas |
|------|----------------|
| `automation_get_app_memory` | Baca memory web (`memory/{appId}.md`) |
| `automation_update_app_memory` | Tulis/update memory (prefer upsert section) |
| `automation_navigate` | Buka URL di sesi browser |
| `automation_get_page_snapshot` | Snapshot aksesibilitas + ref elemen (`e12`, …) |
| `automation_click` | Klik via semantic locator |
| `automation_click_at` | Klik koordinat (x, y) |
| `automation_fill` | Isi input via locator |
| `automation_assert_text` | Assert teks di body (contains / exact / regex) |
| `automation_assert_visible` | Assert elemen locator terlihat |
| `automation_take_screenshot` | Screenshot PNG bukti |
| `automation_scroll` | Scroll halaman / ke elemen |
| `automation_press_key` | Kirim key (Enter, Tab, dll.) |
| `automation_hover` | Hover elemen |
| `automation_select_option` | Pilih opsi `<select>` / combo |
| `automation_wait_for` | Tunggu locator / teks / timeout |
| `automation_go_back` | History back |
| `automation_go_forward` | History forward |
| `automation_upload_file` | Upload file ke input (dari storage) |
| `automation_close_browser` | Tutup sesi Puppeteer |
| `automation_stop_test_case_segment` | Stop video segment multi-TC (orchestrator / Cursor) |

Locator: ref snapshot, `role`+`name`, label/placeholder/teks — lihat [browser.md](browser.md).

---

## 3. Mobile MCP — tools terdaftar

Prefix: `mobile_*`. Total **16** tool.

| Tool | Fungsi ringkas |
|------|----------------|
| `mobile_launch_app` | Launch / activate app (`appPackage`, opsional deep link) |
| `mobile_get_screen_snapshot` | Snapshot UI hierarchy + ref |
| `mobile_tap` | Tap via semantic locator |
| `mobile_tap_at` | Tap koordinat layar (px) |
| `mobile_scroll` | Scroll / swipe |
| `mobile_input_text` | Isi EditText / input via locator |
| `mobile_take_screenshot` | Screenshot PNG layar Android |
| `mobile_upload_file` | Push file ke device + set path input |
| `mobile_get_app_memory` | Baca memory mobile (`memory/mobile/`) |
| `mobile_update_app_memory` | Update memory mobile |
| `mobile_press_key` | Key Android: BACK, HOME, ENTER, TAB, DEL, MENU |
| `mobile_assert_visible` | Assert elemen locator terlihat |
| `mobile_wait_for` | Tunggu locator / teks di source / timeout |
| `mobile_close_app` | Force-stop app (`terminateApp`); session tetap hidup |
| `mobile_close_session` | Hapus sesi Appium + release device pool |
| `mobile_stop_test_case_segment` | Stop video segment multi-TC |

Urutan close single-TC: **`mobile_close_app` → `mobile_close_session`**. Multi-TC: agent dilarang close — orchestrator yang memanggil (lihat [hybrid.md](hybrid.md), [mobile.md](mobile.md)).

---

## 4. Ringkasan banding

| Area | Browser | Mobile |
|------|---------|--------|
| Buka konteks | `automation_navigate` | `mobile_launch_app` |
| Snapshot | `automation_get_page_snapshot` | `mobile_get_screen_snapshot` |
| Interaksi utama | click / fill / select / hover | tap / input_text / scroll |
| Assert | text + visible | visible |
| Navigasi history | go_back / go_forward | — (pakai `press_key` BACK) |
| Tutup | `close_browser` | `close_app` lalu `close_session` |
| Segment multi-TC | `automation_stop_test_case_segment` | `mobile_stop_test_case_segment` |
| Memory | `automation_*_app_memory` | `mobile_*_app_memory` |

Hybrid (browser + mobile dalam satu job): agent memakai **kedua** set tool sesuai platform TC — bridged lewat composite / orchestrator, bukan satu MCP server gabungan.

---

## 5. In-process

Client MCP di process backend yang sama dengan map session Puppeteer/Appium. Cocok untuk Gemini/9Router dan cleanup `cleanupMode: "in-process"`.

---

## 6. Cursor stdio

```mermaid
sequenceDiagram
    participant BE as Backend Cursor runner
    participant Child as MCP stdio process
    participant Driver as Puppeteer/Appium
    BE->>Child: spawn + env JOB_ID / MULTI_TC / package
    Child->>Driver: tools
    BE->>Child: stop segment / cleanup tools spawn terpisah
```

- Saat `segmentManaged: true` → `AUTOMATION_MULTI_TC=1` / `MOBILE_MULTI_TC=1`
- Cleanup close: `segmentManaged: false` + `FORCE_CLOSE=1`, dan **menghapus** MULTI_TC dari env agar close guard tidak memblokir

### Risiko

Mobile MCP bootstrap:

```ts
if (recordVideo && MOBILE_MULTI_TC !== "1") await createSession();
```

Pada spawn cleanup, MULTI_TC kosong + record on → **session baru** (app relaunch). Lihat [mobile.md](mobile.md) § pitfall.

---

## 7. Close guard

`isMultiTcCloseBlocked(jobId)` — block `automation_close_browser` / `mobile_close_app` / `mobile_close_session` selama job multi-TC managed, kecuali `FORCE_CLOSE`.

---

## 8. Docker MCP

`docker.env`: `AUTOMATION_MCP_COMMAND=node`, path ke `dist/.../mcp-stdio-server.js` (compiled), bukan `tsx` source.
