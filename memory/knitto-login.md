# Knitto Login App (192.168.20.15:5588)

## Login URL
- http://192.168.20.15:5588/login

## Login Form Locators
- Username: `placeholder="Username"` (inputType=text)
- Password: `placeholder="Password"` (inputType=password)
- Submit: `role=button name="LOGIN"`
- Password visibility toggle: Icon button inside password field (role=button, name="Icon button")

## Credentials (test)
- Username: init
- Password: test

## Login Flow
1. Fill username and password
2. Click LOGIN button or press Enter on password field
3. Toast notification appears ("Tutup notifikasi" close button) — login may not auto-redirect
4. Navigate to http://192.168.20.15:5588/ to verify session

## Post-Login Verification
- URL: http://192.168.20.15:5588/
- Visible: `role=button name="Log out"` and `role=button name="User"`
- Dashboard shows component example cards

## Notes
- Login succeeds but stays on /login URL until manual navigation or SPA redirect
- Notification toast appears after login attempt
