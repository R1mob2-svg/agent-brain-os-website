# Commercial Gap Report V1

## Repo Scope

- Repo: `R1mob2-svg/agent-brain-os-website`
- Branch family truth: this is the Librarian MVP app branch family, not a finished commercial SaaS product
- Assessment basis: active MVP tree plus the bounded proof pack in this repository

## Currently Present

- Next.js app: CURRENTLY PRESENT
- Librarian app routes: CURRENTLY PRESENT
- Librarian API routes: CURRENTLY PRESENT
- bounded GitHub retrieval: CURRENTLY PRESENT
- candidate memory staging: CURRENTLY PRESENT
- proof scripts: CURRENTLY PRESENT
- GitHub source repo pointer: CURRENTLY PRESENT
- no client-side GitHub token proof: CURRENTLY PRESENT when `proof:006` passes

## Not Yet Implemented

- tenant provisioning: NOT YET IMPLEMENTED
- one GitHub repo per tenant: NOT YET IMPLEMENTED
- tenant API keys: NOT YET IMPLEMENTED
- per-agent scoped API keys: NOT YET IMPLEMENTED
- brain entry write API: NOT YET IMPLEMENTED
- inbox/outbox message bus: NOT YET IMPLEMENTED
- Postgres audit/query layer: NOT YET IMPLEMENTED
- customer dashboard V1: NOT YET IMPLEMENTED
- billing: NOT YET IMPLEMENTED
- Geminex integration as customer: NOT YET IMPLEMENTED
- production deployment: NOT YET IMPLEMENTED
- public beta readiness: NOT YET IMPLEMENTED

## Commercialization Gaps

- The current write lane is staged candidate preview only. There is no governed commercial write API for tenant memory operations.
- Retrieval is intentionally bounded to one source repository and one MVP safety model. It is not a tenant-aware retrieval fabric.
- There is no customer identity, billing, tenancy, or isolated persistence layer yet.
- There is no audited commercial message bus for inbox, outbox, task dispatch, or customer-visible delivery state.
- Proofs currently verify MVP safety and doctrine baselines, not hosted production readiness.

## Merge Risks For Later Packs

- Later packs must not over-claim multi-tenant or production readiness based on this MVP branch.
- Any future write path must preserve the staged-candidate safety model until a governed promotion lane is proven.
- Runtime enforcement of response-generation doctrine still needs explicit proof before it can be marketed as enforced behavior.
