# Agent Brain OS Librarian MVP

This repo now carries the Agent Brain OS website as a lightweight Next.js app:

- premium landing page at `/`
- operator dashboard shell at `/app`
- Librarian MVP surfaces at `/app/librarian`, `/app/agents`, `/app/workspaces`, and `/app/candidates`
- bounded server-side retrieval and candidate-memory staging APIs under `/api/librarian/*`

## Product Truth

This is an MVP, not a fake finished platform.

What is real:

- premium marketing site
- bounded GitHub retrieval from `R1mob2-svg/global-agent-brain`
- server-side source commit + retrieval log reporting
- candidate-memory staging safety checks
- clear before/after positioning for normal agents vs Agent Brain OS agents

What is not claimed:

- arbitrary GitHub write access
- multi-tenant production scale
- customer memory promotion without governance
- browser-side private GitHub API access

## Local Run

Install and run:

```powershell
npm install
npm run dev
```

Then open:

```text
http://127.0.0.1:3000/
```

## Validation

Run the build and proof pack:

```powershell
npm run typecheck
npm run build
npm run proof:001
npm run proof:002
npm run proof:003
npm run proof:004
npm run proof:005
npm run proof:006
```

Proof coverage:

- `proof_001_librarian_health.ts`: bounded health payload
- `proof_002_repo_map_safety.ts`: repo map and path safety
- `proof_003_retrieval_permission_filters.ts`: bounded retrieval filtering
- `proof_004_candidate_memory_safety.ts`: candidate staging safety
- `proof_005_frontend_routes_render.ts`: core route render checks
- `proof_006_no_client_env_leak.ts`: no client-side env leakage

## Retrieval Model

- GitHub is the durable memory vault
- the Librarian API is the server-side control plane
- the browser never calls private GitHub APIs directly
- candidate updates remain staged until a governed promotion path exists

## Deployment

Preferred deployment target is Vercel.

Deploy only after:

1. typecheck passes
2. build passes
3. all proof scripts pass
4. no client env leak exists
5. any live URL claim is verified with a real HTTP/browser receipt
