# Knitto Web App Memory

## Login Page
- **URL:** http://192.168.20.15:5588/login
- **Title:** Template Vite Preact Typescript Knitto

### Login Form Elements (stable locators)
| Element | Locator Strategy | Notes |
|---------|-----------------|-------|
| Username | `placeholder: "Username"` | inputType=text |
| Password | `placeholder: "Password"` | inputType=password |
| Login button | `role: button, name: "LOGIN"` | Full-width blue button |
| Password visibility toggle | `role: button, name: "Icon button"` near password field | Optional; bbox ~803,414 |

### Login Flow
1. Fill username and password via placeholder locators
2. Click LOGIN button
3. Toast notification appears briefly (close button: `name: "Tutup notifikasi"`)
4. URL may stay at `/login` briefly; session is established
5. Navigate to `/` or post-login redirect shows dashboard with **User** and **Log out** buttons in header

### Post-Login Indicators
- `role: button, name: "Log out"` visible in top-right header
- `role: button, name: "User"` visible in header
- Dashboard home at `http://192.168.20.15:5588/` with component example cards

### Valid Credentials (test)
- Username: `init`
- Password: `test`

### Header Elements (authenticated)
- Theme selector: `name: "Pilih tema tampilan (Ikuti sistem)"`
- Hamburger menu: `role: button, name: "Icon button"` top-left (bbox ~14,14)
- Sidebar search: `placeholder: "Cari menu"`

### Quirks
- Login success toast auto-dismisses quickly; text not always in page body for assert_text
- Verify login by checking Log out button on dashboard, not URL change alone

## Test Run — login.md (2026-06-24)

### Positive Test: Login with valid credentials — PASSED
- URL: http://192.168.20.15:5588/login
- Steps: fill Username (init), Password (test), click LOGIN
- Toast notification appeared (Tutup notifikasi button visible)
- URL stayed at /login briefly; session established
- Verified on dashboard (/): Log out + User buttons visible
- Locators used: placeholder Username/Password, role=button name=LOGIN

### Negative Test Cases (documented, not executed per rules)
| ID | Scenario | Steps | Expected |
|----|----------|-------|----------|
| NEG-01 | Empty username | Leave Username blank, fill Password, click LOGIN | Error toast or validation; remain on login |
| NEG-02 | Empty password | Fill Username, leave Password blank, click LOGIN | Error toast or validation; remain on login |
| NEG-03 | Both fields empty | Click LOGIN without filling | Error toast or validation; remain on login |
| NEG-04 | Wrong username | Username: wronguser, Password: test | Login fails; error message |
| NEG-05 | Wrong password | Username: init, Password: wrongpass | Login fails; error message |
| NEG-06 | Wrong credentials | Both fields invalid | Login fails; error message |

### Positive Test Cases (documented)
| ID | Scenario | Steps | Expected |
|----|----------|-------|----------|
| POS-01 | Valid login | init / test → LOGIN | Toast success; dashboard accessible with Log out |
| POS-02 | Password visibility toggle | Click Icon button near password field | Password text toggles visible/hidden |
| POS-03 | Enter key submit | Fill fields, press Enter in Password | Same as POS-01 |

### Assumptions
- Password visibility toggle (Icon button at bbox ~803,414) assumed to show/hide password; not verified this run
- Error messages appear as toast notifications (Tutup notifikasi close button pattern)
- No explicit form labels; placeholder text is the stable locator
- Login does not auto-redirect; manual navigation to / confirms session

## Test Run — terapkan file 1 / Login.md (2026-06-24)

### Applied: Login.md (file 1) — PASSED
- Executed positive login test per Login.md instructions
- URL: http://192.168.20.15:5588/login
- Credentials: init / test
- Locators: placeholder Username, placeholder Password, role=button name=LOGIN
- Post-login verification: Log out + User buttons visible on dashboard (/)
- Screenshots: login-form-filled.png, login-success-dashboard.png
- Note: No inputType=file found on login or dashboard; "terapkan file" interpreted as executing Login.md test scenario, not file upload
