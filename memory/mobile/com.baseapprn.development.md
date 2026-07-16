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


## [sidebar-search-typing]

## sidebar-search-typing
- Status: BLOCKED (2026-07-16)
- Package: com.baseapprn.development
- Channel: automation-default1
- Request: buka app RN → buka menu hamburger → pencarian ketik "button"
- Hasil launch: BERHASIL — MainActivity di emulator-5554 setelah relaunch (sesi pertama jatuh ke BlueStacks HomeActivity, relaunch kedua sukses ke MainActivity)
- Hasil interaksi: GAGAL — UiAutomator2 instrumentation process tidak berjalan (crashed)
- Error: snapshot, screenshot, tap_at semua gagal — "cannot be proxied to UiAutomator2 server because the instrumentation process is not running"
- Pemulihan dicoba: close_app → relaunch (2x) → wait 3s — masih gagal
- Alur belum dijalankan: snapshot → tap hamburger → field search → input "button" → verifikasi hasil
- Perbaikan disarankan: restart emulator/BlueStacks, reinstall Appium UiAutomator2 driver, cek logcat crash instrumentation
- Tip dari memori: RN snapshot sering kosong saat sehat; gunakan interactiveOnly=false atau locator text


## [hamburger-menu-button-search]

## hamburger-menu-button-search
- Status: BLOCKED (2026-07-16, percobaan ke-2)
- Package: com.baseapprn.development
- Channel: automation-default1
- Request: buka menu hamburger dan cari button
- Hasil: TIDAK BISA MULAI — `mobile_launch_app` gagal karena Appium tidak reachable di http://127.0.0.1:4723
- Error: "Unable to connect to http://127.0.0.1:4723/, make sure browser driver is running on that address. It seems like the service failed to start or is rejecting any connections."
- Dampak: snapshot, tap hamburger, pencarian button, screenshot, dan verifikasi tidak dapat dieksekusi
- Langkah yang dijalankan: `mobile_get_app_memory` (berhasil) → `mobile_launch_app` (gagal)
- Rekomendasi: start Appium server di port 4723, pastikan emulator/device terhubung (adb devices), dan driver UiAutomator2 tidak crash
- Riwayat: percobaan sebelumnya (sidebar-search-typing) juga gagal karena UiAutomator2 instrumentation crash setelah launch berhasil
