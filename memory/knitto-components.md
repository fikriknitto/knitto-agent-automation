# Knitto Design System Docs (192.168.20.15:11111)

## Base URL
- http://192.168.20.15:11111/

## Left Sidebar Navigation
- Sidebar has collapsible sections: Introduction, Changelog, Foundation, Components
- Components expand button: `role=button name="Components"` (ref in sidebar)
- After expanding Components, sub-items appear: Big Calendar, Button, Dropdown, Input Date & Time, Modal, Pagination, Radio, Select, Table, Theme Toggle, Toast

## Theme Toggle Navigation
1. Click Components in left sidebar to expand
2. Click Theme Toggle link (use sidebar ref e20 when multiple matches — main content also has Theme Toggle links)
3. Navigates to: http://192.168.20.15:11111/components/theme-toggle
4. Page title: "Theme Toggle | Knitto Design System"
5. Content includes Setup, Demo, Hook useKnittoTheme, Props sections

## Notes
- Theme Toggle locator is ambiguous (3 matches) — prefer sidebar ref from snapshot
- Components section must be expanded first to reveal Theme Toggle in sidebar
