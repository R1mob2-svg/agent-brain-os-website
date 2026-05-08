import { parseAgentResponse, extractDisplayResponse } from "../../lib/chat-vault/parser";

// Very simple assertion helper to avoid needing a test runner
function assert(condition: boolean, message: string) {
  if (!condition) throw new Error(`Assertion failed: ${message}`);
}

async function runTests() {
  console.log("Running Parser Tests...");

  // 1. Valid vault_auth parses
  const validRaw = JSON.stringify({
    vault_auth: {
      agent_id: "AG",
      session_id: "s1",
      response_id: "r1",
      timestamp: "2026-05-08T10:00:00Z",
      claims_made: [],
      claims_not_made: [],
      uncertainty_acknowledged: []
    },
    response: "Hello user"
  });

  const validOutcome = parseAgentResponse(validRaw);
  assert(validOutcome.ok === true, "Valid response should parse successfully");
  if (validOutcome.ok) {
    assert(validOutcome.parsed.vault_auth.agent_id === "AG", "Agent ID should match");
    assert(validOutcome.parsed.response === "Hello user", "Response should match");
  }

  // 2. Missing vault_auth returns STRUCTURE_FAILURE (ok: false)
  const missingAuthRaw = JSON.stringify({
    response: "Hello user"
  });
  const missingOutcome = parseAgentResponse(missingAuthRaw);
  assert(missingOutcome.ok === false, "Missing vault_auth should fail parsing");
  if (!missingOutcome.ok) {
    assert(missingOutcome.reason.includes("vault_auth"), "Reason should mention vault_auth");
  }

  // 3. Invalid JSON returns STRUCTURE_FAILURE
  const invalidJsonRaw = "{ vault_auth: ";
  const invalidOutcome = parseAgentResponse(invalidJsonRaw);
  assert(invalidOutcome.ok === false, "Invalid JSON should fail parsing");

  // 4. Natural language display strips vault_auth
  if (validOutcome.ok) {
    const display = extractDisplayResponse(validOutcome.parsed);
    assert(display === "Hello user", "Display response should only be the natural language part");
    assert(!display.includes("vault_auth"), "Display response must not contain vault_auth");
  }

  console.log("Parser Tests Passed ✓");
}

runTests().catch(err => {
  console.error("Parser Tests Failed ❌", err);
  process.exit(1);
});
