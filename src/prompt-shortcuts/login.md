---
label: Login CMS
icon: "⚙️"
variant: amber
order: 1
defaults:
  URL: "http://192.168.20.27:5420"
  USERNAME: "admin"
  PASSWORD: ""
---
TUJUAN:
Login ke CMS dan memastikan dashboard berhasil terbuka.

PARAMETER:
URL={URL}
USERNAME={USERNAME}
PASSWORD={PASSWORD}

LANGKAH:
1. Buka halaman {URL}.
2. Tunggu hingga halaman selesai dimuat.
3. Cari form login.
4. Isi username/email dengan:
   {USERNAME}
5. Isi password dengan:
   {PASSWORD}
6. Klik tombol Login / Sign In / Masuk.
7. Tunggu proses autentikasi selesai.
8. Verifikasi bahwa login berhasil dengan memastikan dashboard atau halaman admin terbuka.
9. Jika muncul popup, notifikasi, atau banner, tutup jika menghalangi.
10. Jika login gagal, ambil pesan error yang muncul dan laporkan.

ATURAN:
- Jangan mengubah data apa pun setelah login.
- Jangan logout.
- Jangan membuka menu yang tidak diperlukan.
- Berhenti setelah dashboard berhasil terbuka.
- Laporkan status akhir login.
