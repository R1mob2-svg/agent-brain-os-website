# Geminex As First Customer Plan

Current state: not integrated yet.

Agent Brain OS can truthfully expose Librarian MVP status and receipt surfaces in this branch, but Geminex does not consume Agent Brain OS through a customer API yet.

## Target state

Geminex consumes Agent Brain OS through a bounded API instead of direct GitHub brain reads, and Geminex submits run receipts back through an outbox lane that Agent Brain OS can verify.

## Phased plan

1. Create internal Rob tenant.
2. Generate Geminex API key.
3. Replace direct GitHub brain reads with Agent Brain OS context-pack API.
4. Submit Geminex run receipts to outbox API.
5. Verify retrieval logs and exclusions.
6. Gate production use behind proof.

## Required endpoints

- `GET /api/librarian/health`
  Existing truth surface for bounded Librarian health.
- `GET /api/librarian/release-receipt`
  Existing MVP receipt surface for release truth.
- `POST /api/librarian/context-pack`
  Required before cutover. Planned, not implemented in this branch.
- `POST /api/librarian/outbox/receipts`
  Required before cutover. Planned, not implemented in this branch.

## Required secrets and config

- `GEMINEX_TENANT_ID`
- `GEMINEX_API_KEY`
- `AGENT_BRAIN_OS_BASE_URL`
- retrieval root allowlist
- retrieval exclusion list
- outbox receipt signing secret

## Required receipts

- tenant creation receipt
- Geminex API key issuance receipt
- context-pack response proof
- outbox receipt acceptance proof
- retrieval log and exclusion proof
- production gate proof

## Rollback plan

- Keep the current direct-read Geminex path available until the API cutover is proven.
- Revoke the Geminex API key if retrieval scope, exclusion rules, or receipt integrity fail.
- Switch Geminex back to the current direct-read workflow if the API path cannot prove parity.
- Keep production use disabled until the proof set is green again.

## Claim boundary

No fake integration claim. Geminex is the planned first customer, not an already integrated customer in this branch.
