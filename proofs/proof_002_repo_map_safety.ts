import assert from "node:assert/strict";

import { ALLOWED_ROOTS, BLOCKED_ROOTS, BUNDLE_DEFINITIONS, isAllowedBundlePath } from "../lib/librarian/repo-map";

assert.ok(ALLOWED_ROOTS.includes("Doctrine/"));
assert.ok(ALLOWED_ROOTS.includes("Agents/"));
assert.ok(BLOCKED_ROOTS.includes(".env"));
assert.ok(BLOCKED_ROOTS.includes("Agents/Newton/"));

for (const bundle of BUNDLE_DEFINITIONS) {
  for (const file of bundle.selected) {
    assert.equal(isAllowedBundlePath(file.path), true, `Selected path ${file.path} fell outside allowed roots.`);
  }
}

console.log("PROOF_002_REPO_MAP_SAFETY PASSED");
