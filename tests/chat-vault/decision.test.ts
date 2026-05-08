import { evaluateDecision } from "../../lib/chat-vault/decision";
import { DecisionVerdict, ClaimValidationStatus, ClaimType, InterceptorMode } from "../../lib/chat-vault/types";
import type { ParsedAgentResponse, ClaimValidationOutcome, InterceptorRequest } from "../../lib/chat-vault/types";

function assert(condition: boolean, message: string) {
  if (!condition) throw new Error(`Assertion failed: ${message}`);
}

const mockParsed: ParsedAgentResponse = {
  vault_auth: {
    agent_id: "AG", session_id: "s1", response_id: "r1", timestamp: "ts",
    claims_made: [], claims_not_made: [], uncertainty_acknowledged: []
  },
  response: "User message"
};

const baseRequest: InterceptorRequest = {
  tenant_id: "rob", agent_id: "AG", session_id: "s1", raw_response: "{}",
  mode: InterceptorMode.GENERAL_CHAT
};

const verifiedOutcome: ClaimValidationOutcome = { claim_id: "1", claim_type: ClaimType.FACTUAL, status: ClaimValidationStatus.VERIFIED, reason: "", timing_ms: 10 };
const unverifiableOutcome: ClaimValidationOutcome = { claim_id: "2", claim_type: ClaimType.REASONING, status: ClaimValidationStatus.UNVERIFIABLE, reason: "", timing_ms: 10 };
const rejectedOutcome: ClaimValidationOutcome = { claim_id: "3", claim_type: ClaimType.FACTUAL, status: ClaimValidationStatus.REJECTED, reason: "fail", timing_ms: 10 };
const structureFailureOutcome: ClaimValidationOutcome = { claim_id: "4", claim_type: ClaimType.STRUCTURE_FAILURE, status: ClaimValidationStatus.REJECTED, reason: "fail", timing_ms: 10 };

async function runTests() {
  console.log("Running Decision Tests...");

  // 1. All Verified -> FULLY_VERIFIED
  const res1 = evaluateDecision(mockParsed, [verifiedOutcome, verifiedOutcome], false, baseRequest);
  assert(res1.verdict === DecisionVerdict.FULLY_VERIFIED, "All verified should be FULLY_VERIFIED");
  assert(res1.display_response === "User message", "Display response should be preserved");

  // 2. Mix of Verified and Unverifiable -> PARTIALLY_VERIFIED
  const res2 = evaluateDecision(mockParsed, [verifiedOutcome, unverifiableOutcome], false, baseRequest);
  assert(res2.verdict === DecisionVerdict.PARTIALLY_VERIFIED, "Mix should be PARTIALLY_VERIFIED");

  // 3. Timeout -> DEGRADED
  const res3 = evaluateDecision(mockParsed, [verifiedOutcome], true, baseRequest);
  assert(res3.verdict === DecisionVerdict.DEGRADED, "Timeout should result in DEGRADED");

  // 4. Any Rejected -> REJECTED
  const res4 = evaluateDecision(mockParsed, [verifiedOutcome, rejectedOutcome], false, baseRequest);
  assert(res4.verdict === DecisionVerdict.REJECTED, "Any rejected should result in REJECTED");

  // 5. Structure Failure -> STRUCTURE_FAILURE
  const res5 = evaluateDecision(mockParsed, [structureFailureOutcome], false, baseRequest);
  assert(res5.verdict === DecisionVerdict.STRUCTURE_FAILURE, "Explicit structure failure should result in STRUCTURE_FAILURE");

  // 6. Fail Open Warning (General Chat)
  const res6 = evaluateDecision(mockParsed, [rejectedOutcome], false, { ...baseRequest, mode: InterceptorMode.GENERAL_CHAT });
  assert(res6.display_response === "User message", "Fail open should return response");
  assert(res6.verification_footer.includes("WARNING"), "Fail open should append warning");

  // 7. Fail Closed (Protected Action)
  const res7 = evaluateDecision(mockParsed, [rejectedOutcome], false, { ...baseRequest, mode: InterceptorMode.PROTECTED_ACTION });
  assert(res7.display_response === null, "Fail closed should return null response");
  assert(res7.verification_footer.includes("Blocked"), "Fail closed should indicate block");

  console.log("Decision Tests Passed ✓");
}

runTests().catch(err => {
  console.error("Decision Tests Failed ❌", err);
  process.exit(1);
});
