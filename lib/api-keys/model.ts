export const API_KEY_SCOPES = [
  "tenant:read",
  "tenant:write",
  "memory:read",
  "memory:write",
  "receipt:write",
  "inbox:read",
  "inbox:write",
  "outbox:read",
  "outbox:write",
  "admin"
] as const;

export const API_KEY_STATUSES = ["active", "revoked"] as const;

export type ApiKeyScope = (typeof API_KEY_SCOPES)[number];
export type ApiKeyStatus = (typeof API_KEY_STATUSES)[number];

export interface ApiKeyRecord {
  key_id: string;
  tenant_id: string;
  agent_id?: string;
  key_prefix: string;
  key_hash: string;
  scopes: ApiKeyScope[];
  status: ApiKeyStatus;
  created_at: string;
  revoked_at?: string;
}

export interface CreateApiKeyInput {
  tenant_id: string;
  agent_id?: string;
  scopes: ApiKeyScope[];
}

export interface RedactedApiKeyRecord {
  key_id: string;
  tenant_id: string;
  agent_id?: string;
  key_prefix: string;
  scopes: ApiKeyScope[];
  status: ApiKeyStatus;
  created_at: string;
  revoked_at?: string;
}

export interface ApiKeyCreationResult {
  api_key: RedactedApiKeyRecord;
  raw_key: string;
  storage_mode: "mvp_dev_in_memory_only";
}

export function isApiKeyScope(value: string): value is ApiKeyScope {
  return API_KEY_SCOPES.includes(value as ApiKeyScope);
}

export function redactApiKey(record: ApiKeyRecord): RedactedApiKeyRecord {
  return {
    key_id: record.key_id,
    tenant_id: record.tenant_id,
    agent_id: record.agent_id,
    key_prefix: record.key_prefix,
    scopes: [...record.scopes],
    status: record.status,
    created_at: record.created_at,
    revoked_at: record.revoked_at
  };
}
