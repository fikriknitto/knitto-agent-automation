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
## Text Input Flow — automation-default (2026-07-06, skenario ini text small/medium)

### Navigasi
- Dari layar utama, scroll down karena tombol **Text Input** tidak terlihat di awal.
- `mobile_wait_for` type text "Text Input" lalu tap via locator `text: "Text Input"` — berhasil.
- UI snapshot kosong (React Native); text locator tetap berfungsi.

### Form Input
- Field yang diisi: **Small**, **Medium** (Large tidak diisi pada skenario ini).
- Nilai uji (sesi ini):
  - Small → `ini text small`
  - Medium → `ini text medium`

### Verifikasi
- `mobile_assert_visible` pada kedua nilai di atas — semua berhasil (visible: true).

### Screenshot
- `text-input-start-automation-default.png`, `text-input-filled-automation-default.png`
## Text Input Flow — automation-default (2026-07-06, skenario ini text small 1)

### Navigasi
- Dari layar utama, scroll down karena tombol **Text Input** tidak terlihat di awal.
- `mobile_wait_for` type text "Text Input" lalu tap via locator `text: "Text Input"` — berhasil.
- UI snapshot kosong (React Native); text locator tetap berfungsi.

### Form Input
- Field yang diisi: **Small** saja (Medium dan Large tidak diisi pada skenario ini).
- Nilai uji (sesi ini):
  - Small → `ini text small 1`

### Verifikasi
- `mobile_assert_visible` pada nilai Small — berhasil (visible: true).

### Screenshot
- `text-input-start-automation-default.png`, `text-input-filled-small-1-automation-default.png`
## Text Input Flow — automation-default (2026-07-06, skenario ini text small 2)

### Navigasi
- Dari layar utama, scroll down karena tombol **Text Input** tidak terlihat di awal.
- `mobile_wait_for` type text "Text Input" lalu tap via locator `text: "Text Input"` — berhasil.
- UI snapshot kosong (React Native); text locator tetap berfungsi.

### Form Input
- Field yang diisi: **Small** saja (Medium dan Large tidak diisi pada skenario ini).
- Nilai uji (sesi ini):
  - Small → `ini text small 2`

### Verifikasi
- `mobile_assert_visible` pada nilai Small — berhasil (visible: true).

### Screenshot
- `text-input-start-automation-default.png`, `text-input-filled-automation-default.png`
## Text Input Flow — automation-default (2026-07-08, skenario Text Small/Medium/Large Bot 2)

### Navigasi
- Dari layar utama, scroll down karena tombol **Text Input** tidak terlihat di awal.
- `mobile_wait_for` type text "Text Input" lalu tap via locator `text: "Text Input"` — berhasil.
- UI snapshot kosong (React Native); text locator tetap berfungsi.
- Sesi Appium perlu di-reset via `mobile_close_session` + `mobile_launch_app` jika sesi terputus.

### Form Input
- Tiga field: **Small**, **Medium**, **Large**.
- Nilai uji (sesi ini):
  - Small → `Text Small Bot 2`
  - Medium → `Text Medium Bot 2`
  - Large → `Text Large Bot 2`

### Verifikasi
- `mobile_assert_visible` pada ketiga nilai di atas — semua berhasil (visible: true).

### Screenshot
- `text-input-start-bot2-automation-default.png`, `text-input-filled-bot2-automation-default.png`
## Text Input Flow — automation-default (2026-07-08, skenario Bot 5)

### Navigasi
- Dari layar utama, scroll down karena tombol **Text Input** tidak terlihat di awal.
- `mobile_wait_for` type text "Text Input" lalu tap via locator `text: "Text Input"` — berhasil.
- UI snapshot kosong (React Native); text locator tetap berfungsi.

### Form Input
- Tiga field: **Small**, **Medium**, **Large**.
- Nilai uji (sesi ini):
  - Small → `Text Small Bot 5`
  - Medium → `Text Medium Bot 5`
  - Large → `Text Large Bot 5`

### Verifikasi
- `mobile_assert_visible` pada ketiga nilai di atas — semua berhasil (visible: true).

### Screenshot
- `text-input-bot5-start.png`, `text-input-bot5-filled.png`
## Text Input Flow — automation-default (2026-07-08, skenario Text Small/Medium/Large Bot 1)

### Navigasi
- Dari layar utama, scroll down karena tombol **Text Input** tidak terlihat di awal.
- `mobile_wait_for` type text "Text Input" lalu tap via locator `text: "Text Input"` — berhasil.
- UI snapshot kosong (React Native); text locator tetap berfungsi.

### Form Input
- Tiga field: **Small**, **Medium**, **Large**.
- Nilai uji (sesi ini):
  - Small → `Text Small Bot 1`
  - Medium → `Text Medium Bot 1`
  - Large → `Text Large Bot 1`

### Verifikasi
- `mobile_assert_visible` pada ketiga nilai di atas — semua berhasil (visible: true).

### Screenshot
- `text-input-bot1-start-automation-default.png`, `text-input-bot1-screen-automation-default.png`, `text-input-bot1-filled-automation-default.png`
## Modal Flow — automation-default (2026-07-08)

### Navigasi
- Dari layar utama, tap tombol **Modal** via locator `text: "Modal"` — berhasil.
- UI snapshot kosong (React Native); text locator tetap berfungsi.

### Aksi
- Tap tombol **Show success modal** via locator `text: "Show success modal"` — berhasil.
- `mobile_wait_for` type text "Show success modal" dapat timeout; tap langsung tetap berhasil.

### Verifikasi
- `mobile_assert_visible` pada teks **OK** — berhasil (visible: true), mengindikasikan success modal tampil.
- `mobile_assert_visible` pada teks "success" / "Success" — gagal (case-sensitive atau teks berbeda).

### Screenshot
- `modal-test-start-automation-default.png`, `modal-screen-automation-default.png`, `modal-success-automation-default.png`

### Catatan
- Setelah tap Modal, scroll down dapat diperlukan jika tombol tidak langsung terlihat.
- Verifikasi success modal paling andal via tombol **OK**.
## Switch Flow — automation-default (2026-07-08)

### Navigasi
- Dari layar utama, scroll down karena tombol **Switch** tidak terlihat di awal.
- `mobile_wait_for` type text "Switch" lalu tap via locator `text: "Switch"` — berhasil.
- UI snapshot kosong (React Native); text locator tetap berfungsi.

### Interaksi Switch
- Layar Switch memiliki tiga opsi: **Small**, **Medium**, **Large**.
- Skenario: aktifkan switch **Small** dan **Large** ke true (ON).
- Tap via locator `text: "Small"` dan `text: "Large"` — berhasil.
- **Medium** tidak diubah pada skenario ini.

### Verifikasi
- `mobile_assert_visible` pada label Small, Medium, Large — semua berhasil (visible: true).
- Screenshot bukti: `switch-start-automation-default.png`, `switch-small-large-true-automation-default.png`, `switch-final-automation-default.png`.

### Catatan
- Untuk toggle switch, text locator pada label baris (Small/Large) berfungsi meski snapshot kosong.
- Tombol Switch berada di bawah layar utama; perlu scroll down terlebih dahulu.
## Modal Flow — automation-default (2026-07-09)

### Navigasi
- Dari layar utama, tap tombol **Modal** via locator `text: "Modal"` — berhasil.
- UI snapshot kosong (React Native); text locator tetap berfungsi.
- Sesi Appium sempat terputus di awal (instrumentation crash); di-reset via `mobile_close_session` + `mobile_launch_app`.

### Aksi
- Tap tombol **Show success modal** via locator `text: "Show success modal"` — berhasil.

### Verifikasi
- `mobile_assert_visible` pada teks **OK** — berhasil (visible: true), mengindikasikan success modal tampil.

### Screenshot
- `modal-test-start-automation-default.png`, `modal-screen-automation-default.png`, `modal-success-automation-default.png`

### Catatan
- Verifikasi success modal paling andal via tombol **OK**.
- Tombol Modal langsung terlihat tanpa scroll pada sesi ini.
## Switch Flow — automation-default (2026-07-09)

### Navigasi
- Dari layar utama, scroll down karena tombol **Switch** tidak terlihat di awal.
- `mobile_wait_for` type text "Switch" lalu tap via locator `text: "Switch"` — berhasil.
- UI snapshot kosong (React Native); text locator tetap berfungsi.
- Sesi Appium perlu di-reset via `mobile_close_session` + `mobile_launch_app` jika sesi terputus (terjadi di awal sesi ini).

### Interaksi Switch
- Layar Switch memiliki tiga opsi: **Small**, **Medium**, **Large**.
- Skenario: aktifkan switch **Small** dan **Large** ke true (ON).
- Tap via locator `text: "Small"` dan `text: "Large"` — berhasil.
- **Medium** tidak diubah pada skenario ini.

### Verifikasi
- `mobile_assert_visible` pada label Small dan Large — semua berhasil (visible: true).

### Screenshot
- `switch-start-automation-default.png`, `switch-screen-automation-default.png`, `switch-small-large-true-automation-default.png`
## Switch Flow — automation-default (2026-07-09, sesi terbaru)

### Navigasi
- Dari layar utama, scroll down karena tombol **Switch** tidak terlihat di awal.
- `mobile_wait_for` type text "Switch" lalu tap via locator `text: "Switch"` — berhasil.
- UI snapshot kosong (React Native); text locator tetap berfungsi.
- Sesi Appium sempat terputus di awal; di-reset via `mobile_close_session` + `mobile_launch_app`.

### Interaksi Switch
- Layar Switch memiliki tiga opsi: **Small**, **Medium**, **Large**.
- Skenario: aktifkan switch **Small** dan **Large** ke true (ON).
- Tap via locator `text: "Small"` dan `text: "Large"` — berhasil.
- **Medium** tidak diubah pada skenario ini.

### Verifikasi
- `mobile_assert_visible` pada label Small, Medium, dan Large — semua berhasil (visible: true).

### Screenshot
- `switch-start-automation-default.png`, `switch-screen-automation-default.png`, `switch-small-large-true-automation-default.png`
## Modal Flow — automation-default (2026-07-09, sesi terbaru)

### Navigasi
- Dari layar utama, tap tombol **Modal** via locator `text: "Modal"` — berhasil.
- UI snapshot kosong (React Native); text locator tetap berfungsi.
- Tombol Modal langsung terlihat tanpa scroll pada sesi ini.

### Aksi
- Tap tombol **Show success modal** via locator `text: "Show success modal"` — berhasil.

### Verifikasi
- `mobile_assert_visible` pada teks **OK** — berhasil (visible: true), mengindikasikan success modal tampil.

### Screenshot
- `modal-test-start-automation-default.png`, `modal-screen-automation-default.png`, `modal-success-automation-default.png`

### Catatan
- Verifikasi success modal paling andal via tombol **OK**.
- Skenario: pilih Modal → klik Show success modal.
## Modal Flow — automation-default (2026-07-10)

### Navigasi
- Dari layar utama, tap tombol **Modal** via locator `text: "Modal"` — berhasil.
- UI snapshot kosong (React Native); text locator tetap berfungsi.
- Tombol Modal langsung terlihat tanpa scroll pada sesi ini.
- Catatan: Appium perlu dijalankan dengan `ANDROID_HOME`/`ANDROID_SDK_ROOT` agar sesi dapat dibuat.

### Aksi
- Tap tombol **Show success modal** via locator `text: "Show success modal"` — berhasil.

### Verifikasi
- `mobile_assert_visible` pada teks **OK** — berhasil (visible: true), mengindikasikan success modal tampil.

### Screenshot
- `modal-test-start-automation-default.png`, `modal-screen-automation-default.png`, `modal-success-automation-default.png`

### Catatan
- Verifikasi success modal paling andal via tombol **OK**.
- Skenario: pilih Modal → klik Show success modal.

## [tc-02-test-case-2]

## TC-02 Test Case 2 — automation-default (2026-07-13, multi-TC job 2/3)

### Status: PASS

### Konteks
- Handoff dari TC-01: no_order=OH130726020, ORDER_NO=OH130726020, CUSTOMER_ID=065195, CUSTOMER_NAME=FIKRI, USERNAME=main, CABANG=holis (diteruskan ke TC-03; tidak dipakai di skenario mobile Text Input).
- Package: `com.baseapprn.development`, device: 127.0.0.1:5555.

### Navigasi
- `mobile_launch_app` — berhasil (activity com.baseapprn.MainActivity).
- Dashboard: Text Input tidak terlihat di awal → scroll down → `mobile_wait_for` text "Text Input" → tap `text: "Text Input"`.
- UI snapshot sering kosong (React Native); text locator tetap berfungsi.

### Form Input
- Tiga field: **Small**, **Medium**, **Large**.
- Nilai uji (sesi ini):
  - Small → `ini text small broo`
  - Medium → `ini text medium bro`
  - Large → `ini text large broo`
- Isi via `mobile_input_text` dengan locator `text: "Small"|"Medium"|"Large"`, clear=true, hideKeyboard=true.

### Verifikasi
- `mobile_assert_visible` pada ketiga nilai — semua berhasil (visible: true).

### Screenshot
- `tc02-text-input-start.png`, `tc02-after-scroll.png`, `tc02-text-input-screen.png`, `tc02-text-input-filled.png`

### Handoff (diteruskan ke TC-03)
- no_order=OH130726020
- ORDER_NO=OH130726020
- CUSTOMER_ID=065195
- CUSTOMER_NAME=FIKRI
- USERNAME=main
- CABANG=holis

### Catatan
- App/session tidak ditutup (orchestrator cleanup di akhir multi-TC job).


## [text-input-automation-default-2026-07-10]

## Text Input Flow — automation-default (2026-07-10, skenario ini text small/medium)

### Navigasi
- Dari layar utama, scroll down karena tombol **Text Input** tidak terlihat di awal.
- `mobile_wait_for` type text "Text Input" lalu tap via locator `text: "Text Input"` — berhasil.
- UI snapshot kosong (React Native); text locator tetap berfungsi.
- Appium perlu dijalankan dengan `ANDROID_HOME`/`ANDROID_SDK_ROOT` agar sesi dapat dibuat.

### Form Input
- Field yang diisi: **Small**, **Medium** (Large tidak diisi pada skenario ini).
- Nilai uji (sesi ini):
  - Small → `ini text small`
  - Medium → `ini text medium`

### Verifikasi
- `mobile_assert_visible` pada kedua nilai di atas — semua berhasil (visible: true).

### Screenshot
- `text-input-screen-automation-default.png`, `text-input-filled-automation-default.png`


## [tc-03-test-case-3]

## TC-03 Test Case 3 — automation-default (2026-07-11)

### Konteks
- Multi-TC job 3/3; handoff dari TC-01/TC-02: USERNAME=main, CABANG=holis, DASHBOARD_URL=http://192.168.20.27:5367/home (tidak digunakan di skenario mobile ini).
- Package: `com.baseapprn.development`, device: 127.0.0.1:5555.

### Navigasi
- `mobile_launch_app` — berhasil.
- Dari layar utama, scroll down karena tombol **Text Input** tidak terlihat di awal.
- `mobile_wait_for` type text "Text Input" lalu tap via locator `text: "Text Input"` — berhasil.
- UI snapshot kosong (React Native); text locator tetap berfungsi.

### Form Input
- Tiga field: **Small**, **Medium**, **Large**.
- Nilai uji (sesi ini):
  - Small → `ini text small broo`
  - Medium → `ini text medium bro`
  - Large → `ini text large broo`

### Verifikasi
- `mobile_assert_visible` pada ketiga nilai di atas — semua berhasil (visible: true).

### Screenshot
- `tc03-text-input-start.png`, `tc03-text-input-screen.png`, `tc03-text-input-filled.png`

### Status: PASS
- Sesi mobile tidak ditutup (orchestrator cleanup di akhir multi-TC job).


## [tc-01-test-case-1]

## TC-01 Test Case 1 — automation-default (2026-07-14, multi-TC job 1/2)

### Status: PASS

### Konteks
- Package: `com.baseapprn.development`, device: 127.0.0.1:5555.
- Channel: automation-default.
- Multi-TC job 1/2; TC berikutnya = browser CMS Login.

### Navigasi
- `mobile_launch_app` — berhasil (activity com.baseapprn.MainActivity).
- Dashboard: Text Input tidak match pada wait pertama (timeout 5s) → scroll down → `mobile_wait_for` text "Text Input" → tap `text: "Text Input"`.
- UI snapshot sering kosong (React Native); text locator tetap berfungsi.

### Form Input
- Field yang diisi: **Small**, **Medium** (Large tidak diisi — di luar variabel TC).
- Nilai uji (sesi ini):
  - Small → `ini text small lagi`
  - Medium → `ini test medium lagi`
- Isi via `mobile_input_text` dengan locator `text: "Small"|"Medium"`, clear=true, hideKeyboard=true.

### Verifikasi
- `mobile_assert_visible` pada kedua nilai — semua berhasil (visible: true).

### Screenshot
- `tc01-text-input-start.png`, `tc01-text-input-screen.png`, `tc01-text-input-filled.png`

### Catatan
- App/session tidak ditutup (orchestrator cleanup di akhir multi-TC job).
- Tidak ada HANDOFF ke TC-02 (skenario browser CMS Login berdiri sendiri).
