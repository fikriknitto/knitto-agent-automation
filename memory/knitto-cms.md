# Knitto CMS (http://192.168.20.27:5420)

## Modal rules (global)
- Submit form: klik Simpan/Save/Submit — snapshot ulang di dalam modal; ref bergeser dari konteks list
- Jangan tutup modal dengan Escape (tool diblokir)
- Tutup/batal: klik Batal/Cancel, tombol X/Tutup, atau click_at di backdrop luar bbox modal
- Setelah isi form lengkap, jangan klik Batal/X/backdrop kecuali user minta batal

## List page column search (global)
- Filter kolom tabel (mis. nama kain web, warna kain, slug, kategori): `automation_fill` keyword target → tunggu baris terfilter → klik baris/edit yang cocok
- Setelah memasukkan keyword yang sesuai, **tekan Enter opsional** — cukup klik hasil jika list sudah terfilter; gunakan Enter hanya bila UI belum memfilter otomatis

## Navigasi Menu (flow ke halaman target)
1. **Snapshot** — cek apakah ada **icon menu hamburger** di **pojok kanan atas** (role=button, div+svg, name "Menu" / "Icon button").
2. **Klik icon hamburger** — `automation_click` dengan `clickCenter:true` jika icon kecil; `automation_wait_for` sampai daftar menu muncul.
3. **Snapshot ulang** — baca menuitem/link yang terbuka.
4. **Cari menu target** — pilih item yang **namanya sama** atau **mendekati** permintaan user (partial match, kata kunci).
5. **Klik menu tersebut** — `automation_click` pada menuitem/link (locator `ref` dari snapshot, atau `role`+`name` / `text`).
6. **Tunggu & cek navigasi** — `automation_wait_for` type=network_idle; snapshot/cek URL atau konten halaman baru sudah muncul.
7. **Retry jika belum navigate** (ulangi sampai **3 kali** per menu):
   - Attempt 1: `automation_click` menu item
   - Jika halaman belum berubah → Attempt 2: `automation_click` **parent** menu item (wrapper/li/div pembungkus dari snapshot atau elemen induk terdekat)
   - Jika masih belum navigate → Attempt 3: `automation_click_at` pada pusat bbox menu (x,y dari snapshot)
   - Setelah setiap attempt: `automation_wait_for` + snapshot untuk verifikasi navigasi; stop jika sudah berhasil
8. **Snapshot lagi** sebelum interaksi berikutnya.

Contoh: user minta "Content Manager" → klik item yang text/name mengandung "Content Manager".


## Dropdown selection (global)
- Buka dropdown: `automation_click` pada field/trigger combobox, atau `automation_select_option` untuk native `<select>`
- Setelah menu dropdown terbuka (listbox / daftar option terlihat di snapshot):
  1. `automation_get_page_snapshot` — cari item yang **teksnya sama** atau **mengandung** nilai yang dicari (exact match dulu, lalu partial/contains)
  2. `automation_click` item tersebut (`role=option`, `role=menuitem`, atau `text` locator); jika gagal, `automation_click_at` pada bbox center opsi
  3. Alternatif keyboard: `automation_press_key` **ArrowDown** / **ArrowUp** sampai item aktif sesuai target, lalu **Enter**
- Dropdown dengan search/filter: isi field pencarian dulu (`automation_fill`) dengan keyword yang sesuai → `automation_wait_for` hasil filter muncul → klik baris yang teksnya cocok/mengandung target. **Enter opsional** setelah isi keyword (boleh `automation_press_key` Enter jika filter belum muncul; jika hasil sudah terfilter, langsung klik baris tanpa Enter)
- Jangan gunakan Escape untuk menutup dropdown (tool diblokir); pilih option atau klik di luar menu

## Login Page
- URL: http://192.168.20.27:5420/
- Title: CMS Knitto
- Direct login page (no redirect needed)

## Login Form Elements
- Username input: placeholder "Username" (ref e1)
- Password input: placeholder "Password" (ref e2)
- LOGIN button: role=button, name "LOGIN" (ref e3)
- Password visibility toggle: Icon button (ref e4/e5) near password field

## Notes
- Page loads with networkidle2
- No hamburger menu on login page
- Channel: automation-default


## Sidebar menu items (div Tailwind)
- Item menu CMS sering berupa `div` dengan `cursor-pointer` + teks (mis. "Rekomendasi Kain & Hasil 1Kg"), tanpa `role`/`tabindex`.
- Snapshot sekarang menangkap sebagai `role=menuitem`, `tag=div`, dengan `ref` + `bbox`.
- Klik via: `automation_click` `{ ref: "e..." }` atau `{ text: "Rekomendasi Kain" }` atau `{ role: "menuitem", name: "Rekomendasi Kain" }`.
- `title` pada child div (truncate) ikut dipakai sebagai `name` di snapshot.

## Test run (2026-06-19)
- Channel: automation-default
- Navigated to http://192.168.20.27:5420/ — title "CMS Knitto"
- Login page verified: Username (e1), Password (e2), LOGIN button (e3), password toggle icon (e4/e5)
- Screenshot saved: login-page.png


## Session 2026-06-23 (banner item 3 image update)
- Login: fikri/11221122 → /content-manager
- Edit banner 3: click middle edit button on row 3 (ref e18 in list context)
- Banner image file inputs: e24 = Desktop, e27 = Tablet (inputType=file, hidden — use automation_upload_file directly)
- Upload paths: banner-desktop.png (desktop), banner-tablet.png (tablet)
- Save: Simpan button ref e18 in edit modal
- After save: modal closes, returns to banner list dashboard
- Scroll up in modal to reach Simpan if button off-viewport

## Session 2026-06-23 (banner item 3 tablet image only)
- Channel: automation-default
- Task: update banner item 3 tablet image only (banner-tablet.png)
- Login fikri/11221122 → /content-manager
- Edit row 3: middle edit button ref e18 (list context; refs shift in edit modal)
- In edit modal: click Tablet tab (e20) before upload
- Tablet file input: e27 (inputType=file, hidden — automation_upload_file works directly)
- Desktop file input: e24
- Scroll up inside modal (locator e16) to reach Simpan (e18 in modal context)
- After Simpan: modal closes, returns to banner list; row 3 shows "ini adalah automation ID"

## Session 2026-06-23 (banner item 2 desktop image update)
- Channel: automation-default
- Task: update banner item 2 desktop image only (banner-desktop.png)
- Login fikri/11221122 → /content-manager
- Edit row 2: middle edit button ref e14 in list context (y~463); row 2 title "Promo 3.3"
- In edit modal: Desktop tab ref e15; Desktop file input ref e20 (inputType=file, hidden)
- Tablet file input ref e23 in same modal context
- Scroll up inside modal (locator e12) to reach Simpan (e14 in modal context)
- After Simpan: modal closes, returns to banner list

## Session 2026-06-23 (banner item 3 desktop webp image update)
- Channel: automation-default
- Task: update banner item 3 desktop image only (banner-desktop.webp)
- Login fikri/11221122 → /content-manager
- Edit row 3: middle edit button ref e19 in list context (y~511); row 3 title "ini adalah automation ID"
- In edit modal: Desktop tab ref e19; Desktop file input ref e24 (inputType=file, hidden — automation_upload_file works directly)
- Tablet file input ref e27 in same modal context
- Upload path: banner-desktop.webp (WebP format for Desktop banner)
- Scroll up inside modal (locator e16) to reach Simpan (e18 in modal context)
- After Simpan: modal closes, returns to banner list; row 3 shows "ini adalah automation ID"

## Session 2026-06-23 (banner item 4 full update)
- Channel: automation-default
- Task: update banner item 4 — desktop webp image + button ID/EN fields
- Login fikri/11221122 → /content-manager (already on Banner page after login)
- Banner rows: 1=Beli Kain..., 2=Promo 3.3, 3=Promo Akhir Tahun 2027 !!, 4=ini adalah automation ID
- Edit row 4: middle edit button ref e22 in list context (y~625); LEFT button (e21) is DELETE — avoid!
- Edit modal opens with title "4" (banner number)
- Desktop tab ref e23; file inputs (hidden, use interactiveOnly:false snapshot): e28=PNG, e31=WebP
- WebP desktop upload: automation_upload_file ref e31 with banner-1.webp path
- Button Banner ID: e35=text "belanja sekarang", e36=URL https://webdev.knitto.org/shop
- Button Banner EN: e37=text "shop now", e38=URL https://webdev.knitto.org/en/shop
- Scroll up inside modal (locator e20) to reach Simpan (e22 in modal context)
- After Simpan: modal closes, returns to banner list; row 4 shows "ini adalah automation ID"
- Upload file used: C:/Users/Fikri/Pictures/banner-hero/dekstop/banner-1.webp (gambar 1)

## Session 2026-06-23 (banner item 4 desktop webp image only)
- Channel: automation-default
- Task: update banner item 4 desktop image only (banner-desktop.webp)
- Login fikri/11221122 → /content-manager
- Edit row 4: middle edit button ref e22 in list context (y~625); row 4 title "ini adalah automation ID"
- LEFT button (e21) is DELETE — avoid!
- In edit modal: Desktop tab default; file inputs (hidden, interactiveOnly:false): e28=PNG, e31=WebP
- WebP desktop upload: automation_upload_file ref e31 with banner-desktop.webp
- Upload path: C:\Users\Fikri\Desktop\PERSONAL\knitto-browser-agent\screenshoot\uploads\job-mqqb0wmw-ro7yup\banner-desktop.webp
- Scroll up inside modal (locator e20) to reach Simpan (e22 in modal context)
- After Simpan: modal closes, returns to banner list; row 4 shows "ini adalah automation ID" with expanded preview
- Screenshots: banner4-webp-uploaded.png, banner4-saved.png

## Session 2026-06-23 (banner item 1 text update)
- Channel: automation-default
- Task: update banner item 1 Text Banner ID/EN fields
- Login fikri/11221122 → /content-manager (Banner page)
- Edit row 1: middle edit button ref e10 in list context (y~349); LEFT button (e9) is DELETE — avoid!
- In edit modal: Text Banner ID ref e22 (placeholder "Input Text Banner Bahasa Indonesia"); Text Banner EN ref e23 (placeholder "Input Text Banner Bahasa Inggris")
- Values set: ID="Beli Bahan kualiatas dewa", EN="Buy premium-quality materials."
- Scroll up inside modal (locator e8) to reach Simpan (e10 in modal context)
- After Simpan: modal closes, row 1 list shows "Beli Bahan kualiatas dewa"
- Screenshot: banner1-text-updated.png

## Session 2026-06-29 (Warna Kain — upload foto produk MAROON)
- Channel: automation-default
- Task: update foto produk for COTTON COMBED 30S / MAROON / PLAIN
- Login fikri/11221122 → sidebar toggle ref e25/e30 (top-left) → menu "Warna Kain (Detail Kain)" ref e33
- List URL: /content-manager/belanja/warna-kain
- Filter column inputs (header row y~194): e6=Nama Kain Web, e7=Warna Kain, e8=Kategori Kain Web & Portal — fill value + Enter each
- Row action buttons (per row, x~1260-1288): LEFT e22 = edit (pencil) → /warna-kain/{id}/edit; RIGHT e23 = history (read-only) — do NOT use e23 for edit
- Edit page: sidebar tab "foto produk" ref e104; scroll down to Upload Foto section
- Upload Foto file input: e43 (inputType=file, hidden — automation_upload_file works directly); label e42 "Upload Foto"
- Additional file inputs in foto section: e33, e37, e41 (per photo slot)
- Save: Simpan button ref e8 (top-right header on edit page, not modal)
- Upload path used: C:\Users\Fikri\Desktop\APP\knitto-agent-browser\storage\cot-bamboo-24s-putih-netral-1 (1).webp
- Verified: COTTON COMBED and PLAIN visible on edit page after save; remained on /warna-kain/2/edit
