## [tc-03-portal-cek-status-order]

## Portal - Cek Status Order (tc-03) — 2026-07-14 multi-TC 3/3

### Status: PASS

### URL
https://portal.knitto.org/list-order/ga9D1NMPmGg9jL0Jm8Kx

### Handoff masuk
- no_order=OH140726029 (dari TC-01 Take Order)

### Hasil
Order ditemukan di kartu teratas Status Order:
| Field | Nilai |
|---|---|
| No Order | OH140726029 |
| Status | Menunggu Konfirmasi Admin |
| Cabang | BANDUNG HOLIS |
| Nomor Resi | - |
| Total Bayar | Rp 0 |

### Tips UI
- Setelah network_idle, kartu order sudah di DOM (assert text No Order)
- Snapshot interactiveOnly penuh tombol LIHAT RINCIAN; data kartu dibaca via assert_text / screenshot
- Tombol LIHAT RINCIAN bbox pertama ~ (905,163,103×43); click_at center ~(956,184)

### Screenshot
- tc03-portal-list.png / tc03-order-found.png
