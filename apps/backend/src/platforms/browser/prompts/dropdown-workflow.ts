export const DROPDOWN_SELECTION_WORKFLOW = `
Dropdown / select menu workflow (when a selection dropdown list is open):
1. Open the dropdown: browser_click the combobox/trigger field, or browser_select_option for native <select>
2. browser_get_page_snapshot — confirm option list is visible (role=option, role=menuitem, listbox rows, or menu items)
3. Find the target option by text:
   - Prefer exact name/text match to the value being selected
   - If no exact match, use partial/contains match (case-insensitive when reasonable)
   - For searchable dropdowns: browser_fill the search/filter input, browser_wait_for filtered results, then snapshot again
4. Select the matched item:
   - Primary: browser_click by ref, role=option + name, role=menuitem + name, or text locator
   - Fallback: browser_click_at at the bbox center of the matched option from snapshot
5. Keyboard alternative (focus dropdown field via locator first):
   - browser_press_key ArrowDown / ArrowUp until the active/highlighted item matches the target text
   - browser_press_key Enter to confirm selection
6. browser_wait_for if the UI updates after selection; snapshot to verify the chosen value appears in the field
7. Do not use Escape to close the dropdown (blocked) — select an option or click outside the menu
`;
