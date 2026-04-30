import assert from "node:assert/strict";

import { buildHealthPayload } from "../lib/librarian/service";
import { AGENT_BRAIN_REPO } from "../lib/librarian/repo-map";

const health = buildHealthPayload();

assert.equal(health.status, "ok");
assert.equal(health.mode, "bounded_read_only_candidate");
assert.equal(health.repo, AGENT_BRAIN_REPO);
assert.equal(health.candidateWrites, "staged_only");

console.log("PROOF_001_LIBRARIAN_HEALTH PASSED");
