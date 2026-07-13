## [tc-03-portal-cek-status-order]

## Portal - Cek Status Order (tc-03)

- URL: https://portal.knitto.org/list-order/zWLX5ymm7x7em7yMapGk (Status Order)
- Filter: Status=Semua, Jenis Order=Semua
- Order card fields: Status badge, No Order, Cabang, Nomor Resi, Total Bayar, tombol LIHAT RINCIAN
- Order terbaru biasanya di kartu paling atas
- Verified OH130726020: Status=Menunggu Konfirmasi Admin, Cabang=BANDUNG HOLIS, Nomor Resi=-, Total Bayar=Rp 0
- LIHAT RINCIAN: klik tidak mengubah URL (tetap di list-order); detail/expand tidak selalu terlihat di snapshot interactive
- Snapshot interactive jarang memuat teks No Order — verifikasi via assert_text / screenshot
- Assert "Rp 0" bisa gagal (format/NBSP); gunakan assert No Order + Status + Cabang + screenshot
- Jangan close browser di multi-TC
