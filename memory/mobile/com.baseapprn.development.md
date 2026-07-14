## [tc-01-test-case-1]

## tc-01-test-case-1
- Package: com.baseapprn.development — Dashboard menampilkan daftar komponen UI.
- Tombol "Text Input" ada di daftar (antara Table dan Toast); tap teks "Text Input".
- Form berisi 3 input (small/medium/large). Nilai uji: small="ini text small broo", medium="ini text medium bro", large="ini text large broo".
- Catatan: snapshot interactiveOnly kadang mengembalikan elements=[] (RN); gunakan interactiveOnly=false atau locator text / tap_at.
- UDID: 127.0.0.1:5555


## [tc-02-test-case-2]

## TC-02 Test Case 2 — automation-default (2026-07-14, multi-TC job 2/3)

### Status: PASS

### Konteks
- Package: `com.baseapprn.development`, device: emulator-5554 (MainActivity)
- Handoff masuk: no_order=OH140726029 (dari TC-01 Take Order)

### Alur
1. `mobile_get_app_memory` lalu `mobile_launch_app`
2. Pastikan fokus Dashboard (bukan launcher); scroll down hingga **Text Input** terlihat
3. Tap **Text Input**
4. Tunggu placeholder Small/Medium/Large
5. Isi:
   - Small → `ini text small broo`
   - Medium → `ini text medium bro`
   - Large → `ini text large broo`
6. Assert ketiga nilai visible; screenshot `tc02-text-input-filled.png`

### Tips
- Snapshot RN sering hampir kosong; pakai locator `text` (placeholder "Small"/"Medium"/"Large")
- Jika sesi jatuh ke launcher (`com.uncube.launcher3`), relaunch sampai activity = `MainActivity`
- Text Input ada di daftar bawah Dashboard (scroll)

### Handoff keluar
- no_order=OH140726029
