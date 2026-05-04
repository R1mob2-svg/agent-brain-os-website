import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { resolve } from "node:path";

import { buildMvpReleaseReceipt, MVP_RELEASE_STATUS } from "../lib/release/mvp-receipt";

const receipt = buildMvpReleaseReceipt();

assert.equal(existsSync(resolve(process.cwd(), "lib/release/mvp-receipt.ts")), true);
assert.equal(existsSync(resolve(process.cwd(), "app/api/librarian/release-receipt/route.ts")), true);
assert.equal(receipt.status, MVP_RELEASE_STATUS);
assert.equal(receipt.unproven_capabilities.includes("commercial SaaS readiness"), true);
assert.equal(receipt.unproven_capabilities.includes("tenant provisioning"), true);
assert.equal(receipt.unproven_capabilities.includes("Geminex API migration as customer"), true);
assert.equal(receipt.unproven_capabilities.includes("ReleaseSeal containment-pack parity"), true);
assert.match(receipt.branch, /\S+/);
assert.equal(receipt.final_verdict, "PARTIAL");

console.log("PROOF_023_MVP_RECEIPT_TRUTH PASSED");
