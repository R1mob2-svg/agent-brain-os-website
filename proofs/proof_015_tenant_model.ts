import assert from "node:assert/strict";

import { generateDeterministicTenantId, isTenantStatus } from "../lib/tenants/model";
import { clearTenantStoreForProofs, createTenant, listTenants } from "../lib/tenants/service";

clearTenantStoreForProofs();

const deterministicIdA = generateDeterministicTenantId({
  tenant_name: "Acme Memory",
  owner_email: "owner@acme.test",
  github_repo_full_name: "R1mob2-svg/acme-memory"
});
const deterministicIdB = generateDeterministicTenantId({
  tenant_name: "Acme Memory",
  owner_email: "owner@acme.test",
  github_repo_full_name: "R1mob2-svg/acme-memory"
});

assert.equal(deterministicIdA, deterministicIdB);

const created = createTenant({
  tenant_name: "Acme Memory",
  owner_email: "owner@acme.test",
  github_repo_full_name: "R1mob2-svg/acme-memory"
});

assert.equal(created.tenant.tenant_id, deterministicIdA);
assert.equal(created.tenant.status, "provisioning_required");
assert.equal(created.provisioning_state, "repo_provisioning_not_implemented");
assert.match(created.resolution_path, /GitHub repo provisioning/);

for (const status of ["active", "suspended", "provisioning_required"]) {
  assert.equal(isTenantStatus(status), true);
}

const tenants = listTenants();
assert.equal(tenants.length, 1);
assert.equal(tenants[0]?.tenant_name, "Acme Memory");

console.log("PROOF_015_TENANT_MODEL PASSED");
