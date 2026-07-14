---
label: Take Order
icon: "📦"
variant: amber
platform: browser
url: http://192.168.20.27:5367/
defaults:
  order_dari: TOKO
  cari_customer: 28886351120
  jenis_pengiriman: DIKIRIM
  penanggung_ongkir: CUSTOMER - DIBAYAR SAAT KIRIM
  jenis_packing: KARUNG
  jenis: KAIN
  nama_kain_nama_barang: COMBED 20S
  warna: ABU MUDA
  qty_kg: 1
  catatan: ini catatan automation
---
1. Pada header klik Button "Take Order" setelah muncul dropdown lalu klik "Take Order" 
2. Click Dropdown "Order Dari", snapshot daftar opsi, lalu pilih opsi yang teksnya **exact** `{order_dari}` (bukan partial/contains). Contoh: target `TOKO` → klik opsi `TOKO`, **jangan** pilih `TOKOPEDIA` meskipun mengandung "TOKO". Jangan hanya fill + Enter/ArrowDown tanpa verifikasi; setelah dipilih pastikan field menampilkan exact `{order_dari}`.
3. Jangan Klik Button "+" tapi Klik Input Customer dan setelah muncul modal/popup, klik  input Pencarian dan cari {cari_customer} dan tekan "Enter" setelah itu klik row pada tabel dan tunggu 500ms lalu klik button "Pilih"
4. Jika muncul popup konfirmasi Gabung order, maka klik icon "X"
5. Click Dropdown "Jenis Pengiriman" lalu cari atau pilih {jenis_pengiriman} dan tekan "Enter" 
6. Click Dropdown "Pengunggung Ongkir" lalu cari atau pilih {penanggung_ongkir} dan tekan "Enter"
7. Click Dropdown "Jenis Packing" lalu cari atau pilih {jenis_packing} dan tekan "Enter"
8. Klik "Ubah Alamat Kirim" lalu klik row pertama pada tabel. dan klik button "Pilih"
9. Klik Button "+ Tambah Item". pada tabel "List Order" tersedia kolom (Jenis, Nama Kain/Nama Barang, Warna, QTY (Pcs), QTY(Roll), Harga Rollan, Qty(Kg), QTY(Yard), Kode SPK/Lot )
10. pilih "Jenis" dengan value {jenis}
11. pilih "Nama Kain / Nama Barang" dengan value {nama_kain_nama_barang} dan tekan "Enter"
12. pilih "Warna" dengan value {warna} dan tekan "Enter"
13. isi QTY(Kg) dengan {qty_kg}
14. isi catatan dengan {catatan}
15. Klik Button "Simpan", tunggu beberapa saat dan akan muncul pesan toast success
16. Jika muncul popup/modal maka klik icon "X" 
17. ambil No Order dari inputan Nomor Order dan simpan ke [HANDOFF] no_order=<nomor_order>
17. Klik Button "Selesai Order"
18. Kalau muncul popup dengan pesan "Apakah ingin menambah aksesoris untuk kain tersebut" maka klik button "Tidak"
    dan kalau muncul popup/modal dengan title "Pilih estimasi order selesai" maka klik button "Cek Estimasi"
19. Kalau muncul popup dengan pesan "Apakah Orderan akan langsung di ambil" maka klik button "Ya" 