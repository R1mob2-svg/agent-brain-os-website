import { createHash, randomBytes, randomUUID, timingSafeEqual } from "node:crypto";

import {
  type ApiKeyCreationResult,
  type ApiKeyRecord,
  type ApiKeyScope,
  type RedactedApiKeyRecord,
  isApiKeyScope,
  redactApiKey
} from "@/lib/api-keys/model";
import { getTenantById } from "@/lib/tenants/service";

export const API_KEY_STORAGE_MODE = "mvp_dev_in_memory_only" as const;

interface ApiKeyStore {
  keys: Map<string, ApiKeyRecord>;
}

export interface ScopeValidationResult {
  valid: boolean;
  scopes: ApiKeyScope[];
  invalid_scopes: string[];
}

export interface CreateApiKeySuccess {
  ok: true;
  api_key: ApiKeyCreationResult["api_key"];
  raw_key: string;
  storage_mode: typeof API_KEY_STORAGE_MODE;
}

export interface CreateApiKeyFailure {
  ok: false;
  code: "missing_tenant" | "invalid_scopes";
  reason: string;
  resolution_path: string;
  invalid_scopes?: string[];
}

export interface ApiKeyVerificationResult {
  valid: boolean;
  key?: RedactedApiKeyRecord;
  reason?: string;
}

declare global {
  var __agentBrainOsApiKeyStore: ApiKeyStore | undefined;
}

function getApiKeyStore(): ApiKeyStore {
  if (!globalThis.__agentBrainOsApiKeyStore) {
    globalThis.__agentBrainOsApiKeyStore = {
      // MVP-only storage. Real production key persistence needs a DB/KMS layer later.
      keys: new Map<string, ApiKeyRecord>()
    };
  }

  return globalThis.__agentBrainOsApiKeyStore;
}

function cloneApiKeyRecord(record: ApiKeyRecord): ApiKeyRecord {
  return structuredClone(record);
}

function buildRawApiKey(tenantId: string): { rawKey: string; keyPrefix: string } {
  const tenantFragment = tenantId.replace(/^tenant_/, "").slice(0, 10) || "tenant";
  const publicSegment = randomBytes(5).toString("hex");
  const secretSegment = randomBytes(24).toString("base64url");
  const rawKey = `abo_${tenantFragment}_${publicSegment}_${secretSegment}`;
  return {
    rawKey,
    keyPrefix: rawKey.slice(0, 18)
  };
}

export function hashApiKey(rawKey: string): string {
  return createHash("sha256").update(rawKey).digest("hex");
}

export function validateApiKeyScopes(scopes: readonly string[]): ScopeValidationResult {
  const normalizedScopes = [...new Set(scopes.map((scope) => scope.trim()).filter(Boolean))];
  const validScopes = normalizedScopes.filter((scope): scope is ApiKeyScope => isApiKeyScope(scope));
  const invalidScopes = normalizedScopes.filter((scope) => !isApiKeyScope(scope));

  return {
    valid: invalidScopes.length === 0 && validScopes.length > 0,
    scopes: validScopes,
    invalid_scopes: invalidScopes
  };
}

export function createApiKey(input: {
  tenant_id: string;
  agent_id?: string;
  scopes: readonly string[];
}): CreateApiKeySuccess | CreateApiKeyFailure {
  if (!getTenantById(input.tenant_id)) {
    return {
      ok: false,
      code: "missing_tenant",
      reason: `Tenant '${input.tenant_id}' does not exist, so no API key can be issued.`,
      resolution_path: "Create the tenant first via /api/v1/tenants before issuing tenant-scoped keys."
    };
  }

  const scopeValidation = validateApiKeyScopes(input.scopes);
  if (!scopeValidation.valid) {
    return {
      ok: false,
      code: "invalid_scopes",
      reason: "One or more requested scopes are invalid for the Agent Brain OS MVP key model.",
      resolution_path: "Use only the documented API key scopes for this MVP route.",
      invalid_scopes: scopeValidation.invalid_scopes
    };
  }

  const { rawKey, keyPrefix } = buildRawApiKey(input.tenant_id);
  const now = new Date().toISOString();
  const record: ApiKeyRecord = {
    key_id: `key_${randomUUID()}`,
    tenant_id: input.tenant_id,
    agent_id: input.agent_id?.trim() || undefined,
    key_prefix: keyPrefix,
    key_hash: hashApiKey(rawKey),
    scopes: scopeValidation.scopes,
    status: "active",
    created_at: now
  };

  getApiKeyStore().keys.set(record.key_id, record);

  return {
    ok: true,
    api_key: redactApiKey(record),
    raw_key: rawKey,
    storage_mode: API_KEY_STORAGE_MODE
  };
}

export function listApiKeysForTenant(tenantId: string): RedactedApiKeyRecord[] {
  return [...getApiKeyStore().keys.values()]
    .filter((record) => record.tenant_id === tenantId)
    .sort((left, right) => left.created_at.localeCompare(right.created_at))
    .map((record) => redactApiKey(cloneApiKeyRecord(record)));
}

export function getApiKeyRecordForProofs(keyId: string): ApiKeyRecord | undefined {
  const record = getApiKeyStore().keys.get(keyId);
  return record ? cloneApiKeyRecord(record) : undefined;
}

export function verifyApiKey(rawKey: string, requiredScopes: readonly ApiKeyScope[] = []): ApiKeyVerificationResult {
  const candidateHash = hashApiKey(rawKey);
  const required = [...new Set(requiredScopes)];

  for (const record of getApiKeyStore().keys.values()) {
    const recordHashBuffer = Buffer.from(record.key_hash, "hex");
    const candidateHashBuffer = Buffer.from(candidateHash, "hex");

    if (
      recordHashBuffer.length === candidateHashBuffer.length &&
      timingSafeEqual(recordHashBuffer, candidateHashBuffer)
    ) {
      if (record.status === "revoked") {
        return {
          valid: false,
          reason: "API key matched a stored record, but that key has been revoked."
        };
      }

      const missingScopes = required.filter((scope) => !record.scopes.includes(scope));
      if (missingScopes.length > 0) {
        return {
          valid: false,
          reason: `API key is missing required scopes: ${missingScopes.join(", ")}`
        };
      }

      return {
        valid: true,
        key: redactApiKey(cloneApiKeyRecord(record))
      };
    }
  }

  return {
    valid: false,
    reason: "API key did not match any stored MVP key record."
  };
}

export function revokeApiKey(keyId: string): RedactedApiKeyRecord | undefined {
  const record = getApiKeyStore().keys.get(keyId);
  if (!record) {
    return undefined;
  }

  const revokedRecord: ApiKeyRecord = {
    ...record,
    status: "revoked",
    revoked_at: record.revoked_at ?? new Date().toISOString()
  };

  getApiKeyStore().keys.set(keyId, revokedRecord);
  return redactApiKey(cloneApiKeyRecord(revokedRecord));
}

export function clearApiKeyStoreForProofs() {
  getApiKeyStore().keys.clear();
}
