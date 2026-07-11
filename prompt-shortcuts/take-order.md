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
  penanggung_ongkir: CUSTOMER - DIBAYAR SAAT DIKIRIM
  jenis_packing: KARUNG
  jenis: KAIN
  nama_kain_nama_barang: COMBED 20S
  warna: ABU MUDA
  qty_kg: 1
---

1. Pada header klik Button "Take Order" setelah muncul dropdown lalu klik "Take Order" 
2. Click Dropdown "Order Dari" lalu cari atau pilih {order_dari}
3. Klik Input Customer(jangan klik button "+") dan setelah muncul modal/popup, cari {cari_customer} Lalu klik row pada tabel dan tunggu 500ms lalu klik button "Pilih"
4. Jika muncul popup konfirmasi Gabung order, maka klik icon "X"
5. Click Dropdown "Jenis Pengiriman" lalu cari atau pilih {jenis_pengiriman} lalu 
6. Click Dropdown "Pengunggung Ongkir" lalu cari atau pilih {penanggung_ongkir}
7. Click Dropdown "Jenis Packing" lalu cari atau pilih {jenis_packing}
8. Klik "Ubah Alamat Kirim" lalu klik row pertama pada tabel. dan klik button "Pilih"
9. Klik Button "+ Tambah Item". pada tabel "List Order" tersedia kolom (Jenis, Nama Kain/Nama Barang, Warna, QTY (Pcs), QTY(Roll), Harga Rollan, Qty(Kg), QTY(Yard), Kode SPK/Lot )
10. pilih "Jenis" dengan value {jenis}
11. pilih "Nama Kain / Nama Barang" dengan {nama_kain_nama_barang}
12. pilih "Warna" dengan value {warna}
13. isi QTY(Kg) dengan {qty_kg}
14. Klik Button "Simpan", tunggu beberapa saat dan akan muncul pesan toast success
15. Jika muncul popup/modal maka klik icon "X" 
16. Klik Button "Selesai Order"