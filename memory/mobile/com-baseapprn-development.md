## Text Input Flow — mobil 2 (2026-07-03)

### Navigasi
- Dari layar utama, tap tombol **Text Input** via locator `text: "Text Input"`.
- Jika tap gagal, scroll down lalu gunakan `mobile_wait_for` type text.

### Form Input
- Tiga field: **Small**, **Medium**, **Large**.
- Nilai uji mobil 2:
  - Small → `ini small dari mobil 2`
  - Medium → `ini medium dari mobil 2`
  - Large → `ini large dari mobil 2`

### Verifikasi
- `mobile_assert_visible` pada ketiga nilai di atas — semua berhasil.

### Catatan
- UI snapshot sering kosong (React Native); text locator tetap berfungsi.
- Screenshot: `text-input-start.png`, `text-input-screen.png`, `text-input-filled.png`.
## Text Input Flow — mobil 3 (2026-07-03)

### Navigasi
- Dari layar utama, tap tombol **Text Input** via locator `text: "Text Input"`.

### Form Input
- Tiga field: **Small**, **Medium**, **Large**.
- Nilai uji mobil 3:
  - Small → `ini text small mobile 3`
  - Medium → `ini text medium mobile 3`
  - Large → `ini text large mobile 3`

### Verifikasi
- `mobile_assert_visible` pada ketiga nilai di atas — semua berhasil (visible: true).

### Catatan
- UI snapshot tetap kosong (React Native); text locator berfungsi untuk tap dan input.
- Screenshot: `text-input-mobile-3-filled.png`.
## Text Input Flow — mobil 2 (2026-07-03, sesi terbaru)

### Navigasi
- Dari layar utama, tap tombol **Text Input** via locator `text: "Text Input"`.
- UI snapshot sering kosong (React Native); text locator tetap berfungsi.

### Form Input
- Tiga field: **Small**, **Medium**, **Large**.
- Nilai uji mobil 2 (sesi ini):
  - Small → `ini text small mobile 2`
  - Medium → `ini text medium mobile 2`
  - Large → `ini text large mobile 2`

### Verifikasi
- `mobile_assert_visible` pada ketiga nilai di atas — semua berhasil.

### Screenshot
- `text-input-screen.png`, `text-input-filled-mobile2.png`
## Text Input Flow — mobil 1 (2026-07-03)

### Navigasi
- Dari layar utama, scroll down jika tombol **Text Input** tidak terlihat.
- Tap tombol **Text Input** via locator `text: "Text Input"`.
- Gunakan `mobile_wait_for` type text jika tap gagal pertama kali.

### Form Input
- Tiga field: **Small**, **Medium**, **Large**.
- Nilai uji mobil 1:
  - Small → `ini text small mobile 1`
  - Medium → `ini text medium mobile 1`
  - Large → `ini text large mobile 1`

### Verifikasi
- `mobile_assert_visible` pada ketiga nilai di atas — semua berhasil.

### Catatan
- UI snapshot sering kosong (React Native); text locator tetap berfungsi untuk tap dan input.
- Screenshot: `text-input-start.png`, `text-input-filled.png`.
## Text Input Flow — mobil 3 (2026-07-03, sesi ulang)

### Navigasi
- Dari layar utama, tap tombol **Text Input** via locator `text: "Text Input"`.
- UI snapshot kosong (React Native); text locator tetap berfungsi.

### Form Input
- Tiga field: **Small**, **Medium**, **Large**.
- Nilai uji mobil 3 (sesi ini):
  - Small → `ini text small mobile 3`
  - Medium → `ini text medium mobile 3`
  - Large → `ini text large mobile 3`

### Verifikasi
- `mobile_assert_visible` pada ketiga nilai di atas — semua berhasil (visible: true).

### Screenshot
- `text-input-mobile-3-start.png`, `text-input-mobile-3-filled.png`
## Text Input Flow — mobil 2 (2026-07-03, sesi automation-default)

### Navigasi
- Dari layar utama, tap tombol **Text Input** via locator `text: "Text Input"`.
- UI snapshot kosong (React Native); text locator tetap berfungsi.

### Form Input
- Tiga field: **Small**, **Medium**, **Large**.
- Nilai uji mobil 2 (sesi ini):
  - Small → `ini text small mobile 2`
  - Medium → `ini text medium mobile 2`
  - Large → `ini text large mobile 2`

### Verifikasi
- `mobile_assert_visible` pada ketiga nilai di atas — semua berhasil (visible: true).

### Screenshot
- `text-input-screen-mobile2.png`, `text-input-filled-mobile2.png`
## Text Input Flow — mobil 1 (2026-07-03, sesi terbaru)

### Navigasi
- Dari layar utama, scroll down jika tombol **Text Input** tidak terlihat.
- Tap tombol **Text Input** via locator `text: "Text Input"`.
- UI snapshot sering kosong (React Native); text locator tetap berfungsi.

### Form Input
- Tiga field: **Small**, **Medium**, **Large**.
- Nilai uji mobil 1 (sesi ini):
  - Small → `ini text small mobile 1`
  - Medium → `ini text medium mobile 1`
  - Large → `ini text large mobile 1`

### Verifikasi
- `mobile_assert_visible` pada ketiga nilai di atas — semua berhasil (visible: true).

### Screenshot
- `text-input-start.png`, `text-input-screen.png`, `text-input-filled.png`
## Text Input Flow — mobil 1 (2026-07-03, sesi automation-default)

### Navigasi
- Dari layar utama, scroll down karena tombol **Text Input** tidak terlihat di awal.
- `mobile_wait_for` type text "Text Input" lalu tap via locator `text: "Text Input"`.
- UI snapshot kosong (React Native); text locator tetap berfungsi.

### Form Input
- Tiga field: **Small**, **Medium**, **Large**.
- Nilai uji mobil 1 (sesi ini):
  - Small → `ini text small mobile 1`
  - Medium → `ini text medium mobile 1`
  - Large → `ini text large mobile 1`

### Verifikasi
- `mobile_assert_visible` pada ketiga nilai di atas — semua berhasil (visible: true).

### Screenshot
- `text-input-start-mobile1.png`, `text-input-filled-mobile1.png`
## Text Input Flow — mobil 3 hehehe (2026-07-03, channel automation-default)

### Navigasi
- Dari layar utama, tap tombol **Text Input** via locator `text: "Text Input"`.
- UI snapshot kosong (React Native); text locator tetap berfungsi.

### Form Input
- Tiga field: **Small**, **Medium**, **Large**.
- Nilai uji mobil 3 (sesi ini):
  - Small → `ini text small mobile 3 hehehe`
  - Medium → `ini text medium mobile 3 hehehe`
  - Large → `ini text large mobile 3 hehehe`

### Verifikasi
- `mobile_assert_visible` pada ketiga nilai di atas — semua berhasil (visible: true).

### Screenshot
- `text-input-mobile-3-hehehe-filled.png`
## Text Input Flow — mobil 2 (2026-07-03, channel automation-default)

### Navigasi
- Dari layar utama, tap tombol **Text Input** via locator `text: "Text Input"`.
- UI snapshot kosong (React Native); text locator tetap berfungsi.

### Form Input
- Tiga field: **Small**, **Medium**, **Large**.
- Nilai uji mobil 2 (sesi ini):
  - Small → `ini text small mobile 2`
  - Medium → `ini text medium mobile 2`
  - Large → `ini text large mobile 2`

### Verifikasi
- `mobile_assert_visible` pada ketiga nilai di atas — semua berhasil (visible: true).

### Screenshot
- `text-input-filled-mobile2-automation-default.png`
## Text Input Flow — mobil 1 (2026-07-03, channel automation-default, sesi terbaru)

### Navigasi
- Dari layar utama, scroll down karena tombol **Text Input** tidak terlihat di awal (wait_for timeout 10s).
- Tap tombol **Text Input** via locator `text: "Text Input"` — berhasil.
- UI snapshot kosong (React Native); text locator tetap berfungsi.

### Form Input
- Tiga field: **Small**, **Medium**, **Large**.
- Nilai uji mobil 1 (sesi ini):
  - Small → `ini text small mobile 1`
  - Medium → `ini text medium mobile 1`
  - Large → `ini text large mobile 1`

### Verifikasi
- `mobile_assert_visible` pada ketiga nilai di atas — semua berhasil (visible: true).

### Screenshot
- `text-input-start-mobile1.png`, `text-input-filled-mobile1.png`
## Text Input Flow — mobil 1 (2026-07-03, channel automation-default, sesi terbaru)

### Navigasi
- Dari layar utama, scroll down karena tombol **Text Input** tidak terlihat di awal (wait_for timeout 10s).
- Tap tombol **Text Input** via locator `text: "Text Input"` — berhasil.
- UI snapshot kosong (React Native); text locator tetap berfungsi.

### Form Input
- Tiga field: **Small**, **Medium**, **Large**.
- Nilai uji mobil 1 (sesi ini):
  - Small → `ini text small mobile 1`
  - Medium → `ini text medium mobile 1`
  - Large → `ini text large mobile 1`

### Verifikasi
- `mobile_assert_visible` pada ketiga nilai di atas — semua berhasil (visible: true).

### Screenshot
- `text-input-start-mobile1.png`, `text-input-filled-mobile1.png`
## Text Input Flow — mobil 2 (2026-07-03, channel automation-default, sesi terbaru)

### Navigasi
- Dari layar utama, scroll down karena tombol **Text Input** tidak terlihat di awal (wait_for timeout 10s).
- Tap tombol **Text Input** via locator `text: "Text Input"` — berhasil.
- UI snapshot kosong (React Native); text locator tetap berfungsi.

### Form Input
- Tiga field: **Small**, **Medium**, **Large**.
- Nilai uji mobil 2 (sesi ini):
  - Small → `ini text small mobile 2`
  - Medium → `ini text medium mobile 2`
  - Large → `ini text large mobile 2`

### Verifikasi
- `mobile_assert_visible` pada ketiga nilai di atas — semua berhasil (visible: true).

### Screenshot
- `text-input-start-mobile2.png`, `text-input-filled-mobile2-automation-default.png`
## Text Input Flow — mobil 2 (2026-07-03, channel automation-default, sesi terbaru)

### Navigasi
- Dari layar utama, scroll down karena tombol **Text Input** tidak terlihat di awal (wait_for timeout 10s).
- Tap tombol **Text Input** via locator `text: "Text Input"` — berhasil.
- UI snapshot kosong (React Native); text locator tetap berfungsi.

### Form Input
- Tiga field: **Small**, **Medium**, **Large**.
- Nilai uji mobil 2 (sesi ini):
  - Small → `ini text small mobile 2`
  - Medium → `ini text medium mobile 2`
  - Large → `ini text large mobile 2`

### Verifikasi
- `mobile_assert_visible` pada ketiga nilai di atas — semua berhasil (visible: true).

### Screenshot
- `text-input-start-mobile2-automation-default.png`, `text-input-filled-mobile2-automation-default.png`
## Text Input Flow — mobile BOT 3 (2026-07-03, channel automation-default)

### Navigasi
- Dari layar utama, scroll down karena tombol **Text Input** tidak terlihat di awal.
- `mobile_wait_for` type text "Text Input" lalu tap via locator `text: "Text Input"` — berhasil.
- UI snapshot kosong (React Native); text locator tetap berfungsi.

### Form Input
- Tiga field: **Small**, **Medium**, **Large**.
- Nilai uji mobile BOT 3 (sesi ini):
  - Small → `ini text small mobile BOT 3`
  - Medium → `ini text medium mobile BOT 3`
  - Large → `ini text large mobile BOT 3`

### Verifikasi
- `mobile_assert_visible` pada ketiga nilai di atas — semua berhasil (visible: true).

### Screenshot
- `text-input-bot3-start.png`, `text-input-bot3-filled.png`
## Text Input Flow — mobile BOT 2 (2026-07-03, channel automation-default)

### Navigasi
- Dari layar utama, scroll down karena tombol **Text Input** tidak terlihat di awal (wait_for timeout 10s).
- Tap tombol **Text Input** via locator `text: "Text Input"` — berhasil setelah scroll down.
- UI snapshot kosong (React Native); text locator tetap berfungsi.

### Form Input
- Tiga field: **Small**, **Medium**, **Large**.
- Nilai uji mobile BOT 2 (sesi ini):
  - Small → `ini text small mobile BOT 2`
  - Medium → `ini text medium mobile BOT 2`
  - Large → `ini text large mobile BOT 2`

### Verifikasi
- `mobile_assert_visible` pada ketiga nilai di atas — semua berhasil (visible: true).

### Screenshot
- `text-input-start-mobile-bot2.png`, `text-input-filled-mobile-bot2-automation-default.png`
## Text Input Flow — mobile BOT 1 (2026-07-03, channel automation-default)

### Navigasi
- Dari layar utama, scroll down karena tombol **Text Input** tidak terlihat di awal.
- `mobile_wait_for` type text "Text Input" lalu tap via locator `text: "Text Input"` — berhasil.
- UI snapshot kosong (React Native); text locator tetap berfungsi.

### Form Input
- Tiga field: **Small**, **Medium**, **Large**.
- Nilai uji mobile BOT 1 (sesi ini):
  - Small → `ini text small mobile BOT 1`
  - Medium → `ini text medium mobile BOT 1`
  - Large → `ini text large mobile BOT 1`

### Verifikasi
- `mobile_assert_visible` pada ketiga nilai di atas — semua berhasil (visible: true).

### Screenshot
- `text-input-start-mobile-bot1.png`, `text-input-filled-mobile-bot1-automation-default.png`
## Text Input Flow — mobile BOT 122 (2026-07-03, channel automation-default)

### Navigasi
- Dari layar utama, scroll down karena tombol **Text Input** tidak terlihat di awal.
- `mobile_wait_for` type text "Text Input" lalu tap via locator `text: "Text Input"` — berhasil.
- UI snapshot kosong (React Native); text locator tetap berfungsi.

### Form Input
- Tiga field: **Small**, **Medium**, **Large**.
- Nilai uji mobile BOT 122 (sesi ini):
  - Small → `ini text small mobile BOT 122`
  - Medium → `ini text medium mobile BOT 122`
  - Large → `ini text large mobile BOT 122`

### Verifikasi
- `mobile_assert_visible` pada ketiga nilai di atas — semua berhasil (visible: true).

### Screenshot
- `text-input-bot122-start.png`, `text-input-bot122-filled.png`
## Text Input Flow — mobile BOT 133 (2026-07-03, channel automation-default)

### Navigasi
- Dari layar utama, scroll down karena tombol **Text Input** tidak terlihat di awal.
- `mobile_wait_for` type text "Text Input" lalu tap via locator `text: "Text Input"` — berhasil.
- UI snapshot kosong (React Native); text locator tetap berfungsi.

### Form Input
- Tiga field: **Small**, **Medium**, **Large**.
- Nilai uji mobile BOT 133 (sesi ini):
  - Small → `ini text small mobile BOT 133`
  - Medium → `ini text medium mobile BOT 133`
  - Large → `ini text large mobile BOT 1333`

### Verifikasi
- `mobile_assert_visible` pada ketiga nilai di atas — semua berhasil (visible: true).

### Screenshot
- `text-input-bot133-start.png`, `text-input-bot133-filled.png`
## Text Input Flow — automation-default (2026-07-06)

### Navigasi
- Dari layar utama, scroll down karena tombol **Text Input** tidak terlihat di awal.
- `mobile_wait_for` type text "Text Input" lalu tap via locator `text: "Text Input"` — berhasil.
- UI snapshot kosong (React Native); text locator tetap berfungsi.

### Form Input
- Tiga field: **Small**, **Medium**, **Large**.
- Nilai uji (sesi ini):
  - Small → `test small`
  - Medium → `test medium`
  - Large → `test large`

### Verifikasi
- `mobile_assert_visible` pada ketiga nilai di atas — semua berhasil (visible: true).

### Screenshot
- `text-input-start-automation-default.png`, `text-input-filled-automation-default.png`
## Text Input Flow — automation-default (2026-07-06)

### Navigasi
- Dari layar utama, tap tombol **Text Input** via locator `text: "Text Input"`.
- UI snapshot sering kosong (React Native); text locator tetap berfungsi.
- Tombol Text Input langsung terlihat tanpa perlu scroll pada sesi ini.

### Form Input
- Tiga field: **Small**, **Medium**, **Large**.
- Nilai uji (sesi ini):
  - Small → `test small 2`
  - Medium → `test medium2`
  - Large → `test large 2`

### Verifikasi
- `mobile_assert_visible` pada ketiga nilai di atas — semua berhasil (visible: true).

### Screenshot
- `text-input-start-automation-default.png`, `text-input-filled-automation-default.png`
## Text Input Flow — automation-default (2026-07-06, sesi terbaru)

### Navigasi
- Dari layar utama, scroll down karena tombol **Text Input** tidak terlihat di awal.
- `mobile_wait_for` type text "Text Input" lalu tap via locator `text: "Text Input"` — berhasil.
- UI snapshot kosong (React Native); text locator tetap berfungsi.

### Form Input
- Tiga field: **Small**, **Medium**, **Large**.
- Nilai uji (sesi ini):
  - Small → `small`
  - Medium → `medium`
  - Large → `large`

### Verifikasi
- `mobile_assert_visible` pada ketiga nilai di atas — semua berhasil (visible: true).

### Screenshot
- `text-input-start-automation-default.png`, `text-input-filled-automation-default.png`
## Text Input Flow — automation-default (2026-07-06, sesi terbaru)

### Navigasi
- Dari layar utama, scroll down karena tombol **Text Input** tidak terlihat di awal (wait_for timeout 10s setelah scroll).
- Tap tombol **Text Input** via locator `text: "Text Input"` — berhasil.
- UI snapshot kosong (React Native); text locator tetap berfungsi.

### Form Input
- Tiga field: **Small**, **Medium**, **Large**.
- Nilai uji (sesi ini):
  - Small → `small`
  - Medium → `medium`
  - Large → `large`

### Verifikasi
- `mobile_assert_visible` pada ketiga nilai di atas — semua berhasil (visible: true).

### Screenshot
- `text-input-start-automation-default.png`, `text-input-filled-automation-default.png`
## Text Input Flow — automation-default (2026-07-06, sesi terbaru)

### Navigasi
- Dari layar utama, scroll down karena tombol **Text Input** tidak terlihat di awal.
- `mobile_wait_for` type text "Text Input" lalu tap via locator `text: "Text Input"` — berhasil.
- UI snapshot kosong (React Native); text locator tetap berfungsi.

### Form Input
- Tiga field: **Small**, **Medium**, **Large**.
- Nilai uji (sesi ini, hanya Small & Medium):
  - Small → `ini dalah text smal`
  - Medium → `ini adalah text medium`
  - Large → tidak diisi (di luar skenario)

### Verifikasi
- `mobile_assert_visible` pada Small dan Medium — semua berhasil (visible: true).

### Screenshot
- `text-input-start-automation-default.png`, `text-input-filled-automation-default.png`
## Text Input Flow — automation-default (2026-07-06, sesi text small/medium 2)

### Navigasi
- Dari layar utama, scroll down karena tombol **Text Input** tidak terlihat di awal.
- `mobile_wait_for` type text "Text Input" lalu tap via locator `text: "Text Input"` — berhasil.
- UI snapshot kosong (React Native); text locator tetap berfungsi.

### Form Input
- Field yang diisi: **Small**, **Medium** (Large tidak diisi pada skenario ini).
- Nilai uji (sesi ini):
  - Small → `ini dalah text small 2`
  - Medium → `ini adalah text medium 2`

### Verifikasi
- `mobile_assert_visible` pada kedua nilai di atas — semua berhasil (visible: true).

### Screenshot
- `text-input-start-automation-default.png`, `text-input-filled-automation-default.png`
## Text Input Flow — automation-default (2026-07-06, skenario text small/medium)

### Navigasi
- Dari layar utama, scroll down karena tombol **Text Input** tidak terlihat di awal.
- `mobile_wait_for` type text "Text Input" lalu tap via locator `text: "Text Input"` — berhasil.
- UI snapshot kosong (React Native); text locator tetap berfungsi.

### Form Input
- Field yang diisi: **Small**, **Medium** (Large tidak diisi pada skenario ini).
- Nilai uji (sesi ini):
  - Small → `text small`
  - Medium → `text medium`

### Verifikasi
- `mobile_assert_visible` pada kedua nilai di atas — semua berhasil (visible: true).

### Screenshot
- `text-input-start-automation-default.png`, `text-input-filled-automation-default.png`
## Text Input Flow — automation-default (2026-07-06, sesi text small/medium 2)

### Navigasi
- Dari layar utama, scroll down karena tombol **Text Input** tidak terlihat di awal.
- `mobile_wait_for` type text "Text Input" lalu tap via locator `text: "Text Input"` — berhasil.
- UI snapshot kosong (React Native); text locator tetap berfungsi.

### Form Input
- Field yang diisi: **Small**, **Medium** (Large tidak diisi pada skenario ini).
- Nilai uji (sesi ini):
  - Small → `text small 2`
  - Medium → `text medium 2`

### Verifikasi
- `mobile_assert_visible` pada kedua nilai di atas — semua berhasil (visible: true).

### Screenshot
- `text-input-start-automation-default.png`, `text-input-filled-automation-default.png`
