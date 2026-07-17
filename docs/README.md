# Dokumentasi Knitto Agent Automation

Ringkasan isi folder `docs/` — indeks untuk arsitektur, fitur, operasional, dan referensi teknis.

Proyek: monorepo **Turborepo + pnpm** (React UI + Express backend) untuk otomasi **browser** (Puppeteer) dan **Android** (Appium) lewat AI agent (Gemini / Cursor / 9Router) + **MCP tools**.

Panduan setup & menjalankan aplikasi: [README root](../README.md).

---

## Jalur baca

| Fokus | Urutan |
|-------|--------|
| Arsitektur & fitur | [system.md](system.md) → [features.md](features.md) → [browser.md](browser.md) / [mobile.md](mobile.md) |
| Hybrid multi-TC & contoh prompt | [features.md](features.md) → [hybrid.md](hybrid.md) |
| Deploy & env | [docker.md](docker.md) → [environment.md](environment.md) → [troubleshooting.md](troubleshooting.md) |
| REST, WS & MCP | [api.md](api.md) → [mcp.md](mcp.md) |

---

## Indeks dokumen

### Inti produk & arsitektur

| Dokumen | Isi singkat |
|---------|-------------|
| [system.md](system.md) | High-level architecture, monorepo, alur single-job & hybrid multi-TC, persistence, prinsip desain |
| [features.md](features.md) | Kontrak fitur: UI, bridges, browser/mobile, hybrid, shortcuts, memory, evidence, file manager, Docker |
| [hybrid.md](hybrid.md) | Orchestrator multi-TC, handoff, segment video, format baris TC, **contoh prompt** |
| [browser.md](browser.md) | Lifecycle Puppeteer, semantic locator, recording, memory browser, cleanup |
| [mobile.md](mobile.md) | Appium/ADB, device pool, tools mobile, recording, cleanup tanpa relaunch, stabilitas & recovery BlueStacks |

### Protokol & integrasi

| Dokumen | Isi singkat |
|---------|-------------|
| [mcp.md](mcp.md) | Entry MCP browser/mobile, daftar tools, in-process vs Cursor stdio, close guard |
| [api.md](api.md) | REST endpoints + WebSocket hub (`user_prompt`, events job) |

### Operasional

| Dokumen | Isi singkat |
|---------|-------------|
| [docker.md](docker.md) | Compose services, dual ADB, volume/mount, checklist emulator → Appium |
| [environment.md](environment.md) | Variabel `.env` backend, frontend, dan Docker |
| [troubleshooting.md](troubleshooting.md) | Gejala umum & solusi |

---

## Peta konsep cepat

```text
UI (React) ──WS /ws──► Backend hub
                         ├── Bridge Gemini / Cursor / 9Router
                         ├── Orchestrator (hybrid multi-TC)
                         └── MCP
                              ├── Browser (Puppeteer)
                              └── Mobile (Appium)
```

- **1 job single platform** → satu agent run + video/screenshot
- **Hybrid multi-TC** → beberapa `## Test Case N`; 1 TC = 1 video; handoff `[HANDOFF] KEY=value`
- **Memory** → `memory/{host}.md` atau `memory/{ip}-{port}.md`; mobile → `memory/mobile/{package}.md` (upsert section `## [key]`)
- **Shortcuts** → `prompt-shortcuts/*.md` (label, URL/package, variabel)

---

## Konvensi dokumen

Tiap file domain biasanya punya: **Pendahuluan → Tujuan → Ruang Lingkup → bagian teknis**.

Saat menambah fitur besar: update [features.md](features.md), lalu dokumen domain terkait, dan tautkan dari tabel di atas.
