# core/ — otak aplikasi (orchestration, prompts, evidence, mcp)

## Aturan arah dependensi

Boleh:

- `modules/* → core | platforms | agents | infra`
- `agents/* → core | platforms`
- `platforms/browser|mobile → core | platforms/mcp-kit`
- `core/* → core | infra | config`

Dilarang:

- `core → platforms/*` (lihat pengecualian di bawah)
- `platforms/browser ↔ platforms/mobile`
- `infra → core | platforms | agents | modules`

## Pengecualian yang di-defer (TODO(ports))

`core/` saat ini masih mengimpor modul platform berikut secara langsung. Ini utang
yang disengaja — inversi penuh lewat `ports.ts` belum sepadan biayanya. Jangan
menambah edge baru ke daftar ini; kalau butuh fungsionalitas platform dari core,
tambahkan interface di `ports.ts` dan inject dari wiring (`server.ts`).

- `platforms/{browser,mobile}/driver/session` + `recording` + `screenshot` (lifecycle sesi/rekaman dipanggil orchestrator & evidence)
- `platforms/{browser,mobile}/in-process-mcp-client` (hybrid MCP client)
- `platforms/{browser,mobile}/config`
- `platforms/mobile/driver/device-pool`, `session/mobile-job-context`, `session/mobile-session-cleanup`
- `platforms/browser/prompts/*` (teks prompt browser dipakai prompt-builder)

Kontrak yang seharusnya menggantikan edge-edge itu ada di [`ports.ts`](./ports.ts).
