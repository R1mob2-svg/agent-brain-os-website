import assert from "node:assert/strict";

import { clearAgentStoreForProofs, listAgentsForTenant, registerAgentIdentity } from "../lib/agents/service";
import { clearTenantStoreForProofs, createTenant } from "../lib/tenants/service";

clearTenantStoreForProofs();
clearAgentStoreForProofs();

const missingTenantResult = registerAgentIdentity({
  tenant_id: "tenant_missing",
  display_name: "Unbound Agent",
  role: "operator"
});

assert.equal(missingTenantResult.ok, false);
if (!missingTenantResult.ok) {
  assert.equal(missingTenantResult.code, "missing_tenant");
  assert.match(missingTenantResult.reason, /does not exist/i);
}

const tenant = createTenant({
  tenant_name: "Identity Tenant",
  owner_email: "agents@tenant.test"
}).tenant;

const registered = registerAgentIdentity({
  tenant_id: tenant.tenant_id,
  display_name: "Librarian Assistant",
  role: "knowledge-operator",
  allowed_operations: ["memory:read", "memory:write"],
  forbidden_operations: ["repo:delete", "tenant:write"],
  allowed_paths: ["app/api/v1/**"],
  blocked_paths: ["Shared_Doctrine/**"]
});

assert.equal(registered.ok, true);
if (!registered.ok) {
  throw new Error("Expected normal agent registration to succeed.");
}

assert.equal(registered.agent.tenant_id, tenant.tenant_id);
assert.equal(registered.agent.forbidden_operations.includes("repo:delete"), true);

const tenantAgents = listAgentsForTenant(tenant.tenant_id);
assert.equal(tenantAgents.length, 1);

const adminAttempt = registerAgentIdentity({
  tenant_id: tenant.tenant_id,
  display_name: "Self Elevated Agent",
  role: "operator",
  allowed_operations: ["admin"],
  forbidden_operations: []
});

assert.equal(adminAttempt.ok, false);
if (!adminAttempt.ok) {
  assert.equal(adminAttempt.code, "admin_verification_not_implemented");
  assert.match(adminAttempt.reason, /not implemented/i);
}

console.log("PROOF_017_AGENT_IDENTITY_CARDS PASSED");
