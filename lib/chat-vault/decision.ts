/**
 * Chat Vault V0.1 — Decision Engine
 * Aggregates claim validation outcomes into an overall decision and display response.
 */

import type { 
  ClaimValidationOutcome, 
  DecisionResult, 
  InterceptorRequest,
  ParsedAgentResponse 
} from "./types";
import { 
  DecisionVerdict, 
  ClaimValidationStatus, 
  InterceptorMode,
  ClaimType 
} from "./types";
import { loadPolicy } from "./allowlist";
import { extractDisplayResponse } from "./parser";

export function evaluateDecision(
  parsed: ParsedAgentResponse,
  outcomes: ClaimValidationOutcome[],
  timedOut: boolean,
  request: InterceptorRequest
): DecisionResult {
  const policy = loadPolicy();
  const mode = request.mode;
  const failMode = policy.fail_modes[mode] || "fail_closed";
  
  const blockedReasons: string[] = [];
  
  // 1. Check for STRUCTURE_FAILURE (passed from parser or explicitly in claims)
  const hasStructureFailure = outcomes.some(o => o.claim_type === ClaimType.STRUCTURE_FAILURE);
  if (hasStructureFailure) {
    blockedReasons.push("Agent reported STRUCTURE_FAILURE");
  }

  // 2. Check for REJECTED claims
  const rejectedClaims = outcomes.filter(o => o.status === ClaimValidationStatus.REJECTED);
  if (rejectedClaims.length > 0) {
    rejectedClaims.forEach(rc => {
      blockedReasons.push(`Claim ${rc.claim_id} rejected: ${rc.reason}`);
    });
  }

  // 3. Determine base verdict
  let verdict: DecisionVerdict;
  
  if (hasStructureFailure) {
    verdict = DecisionVerdict.STRUCTURE_FAILURE;
  } else if (rejectedClaims.length > 0) {
    verdict = DecisionVerdict.REJECTED;
  } else if (timedOut) {
    verdict = DecisionVerdict.DEGRADED;
    blockedReasons.push("Validation exceeded latency budget");
  } else {
    // Check if ALL claims are verified (no unverifiable)
    const allVerified = outcomes.length > 0 && outcomes.every(o => o.status === ClaimValidationStatus.VERIFIED);
    const hasUnverifiable = outcomes.some(o => o.status === ClaimValidationStatus.UNVERIFIABLE);
    
    if (allVerified) {
      verdict = DecisionVerdict.FULLY_VERIFIED;
    } else if (hasUnverifiable) {
      verdict = DecisionVerdict.PARTIALLY_VERIFIED;
    } else {
      // Empty claims list or only skipped
      verdict = DecisionVerdict.PARTIALLY_VERIFIED;
    }
  }

  // 4. Apply Fail Mode Logic
  let displayResponse: string | null = null;
  let footer = "";

  if (verdict === DecisionVerdict.FULLY_VERIFIED) {
    displayResponse = extractDisplayResponse(parsed);
    footer = "✓ Verified (Vault Auth)";
  } else if (verdict === DecisionVerdict.PARTIALLY_VERIFIED) {
    displayResponse = extractDisplayResponse(parsed);
    footer = "⚠ Partially Verified (Contains Subjective/Unverifiable claims)";
  } else {
    // REJECTED, STRUCTURE_FAILURE, or DEGRADED
    if (failMode === "fail_closed") {
      displayResponse = null;
      footer = `❌ Blocked by Chat Vault: ${verdict}`;
    } else {
      // fail_open_with_warning
      displayResponse = extractDisplayResponse(parsed);
      footer = `⚠ WARNING: Chat Vault Verification Failed (${verdict}). This response may contain unsupported claims.`;
    }
  }

  return {
    verdict,
    display_response: displayResponse,
    verification_footer: footer,
    blocked_reasons: blockedReasons
  };
}
