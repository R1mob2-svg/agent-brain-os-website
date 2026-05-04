import assert from "node:assert/strict";

import { stageCandidateMemoryUpdate } from "../lib/librarian/service";
import {
  validateBlockingResponseHasResolutionPath,
  validateGenerationMode
} from "../lib/response-laws/enforcement";

const blockedResponses = [
  stageCandidateMemoryUpdate({
    agent: "Geminex",
    workspace: "Agent Brain OS",
    proposedPath: "Doctrine/not-allowed.md",
    title: "Invalid path candidate",
    content: "Path should fail validation.",
    rationale: "Invalid path proof."
  }),
  stageCandidateMemoryUpdate({
    agent: "Geminex",
    workspace: "Agent Brain OS",
    proposedPath: "Agents/Newton/Candidates/not-allowed.md",
    title: "Protected path candidate",
    content: "Protected path should fail validation.",
    rationale: "Protected path proof."
  }),
  stageCandidateMemoryUpdate({
    agent: "Geminex",
    workspace: "Agent Brain OS",
    proposedPath: "Agents/Geminex/Candidates/secret-bearing.md",
    title: "Secret-like candidate",
    content: "Bearer abcdefghijklmnopqrstuvwxyz123456",
    rationale: "Secret proof."
  })
];

for (const response of blockedResponses) {
  const validation = validateBlockingResponseHasResolutionPath(JSON.stringify(response, null, 2));
  assert.equal(validation.valid, true, `Blocked response missing recovery metadata for ${response.status}`);
  assert.equal(validation.hasSpecificReason, true, `Blocked response missing reason for ${response.status}`);
  assert.equal(validation.hasResolutionPath, true, `Blocked response missing path for ${response.status}`);
  assert.equal(validateGenerationMode(response.response_generation_mode), true);
}

console.log("PROOF_010_BLOCKING_RESOLUTION_PATHS PASSED");
