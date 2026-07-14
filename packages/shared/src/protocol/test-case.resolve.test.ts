import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  inferPlatformFromUrl,
  parseTestCaseDrafts,
  parseTestCasesFromPrompt,
  resolveMemoryAppId,
  resolveTestCaseDrafts,
  type ShortcutRegistryEntry,
} from "./test-case.js";

const orderShortcut: ShortcutRegistryEntry = {
  id: "order-pesanan",
  label: "Order pesanan",
  platform: "browser",
  url: "https://portal.example.com/order",
  template: "Pilih {produk}, qty {qty}.",
  defaults: { qty: "1" },
};

const loginShortcut: ShortcutRegistryEntry = {
  id: "login-take-order",
  label: "Take Order - Login",
  platform: "browser",
  url: "http://192.168.20.27:5367/",
  template: "Login dengan {username}.",
  defaults: { username: "admin" },
};

const takeOrderShortcut: ShortcutRegistryEntry = {
  id: "take-order",
  label: "Take Order",
  platform: "browser",
  url: "http://192.168.20.27:5367/",
  template: "Order dari {order_dari}, customer {cari_customer}.",
  defaults: { order_dari: "TOKO" },
};

const mobileShortcut: ShortcutRegistryEntry = {
  id: "cek-app",
  label: "Cek di App",
  platform: "mobile",
  appPackage: "com.knitto.app",
  template: "Buka app dan cek order {order_id}.",
  defaults: {},
};

describe("parseTestCaseDrafts", () => {
  it("extracts shortcut ref and variables", () => {
    const prompt = `## Test Case 2
Ikuti system prompt "Order pesanan".
produk=produk A
qty=1
Wajib: [HANDOFF] NO_ORDER=<nomor>`;

    const { drafts, errors } = parseTestCaseDrafts(prompt);
    assert.equal(errors.length, 0);
    assert.equal(drafts.length, 1);
    assert.deepEqual(drafts[0]!.shortcutRefs, ["Order pesanan"]);
    assert.equal(drafts[0]!.variables.produk, "produk A");
    assert.equal(drafts[0]!.variables.qty, "1");
    assert.match(drafts[0]!.narrativeInstruction, /HANDOFF/);
  });

  it("extracts multiple shortcut refs in order", () => {
    const prompt = `## Test Case 1
Ikuti system prompt "Take Order - Login" lalu system prompt "Take Order".`;
    const { drafts, errors } = parseTestCaseDrafts(prompt);
    assert.equal(errors.length, 0);
    assert.deepEqual(drafts[0]!.shortcutRefs, ["Take Order - Login", "Take Order"]);
  });
});

describe("resolveTestCaseDrafts", () => {
  it("resolves narrative shortcut with variables", () => {
    const { drafts } = parseTestCaseDrafts(`## Test Case 2
Ikuti system prompt "Order pesanan".
produk=produk A
qty=1`);

    const result = resolveTestCaseDrafts(drafts, { shortcuts: [orderShortcut] });
    assert.equal(result.errors.length, 0);
    assert.equal(result.testCases[0]!.platform, "browser");
    assert.equal(result.testCases[0]!.shortcutId, "order-pesanan");
    assert.match(result.testCases[0]!.instruction, /produk A/);
  });

  it("resolves multiple shortcuts in one TC with shared variables", () => {
    const { drafts } = parseTestCaseDrafts(`## Test Case 1
Ikuti system prompt "Take Order - Login" lalu system prompt "Take Order".
username=main
order_dari=TOKO
cari_customer=28886351120`);

    const result = resolveTestCaseDrafts(drafts, {
      shortcuts: [loginShortcut, takeOrderShortcut],
    });
    assert.equal(result.errors.length, 0);
    assert.equal(result.testCases[0]!.shortcuts?.length, 2);
    assert.match(result.testCases[0]!.instruction, /Login dengan main/);
    assert.match(result.testCases[0]!.instruction, /Order dari TOKO/);
    assert.match(result.testCases[0]!.instruction, /28886351120/);
  });

  it("infers browser from URL in narrative", () => {
    const { drafts } = parseTestCaseDrafts(`## Test Case 1
Buka https://portal.knitto.com/status dan verifikasi.`);

    const result = resolveTestCaseDrafts(drafts, { shortcuts: [] });
    assert.equal(result.errors.length, 0);
    assert.equal(result.testCases[0]!.platform, "browser");
  });

  it("defaults to browser without platform or URL", () => {
    const { drafts } = parseTestCaseDrafts(`## Test Case 1
Verifikasi dashboard terbuka.`);

    const result = resolveTestCaseDrafts(drafts, { shortcuts: [] });
    assert.equal(result.testCases[0]!.platform, "browser");
  });

  it("honors explicit Platform override over shortcut metadata", () => {
    const { drafts } = parseTestCaseDrafts(`## Test Case 1
Platform: mobile
App: com.override.app
Ikuti system prompt "Take Order - Login".`);

    const result = resolveTestCaseDrafts(drafts, { shortcuts: [loginShortcut] });
    assert.equal(result.errors.length, 0);
    assert.equal(result.testCases[0]!.platform, "mobile");
    assert.equal(result.testCases[0]!.appPackage, "com.override.app");
  });

  it("errors for mobile without appPackage", () => {
    const { drafts } = parseTestCaseDrafts(`## Test Case 1
Platform: mobile
Ikuti system prompt "Cek di App".`);

    const mobileWithoutPackage: ShortcutRegistryEntry = {
      ...mobileShortcut,
      appPackage: undefined,
      template: "Buka app dan cek order.",
    };

    const result = resolveTestCaseDrafts(drafts, {
      shortcuts: [mobileWithoutPackage],
    });
    assert.ok(result.errors.some((e) => e.includes("App:")));
  });

  it("errors on conflicting shortcut platforms without override", () => {
    const browserSc: ShortcutRegistryEntry = {
      ...loginShortcut,
      label: "Browser Step",
    };
    const { drafts } = parseTestCaseDrafts(`## Test Case 1
Ikuti system prompt "Browser Step" lalu system prompt "Cek di App".`);

    const result = resolveTestCaseDrafts(drafts, {
      shortcuts: [browserSc, mobileShortcut],
    });
    assert.ok(result.errors.some((e) => e.includes("bertentangan platform")));
  });

  it("supports legacy Platform and App lines", () => {
    const prompt = `## Test Case 1
Platform: browser
- Buka halaman order
- Submit`;

    const result = parseTestCasesFromPrompt(prompt, undefined, []);
    assert.equal(result.errors.length, 0);
    assert.equal(result.testCases[0]!.platform, "browser");
    assert.match(result.testCases[0]!.instruction, /Submit/);
  });

  it("allows unresolved placeholders in resolved shortcut body", () => {
    const { drafts } = parseTestCaseDrafts(`## Test Case 1
Ikuti system prompt "Order pesanan".`);

    const result = resolveTestCaseDrafts(drafts, { shortcuts: [orderShortcut] });
    assert.equal(result.errors.length, 0);
    assert.equal(result.testCases.length, 1);
    assert.match(result.testCases[0]!.instruction, /\{produk\}/);
  });

  it("errors when shortcut label not found", () => {
    const { drafts } = parseTestCaseDrafts(`## Test Case 1
Ikuti system prompt "Tidak Ada".`);

    const result = resolveTestCaseDrafts(drafts, { shortcuts: [orderShortcut] });
    assert.ok(result.errors.some((e) => e.includes("tidak ditemukan")));
  });
});

describe("inferPlatformFromUrl", () => {
  it("detects http URLs", () => {
    assert.equal(inferPlatformFromUrl("Buka https://example.com"), "browser");
    assert.equal(inferPlatformFromUrl("tanpa url"), null);
  });
});

describe("resolveMemoryAppId", () => {
  it("includes port for IPv4 browser URLs", () => {
    assert.equal(
      resolveMemoryAppId({
        platform: "browser",
        url: "http://192.168.20.27:5367/",
      }),
      "192.168.20.27:5367"
    );
  });

  it("keeps hostname only for domain URLs", () => {
    assert.equal(
      resolveMemoryAppId({
        platform: "browser",
        url: "https://portal.knitto.org/orders",
      }),
      "portal.knitto.org"
    );
  });

  it("uses appPackage for mobile", () => {
    assert.equal(
      resolveMemoryAppId({
        platform: "mobile",
        appPackage: "com.baseapprn.development",
        url: "http://192.168.20.27:5367/",
      }),
      "com.baseapprn.development"
    );
  });
});

