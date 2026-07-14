# Otomasi Browser

---

## Pendahuluan

Dokumen ini menjelaskan otomasi **browser** di Knitto Agent Automation: Puppeteer session, MCP tools, semantic locator, dan rekaman video.

---

## Tujuan Dokumen

- Menjelaskan lifecycle browser session per job
- Mendokumentasikan strategi locator dan recording
- Menjadi acuan saat menambah tool `automation_*`

---

## Ruang Lingkup

Mencakup: session, tools, locator, recording, cleanup.

Tidak mencakup hybrid orchestrator (`hybrid.md`) atau MCP transport (`mcp.md`).

---

## 1. Komponen

| Komponen | Path |
|----------|------|
| Session / interactions | `apps/backend/src/automation/libs/browser/` |
| MCP tools | `apps/backend/src/automation/libs/tools/` |
| MCP stdio entry | `apps/backend/src/automation/mcp-stdio-server.ts` |
| Config | `apps/backend/src/automation/libs/config.ts` |

---

## 2. Lifecycle

```mermaid
sequenceDiagram
    participant Agent
    participant MCP
    participant Puppeteer
    Agent->>MCP: automation_navigate / tools
    MCP->>Puppeteer: ensure session
    Puppeteer-->>MCP: page ready
    Note over MCP: recording start (job atau segment TC)
    Agent->>MCP: snapshot / click / fill
    Agent->>MCP: automation_close_browser
    Note over MCP: multi-TC: diblok close guard; orchestrator menutup di akhir
```

---

## 3. Semantic locator

Agent **tidak** diarahkan memakai CSS selector rapuh. Prefer:

- Ref dari snapshot (`e12`, …)
- `role` + `name` (aksesibilitas)
- Label / placeholder / teks terlihat

---

## 4. Recording

| Mode | Mekanisme | Output |
|------|-----------|--------|
| Single job | `puppeteer-screen-recorder` + ffmpeg | `recording.mp4` |
| Multi-TC | Segment per TC | `tc-XX.mp4` |

- `AUTOMATION_HEADLESS=true` di Windows sering menghasilkan video hitam — lokal: `false`
- Env: `AUTOMATION_RECORD_VIDEO`, `AUTOMATION_FFMPEG_PATH`, `AUTOMATION_RECORD_FPS`

---

## 5. Memory

Tools `automation_get_app_memory` / `automation_update_app_memory` → `memory/{appId}.md`. Prefer upsert section.

---

## 6. Cleanup

- Single-TC: agent wajib close browser di akhir (prompt)
- Multi-TC: agent **dilarang** close; `cleanupJobPlatforms` memanggil `automation_close_browser`

Katalog lengkap tool MCP browser: [mcp.md §2](mcp.md#2-browser-mcp--tools-terdaftar).
