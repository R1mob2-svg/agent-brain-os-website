import assert from "node:assert/strict";

import {
  clearBrainEntryStoreForProofs,
  listStagedBrainEntries,
  stageBrainEntry
} from "../lib/brain-entry-schema/validation";
import { clearTenantStoreForProofs, createTenant } from "../lib/tenants/service";

clearTenantStoreForProofs();
clearBrainEntryStoreForProofs();

const tenant = createTenant({
  tenant_name: "Entry Tenant",
  owner_email: "entries@tenant.test"
}).tenant;

const doctrine = stageBrainEntry({
  tenant_id: tenant.tenant_id,
  class: "Doctrine",
  title: "Doctrine: One Rule",
  body: "Law: the bounded public proof must be staged before promotion.",
  tags: ["doctrine"]
});
assert.equal(doctrine.ok, true);

const lesson = stageBrainEntry({
  tenant_id: tenant.tenant_id,
  class: "Lesson",
  title: "Lesson: Guard split-brain drift",
  body: "When truth forks, repair the canonical lane first.",
  tags: ["lesson"]
});
assert.equal(lesson.ok, true);

const receipt = stageBrainEntry({
  tenant_id: tenant.tenant_id,
  class: "Receipt",
  title: "Receipt: Historical import",
  body: "Historical receipt from an earlier bounded run.",
  tags: ["receipt", "history"]
});
assert.equal(receipt.ok, true);

const handoff = stageBrainEntry({
  tenant_id: tenant.tenant_id,
  class: "Handoff",
  title: "Handoff: Review pending",
  body: "Pending delivery to the next operator.",
  tags: ["handoff"],
  delivery_status: "pending"
});
assert.equal(handoff.ok, true);

const firstMemory = stageBrainEntry({
  tenant_id: tenant.tenant_id,
  workspace_id: "workspace_alpha",
  class: "Memory",
  title: "Workspace State",
  body: "Current state: candidate staging is enabled.",
  tags: ["memory", "current-state"]
});
assert.equal(firstMemory.ok, true);

const secondMemory = stageBrainEntry({
  tenant_id: tenant.tenant_id,
  workspace_id: "workspace_alpha",
  class: "Memory",
  title: "Workspace State",
  body: "Current state: candidate staging and key issuance are enabled.",
  tags: ["memory", "current-state"]
});
assert.equal(secondMemory.ok, true);

const malformedDoctrine = stageBrainEntry({
  tenant_id: tenant.tenant_id,
  class: "Doctrine",
  title: "Doctrine: Missing language",
  body: "This text lacks the required phrasing.",
  tags: ["doctrine"]
});
assert.equal(malformedDoctrine.ok, false);

if (receipt.ok) {
  assert.equal(receipt.entry.class, "Receipt");
  assert.equal(receipt.entry.historical_only, true);
  assert.equal(receipt.write_state, "staged_only");
  assert.equal(receipt.github_write, false);
}

if (secondMemory.ok && firstMemory.ok) {
  assert.equal(secondMemory.write_state, "staged_only");
  assert.equal(secondMemory.github_write, false);
}

const stagedEntries = listStagedBrainEntries();
assert.equal(stagedEntries.some((entry) => entry.class === "Doctrine"), true);
assert.equal(stagedEntries.some((entry) => entry.class === "Lesson"), true);
assert.equal(stagedEntries.some((entry) => entry.class === "Receipt"), true);
assert.equal(stagedEntries.some((entry) => entry.class === "Handoff"), true);
assert.equal(stagedEntries.some((entry) => entry.class === "Memory"), true);

const supersededMemory = stagedEntries.find(
  (entry) => entry.class === "Memory" && entry.title === "Workspace State" && entry.status === "superseded"
);
assert.ok(supersededMemory);

console.log("PROOF_018_BRAIN_ENTRY_SCHEMA PASSED");
