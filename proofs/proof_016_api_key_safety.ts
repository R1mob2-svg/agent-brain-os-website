import assert from "node:assert/strict";

import {
  clearApiKeyStoreForProofs,
  createApiKey,
  getApiKeyRecordForProofs,
  listApiKeysForTenant,
  revokeApiKey,
  validateApiKeyScopes,
  verifyApiKey
} from "../lib/api-keys/service";
import { clearTenantStoreForProofs, createTenant } from "../lib/tenants/service";

clearTenantStoreForProofs();
clearApiKeyStoreForProofs();

const tenant = createTenant({
  tenant_name: "Key Safety Tenant",
  owner_email: "keys@tenant.test"
}).tenant;

const created = createApiKey({
  tenant_id: tenant.tenant_id,
  scopes: ["tenant:read", "memory:write", "receipt:write"]
});

assert.equal(created.ok, true);

if (!created.ok) {
  throw new Error("Expected API key creation to succeed.");
}

assert.ok(created.raw_key.startsWith("abo_"));
assert.equal(created.api_key.key_prefix.length > 0, true);

const storedRecord = getApiKeyRecordForProofs(created.api_key.key_id);
assert.ok(storedRecord);
assert.notEqual(storedRecord?.key_hash, created.raw_key);
assert.equal(storedRecord?.status, "active");

const listedKeys = listApiKeysForTenant(tenant.tenant_id);
assert.equal(listedKeys.length, 1);
assert.equal("raw_key" in listedKeys[0], false);
assert.equal("key_hash" in listedKeys[0], false);

const verified = verifyApiKey(created.raw_key, ["tenant:read"]);
assert.equal(verified.valid, true);

const revoked = revokeApiKey(created.api_key.key_id);
assert.equal(revoked?.status, "revoked");

const revokedVerification = verifyApiKey(created.raw_key, ["tenant:read"]);
assert.equal(revokedVerification.valid, false);
assert.match(revokedVerification.reason ?? "", /revoked/i);

const scopeValidation = validateApiKeyScopes(["tenant:read", "not:real"]);
assert.equal(scopeValidation.valid, false);
assert.deepEqual(scopeValidation.invalid_scopes, ["not:real"]);

console.log("PROOF_016_API_KEY_SAFETY PASSED");
