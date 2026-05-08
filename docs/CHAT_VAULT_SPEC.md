# Chat Vault V0.1 — Specification

## Overview
The Chat Vault intercepts agent responses, extracts the `vault_auth` machine-readable JSON, validates its claims against allowed receipts, and returns a verified `display_response` to the user alongside an audit log.

## `vault_auth` Contract Shape

```json
{
  "vault_auth": {
    "agent_id": "AG",
    "session_id": "uuid",
    "response_id": "uuid",
    "timestamp": "ISO8601",
    "claims_made": [
      {
        "claim_id": "c1",
        "claim_type": "FACTUAL",
        "claim_text": "Exact statement being claimed",
        "verifiability": "VERIFIABLE",
        "receipt": {
          "type": "FILE",
          "path": "Shared_State/example.md",
          "expected_match": "text expected in source",
          "retrieval_method": "read_only_file"
        }
      }
    ],
    "claims_not_made": [],
    "uncertainty_acknowledged": []
  },
  "response": "Natural language answer shown to user"
}
```

## Allowed Claim Types
- `FACTUAL`: Claims a verifiable truth. Requires a valid receipt (not `NONE`).
- `REASONING`: Deductive or inductive logic. Receipt type `NONE` allowed.
- `SUBJECTIVE`: Opinions or subjective assessments. Receipt type `NONE` allowed.
- `UNCERTAIN`: Claims where the agent expresses doubt. Receipt type `NONE` allowed.
- `RETRIEVED`: Claims based on session memory. Requires `session_retrieval_id`.
- `STRUCTURE_FAILURE`: Used internally or explicitly by the agent if it cannot produce the required shape.

## Allowed Verifiability
- `VERIFIABLE`
- `UNVERIFIABLE`
- `VERIFIABLE_WITH_LATENCY`

## Allowed Receipt Types
- `FILE`: Must be an allowlisted path.
- `API`: (Reserved for future)
- `DB`: (Reserved for future)
- `URL`: (Gated by policy flag)
- `MEMORY`: Must match a current `session_retrieval_id`.
- `NONE`: Allowed only for non-factual claim types.

## Interceptor Route
`POST /api/chat-vault-interceptor`

**Request Body:**
```json
{
  "tenant_id": "rob",
  "agent_id": "AG",
  "session_id": "uuid",
  "raw_response": "{...}",
  "mode": "founder_command | protected_action | general_chat | read_only_query",
  "agent_writable_paths": [],
  "recently_modified_paths": [],
  "memory_retrievals": []
}
```

**Response Body:**
```json
{
  "decision": "FULLY_VERIFIED | PARTIALLY_VERIFIED | DEGRADED | REJECTED | STRUCTURE_FAILURE",
  "display_response": "string or null",
  "verification_footer": "string",
  "claims": [],
  "blocked_reasons": [],
  "audit_id": "string"
}
```

## Decision Logic
1. Missing/invalid `vault_auth` -> `STRUCTURE_FAILURE`
2. `FACTUAL` claim with `NONE` receipt -> `REJECTED`
3. Receipt path not allowlisted -> `REJECTED`
4. Receipt points to agent-writable or recently modified path -> `REJECTED`
5. `expected_match` not found -> `REJECTED`
6. Validation times out -> `DEGRADED`
7. All factual claims verified -> `FULLY_VERIFIED`
8. Mix of verified and unverifiable non-factual claims -> `PARTIALLY_VERIFIED`

## Fail Modes (per mode)
- `founder_command`, `protected_action`: **Fail Closed** (Return null response on failure)
- `general_chat`, `read_only_query`: **Fail Open** (Return response with warning on failure)

## Allowlist Rules
- Allowed: `docs/**`, `Shared_Doctrine/**`, `Shared_State/**`, `Audit_Log/**`
- Forbidden: `.env`, secrets, `.git`, `node_modules`, agent working directories, files modified in current session.

## Audit Log
Stored locally as `audit-log/chat-vault/YYYY-MM-DD/<response_id>.json`.
Policy defaults to `hash_only` for raw responses to prevent sensitive data leaks.
