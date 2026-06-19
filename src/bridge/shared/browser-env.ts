/** Whether Puppeteer runs in headed mode (AUTOMATION_HEADLESS=false or unset). */
export function browserHeadedFromEnv(): boolean {
  const raw = process.env.AUTOMATION_HEADLESS?.trim().toLowerCase();
  if (!raw) return true;
  return raw === "0" || raw === "false" || raw === "no";
}
