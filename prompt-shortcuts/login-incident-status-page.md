---
label: 🔑 Login Incident status page
variant: green
platform: browser
url: http://192.168.20.27:11011/login
defaults:
  username: ""
  password: ""
---
# Login Page
1. Buka halaman login incident status http://192.168.20.27:11011/login
2. Tunggu hingga halaman selesai dimuat dan form login ditampilkan.
3. Isi field username dengan {username}.
4. Isi field password dengan {password}.
5. Klik tombol login.
6. Tunggu hingga proses autentikasi selesai.
7. Verifikasi login berhasil dengan memastikan halaman incident status atau dashboard pengguna ditampilkan, bukan form login.
8. Verifikasi tidak ada pesan error autentikasi yang terlihat di halaman.
