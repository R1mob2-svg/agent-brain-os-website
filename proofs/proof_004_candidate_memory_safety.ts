import assert from "node:assert/strict";

import { stageCandidateMemoryUpdate } from "../lib/librarian/service";

const safe = stageCandidateMemoryUpdate({
  agent: "Geminex",
  workspace: "Agent Brain OS",
  proposedPath: "Agents/Geminex/Candidates/librarian-mvp.md",
  title: "Safe candidate",
  content: "Bounded candidate write preview only.",
  rationale: "Safe candidate proof."
});
assert.equal(safe.status, "candidate_staged");

const secret = stageCandidateMemoryUpdate({
  agent: "Geminex",
  workspace: "Agent Brain OS",
  proposedPath: "Agents/Geminex/Candidates/secret.md",
  title: "Bad candidate",
  content: "github_pat_secret_should_block",
  rationale: "Should block."
});
assert.equal(secret.status, "blocked_secret_like");

const protectedPath = stageCandidateMemoryUpdate({
  agent: "Geminex",
  workspace: "Agent Brain OS",
  proposedPath: "Doctrine/BAD.md",
  title: "Bad path",
  content: "Do not allow this.",
  rationale: "Should block."
});
assert.equal(protectedPath.status, "blocked_invalid_path");

console.log("PROOF_004_CANDIDATE_MEMORY_SAFETY PASSED");
