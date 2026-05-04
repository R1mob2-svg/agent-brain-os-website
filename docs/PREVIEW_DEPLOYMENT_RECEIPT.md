# Agent Brain OS Preview Deployment Receipt

Date: 2026-05-04

## Git receipts

- Repo: `R1mob2-svg/agent-brain-os-website`
- Branch: `integration/agent-brain-os-24-slice`
- Starting HEAD: `6640b36cfe0f58869dd5da2b47e5e281a3189267`
- Final HEAD: `a708573a40860b171ba2d352ee5a987073d7e1f8`
- `git status --short`: clean
- `git log -n 5 --oneline` at close:
  - `a708573 Record post-integration audit repair receipt`
  - `73590d5 Audit and harden Agent Brain OS integration for deployment readiness`
  - `6640b36 Finalize Agent Brain OS 24-slice integration receipt`
  - `2384ed9 Merge slice-pack/05-geminex-integration-beta-release into Agent Brain OS 24-slice integration`
  - `c513b65 Merge slice-pack/04-message-bus-audit-dashboard into Agent Brain OS 24-slice integration`

Head drift note:
- An earlier preview verification in this session was built from `6640b36`.
- The branch later resolved to `a708573` on both local and origin, so proofs and preview deployment were rerun from `a708573` and only the `a708573` preview is the final verified result.

## Deployment

- Deployment attempted: `YES`
- Deployment provider: `Vercel`
- Preview URL: `https://agent-brain-os-website-3nzl991zv-robert-wigleys-projects.vercel.app`
- Production URL: `https://agent-brain-os-website.vercel.app`

Production truth:
- The production alias is real and returns `200`, but it points to deployment `dpl_GYLDk7aSPZ1e5RnC7Hanrs96FoW3`.
- That production deployment was built from commit `caa588af1b8dea1041ff9c5f5095b43d395b88cf` on branch `codex/agent-brain-os-librarian-mvp`.
- It is not the current `integration/agent-brain-os-24-slice` preview head and must not be used as proof that the integration branch is production-live.

Preview protection truth:
- Direct anonymous HTTP requests to the preview URL return `401 Unauthorized` because Vercel deployment protection is enabled.
- Authenticated verification was performed with the already-authenticated Vercel CLI and Vercel MCP surfaces.
- No temporary auth-bypass link is recorded here.

## Local proof lane

- `npm install`: PASS (`up to date`)
- `npm run typecheck`: PASS on `a708573`
- `npm run build`: PASS on `a708573`
- `proof:001` through `proof:024`: PASS on `a708573`

## HTTP checks

Authenticated `vercel curl --head` checks against preview `https://agent-brain-os-website-3nzl991zv-robert-wigleys-projects.vercel.app`:

| Route | Result | Content-Type |
| --- | --- | --- |
| `/` | `HTTP/1.1 200 OK` | `text/html; charset=utf-8` |
| `/app` | `HTTP/1.1 200 OK` | `text/html; charset=utf-8` |
| `/app/librarian` | `HTTP/1.1 200 OK` | `text/html; charset=utf-8` |
| `/app/dashboard` | `HTTP/1.1 200 OK` | `text/html; charset=utf-8` |
| `/app/inbox` | `HTTP/1.1 200 OK` | `text/html; charset=utf-8` |
| `/app/outbox` | `HTTP/1.1 200 OK` | `text/html; charset=utf-8` |
| `/app/audit` | `HTTP/1.1 200 OK` | `text/html; charset=utf-8` |
| `/app/status` | `HTTP/1.1 200 OK` | `text/html; charset=utf-8` |
| `/api/librarian/health` | `HTTP/1.1 200 OK` | `application/json` |
| `/api/librarian/release-receipt` | `HTTP/1.1 200 OK` | `application/json` |

## Browser / smoke checks

Verification method:
- The `agent-browser` CLI was not installed in this environment.
- Live smoke verification was therefore performed by combining authenticated `vercel curl` responses with authenticated rendered HTML fetches from the deployed preview.

Checks:
- App shell renders: PASS
  - `/app` returned the full shell with sidebar links for Overview, Dashboard, Librarian, Inbox, Outbox, Audit, Agents, Workspaces, and Candidates.
- Librarian page renders: PASS
  - `/app/librarian` returned the Librarian dashboard with retrieval metrics, context pack, authority pack, included sources, excluded sources, proof contract, and task-pack sections.
- Status page includes MVP / not full SaaS truth: PASS
  - `/app/status` rendered `Status: MVP / not full commercial SaaS`
  - `/app/status` rendered `Production deployment: unknown / not claimed unless proven`
  - `/app/status` rendered `Full SaaS readiness: not claimed`
- Release receipt API returns JSON: PASS
  - `/api/librarian/release-receipt` returned JSON with:
    - `status: MVP_NOT_FULL_SAAS`
    - `deployment_state: not_claimed`
    - `final_verdict: BLOCKED`
- No fake production / SaaS claim visible: PASS
  - `/` rendered `No fake scale claims.`
  - `/` rendered `It does not pretend to be a finished multi-tenant platform.`
- No obvious client-side token / env leakage: PASS
  - `proof:006` passed on the active tree.
  - Additional live-output regex sweep across preview responses for common token / private-key patterns found `NO_OBVIOUS_SECRET_PATTERNS_FOUND`.

## Remaining blockers

- Preview access is Vercel-auth protected for anonymous users; raw unauthenticated requests return `401`.
- The production alias is not this integration branch and must not be treated as current-branch live proof.
- The live release receipt for the preview self-reports:
  - `status: MVP_NOT_FULL_SAAS`
  - `deployment_state: not_claimed`
  - `final_verdict: BLOCKED`
- The current branch still does not prove:
  - production tenant isolation
  - one repo per tenant
  - tenant repo provisioning
  - API keys per tenant
  - Postgres audit/query layer
  - billing
  - public beta customer proof
  - Geminex live API consumption as customer
  - ReleaseSeal containment-pack parity

## Final verdict

- Final verdict: `PARTIAL`

Scope claim:
- Preview deployment for the current integration branch head `a708573` is real and verified.
- MVP landing page, app shell, Librarian page, status truth, and release-receipt API are live on the protected preview.
- This receipt is not a production sign-off and not a commercial SaaS readiness claim.
