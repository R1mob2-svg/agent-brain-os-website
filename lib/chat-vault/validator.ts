/**
 * Chat Vault V0.1 — Validator
 * Validates individual claims from the parsed vault_auth against the allowed policy.
 */

import { readFileSync, existsSync } from "fs";
import { join } from "path";
import type { Claim, ClaimValidationOutcome, InterceptorRequest } from "./types";
import { ClaimType, ReceiptType, ClaimValidationStatus } from "./types";
import {
  isPathAllowlisted,
  isPathForbidden,
  isTenantMismatch,
  isSelfReferential,
  isRecentlyModified,
  loadPolicy
} from "./allowlist";

// ─── Verification helpers ──────────────────────────────────────────────────────

function checkExpectedMatch(filePath: string, expectedMatch: string | undefined): string | null {
  if (!expectedMatch || expectedMatch.trim() === "") {
    return "Receipt expected_match is missing or empty";
  }
  
  const policy = loadPolicy();
  if (expectedMatch.length > policy.max_expected_match_length) {
    return `expected_match exceeds maximum length of ${policy.max_expected_match_length}`;
  }

  const fullPath = join(process.cwd(), filePath);
  if (!existsSync(fullPath)) {
    return `File not found at path: ${filePath}`;
  }

  try {
    const content = readFileSync(fullPath, "utf-8");
    if (!content.includes(expectedMatch)) {
      return "expected_match not found in file content";
    }
    return null; // Match found
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return `Failed to read file for verification: ${msg}`;
  }
}

// ─── Main validator ────────────────────────────────────────────────────────────

export async function validateClaim(
  claim: Claim,
  request: InterceptorRequest
): Promise<ClaimValidationOutcome> {
  const start = performance.now();
  
  const createResult = (status: ClaimValidationStatus, reason: string): ClaimValidationOutcome => ({
    claim_id: claim.claim_id,
    claim_type: claim.claim_type,
    status,
    reason,
    timing_ms: Math.round(performance.now() - start),
  });

  // 1. FACTUAL claims require receipts
  if (claim.claim_type === ClaimType.FACTUAL && claim.receipt.type === ReceiptType.NONE) {
    return createResult(ClaimValidationStatus.REJECTED, "FACTUAL claims cannot use receipt type NONE");
  }

  // 2. Non-factual claims with NONE receipts are UNVERIFIABLE but allowed
  if (
    (claim.claim_type === ClaimType.REASONING ||
     claim.claim_type === ClaimType.SUBJECTIVE ||
     claim.claim_type === ClaimType.UNCERTAIN) &&
    claim.receipt.type === ReceiptType.NONE
  ) {
    return createResult(ClaimValidationStatus.UNVERIFIABLE, "Claim type allows NONE receipt");
  }

  // 3. RETRIEVED claims require session references
  if (claim.claim_type === ClaimType.RETRIEVED) {
    if (!claim.receipt.session_retrieval_id) {
       return createResult(ClaimValidationStatus.REJECTED, "RETRIEVED claims must provide session_retrieval_id");
    }
    const allowedRetrievals = request.memory_retrievals || [];
    if (!allowedRetrievals.includes(claim.receipt.session_retrieval_id)) {
      return createResult(ClaimValidationStatus.REJECTED, "session_retrieval_id not found in current session memory");
    }
    return createResult(ClaimValidationStatus.VERIFIED, "Memory retrieval verified against session context");
  }

  // 4. Handle FILE receipts
  if (claim.receipt.type === ReceiptType.FILE) {
    const path = claim.receipt.path;
    if (!path) {
      return createResult(ClaimValidationStatus.REJECTED, "FILE receipt requires a path");
    }

    if (isPathForbidden(path)) {
      return createResult(ClaimValidationStatus.REJECTED, "Receipt path is explicitly forbidden");
    }

    if (!isPathAllowlisted(path)) {
      return createResult(ClaimValidationStatus.REJECTED, "Receipt path is not allowlisted");
    }

    if (isTenantMismatch(path, request.tenant_id)) {
      return createResult(ClaimValidationStatus.REJECTED, "Tenant scope mismatch on receipt path");
    }

    if (isSelfReferential(path, request.agent_writable_paths || [])) {
      return createResult(ClaimValidationStatus.REJECTED, "Cannot cite agent's own writable paths as proof");
    }

    if (isRecentlyModified(path, request.recently_modified_paths || [])) {
      return createResult(ClaimValidationStatus.REJECTED, "Cannot cite files modified in the current session as proof");
    }

    // Perform actual verification
    const matchError = checkExpectedMatch(path, claim.receipt.expected_match);
    if (matchError !== null) {
      return createResult(ClaimValidationStatus.REJECTED, matchError);
    }

    return createResult(ClaimValidationStatus.VERIFIED, "Expected match found in allowlisted file");
  }

  // 5. Unimplemented receipt types
  return createResult(
    ClaimValidationStatus.REJECTED,
    `Validation for receipt type ${claim.receipt.type} is not yet implemented`
  );
}

export async function validateClaimsWithTimeout(
  claims: Claim[],
  request: InterceptorRequest,
  timeoutMs: number
): Promise<{ outcomes: ClaimValidationOutcome[]; timedOut: boolean }> {
  const policy = loadPolicy();
  const claimsToProcess = claims.slice(0, policy.max_claims_per_response);
  
  const outcomes: ClaimValidationOutcome[] = [];
  let timedOut = false;
  
  const startTime = performance.now();

  for (const claim of claimsToProcess) {
    if (performance.now() - startTime > timeoutMs) {
      timedOut = true;
      outcomes.push({
        claim_id: claim.claim_id,
        claim_type: claim.claim_type,
        status: ClaimValidationStatus.TIMED_OUT,
        reason: "Validation latency budget exceeded",
        timing_ms: 0
      });
      continue;
    }
    
    const outcome = await validateClaim(claim, request);
    outcomes.push(outcome);
  }

  return { outcomes, timedOut };
}
