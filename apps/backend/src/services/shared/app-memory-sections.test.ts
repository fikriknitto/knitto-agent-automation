import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { upsertMemorySection } from "./app-memory-sections.js";

describe("upsertMemorySection", () => {
  it("replaces an existing section body instead of appending", () => {
    const existing = `# App

## [login]

old login notes

## [checkout]

checkout notes
`;

    const next = upsertMemorySection(existing, "login", "new login notes");

    assert.match(next, /## \[login\]\n\nnew login notes\n/);
    assert.doesNotMatch(next, /old login notes/);
    assert.match(next, /## \[checkout\]\n\ncheckout notes\n/);
  });

  it("adds a new section when the key is missing", () => {
    const existing = `# App\n\n## [login]\n\nhi\n`;
    const next = upsertMemorySection(existing, "search", "search tips");
    assert.match(next, /## \[login\]/);
    assert.match(next, /## \[search\]\n\nsearch tips\n/);
  });

  it("drops legacy unkeyed ## headings so updates do not stack", () => {
    const existing = `## Text Input Flow — mobil 2

old junk A

## Text Input Flow — mobil 2 (sesi terbaru)

old junk B

## [tc-01-test-case-1]

keep me
`;
    const next = upsertMemorySection(existing, "tc-01-test-case-1", "replaced body");
    assert.doesNotMatch(next, /old junk/);
    assert.doesNotMatch(next, /Text Input Flow/);
    assert.match(next, /## \[tc-01-test-case-1\]\n\nreplaced body\n/);
  });
});
