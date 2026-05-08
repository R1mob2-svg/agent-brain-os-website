/**
 * Chat Vault V0.1 — Parser
 * Parses raw agent response strings into structured { vault_auth, response } shape.
 * Returns STRUCTURE_FAILURE when the contract is not met.
 */

import type { ParseOutcome, VaultAuth, ParsedAgentResponse } from "./types";
import { ClaimType, Verifiability, ReceiptType } from "./types";

// ─── Shape guard helpers ───────────────────────────────────────────────────────

function isString(v: unknown): v is string {
  return typeof v === "string";
}

function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

function isArray(v: unknown): v is unknown[] {
  return Array.isArray(v);
}

function isValidClaimType(v: unknown): v is ClaimType {
  return isString(v) && Object.values(ClaimType).includes(v as ClaimType);
}

function isValidVerifiability(v: unknown): v is Verifiability {
  return isString(v) && Object.values(Verifiability).includes(v as Verifiability);
}

function isValidReceiptType(v: unknown): v is ReceiptType {
  return isString(v) && Object.values(ReceiptType).includes(v as ReceiptType);
}

function validateReceipt(r: unknown, index: number): string | null {
  if (!isObject(r)) return `claims_made[${index}].receipt is not an object`;
  if (!isValidReceiptType(r["type"])) {
    return `claims_made[${index}].receipt.type is invalid: ${String(r["type"])}`;
  }
  if (r["expected_match"] !== undefined && !isString(r["expected_match"])) {
    return `claims_made[${index}].receipt.expected_match must be a string`;
  }
  return null;
}

function validateClaim(c: unknown, index: number): string | null {
  if (!isObject(c)) return `claims_made[${index}] is not an object`;
  if (!isString(c["claim_id"]) || c["claim_id"].trim() === "") {
    return `claims_made[${index}].claim_id is missing or empty`;
  }
  if (!isValidClaimType(c["claim_type"])) {
    return `claims_made[${index}].claim_type is invalid: ${String(c["claim_type"])}`;
  }
  if (!isString(c["claim_text"]) || c["claim_text"].trim() === "") {
    return `claims_made[${index}].claim_text is missing or empty`;
  }
  if (!isValidVerifiability(c["verifiability"])) {
    return `claims_made[${index}].verifiability is invalid: ${String(c["verifiability"])}`;
  }
  const receiptError = validateReceipt(c["receipt"], index);
  if (receiptError !== null) return receiptError;
  return null;
}

function validateVaultAuth(va: unknown): string | null {
  if (!isObject(va)) return "vault_auth is not an object";
  const required: Array<keyof VaultAuth> = ["agent_id", "session_id", "response_id", "timestamp"];
  for (const field of required) {
    if (!isString(va[field]) || (va[field] as string).trim() === "") {
      return `vault_auth.${field} is missing or empty`;
    }
  }
  if (!isArray(va["claims_made"])) return "vault_auth.claims_made must be an array";
  if (!isArray(va["claims_not_made"])) return "vault_auth.claims_not_made must be an array";
  if (!isArray(va["uncertainty_acknowledged"])) return "vault_auth.uncertainty_acknowledged must be an array";

  for (let i = 0; i < (va["claims_made"] as unknown[]).length; i++) {
    const err = validateClaim((va["claims_made"] as unknown[])[i], i);
    if (err !== null) return err;
  }
  return null;
}

// ─── Main parser ──────────────────────────────────────────────────────────────

/**
 * Parses a raw agent response string.
 * The raw string must be a JSON object with both `vault_auth` and `response` keys.
 * On success returns { ok: true, parsed: { vault_auth, response } }.
 * On any failure returns { ok: false, reason: string }.
 */
export function parseAgentResponse(raw: string): ParseOutcome {
  if (!isString(raw) || raw.trim() === "") {
    return { ok: false, reason: "raw_response is empty or not a string" };
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return { ok: false, reason: `JSON parse error: ${message}` };
  }

  if (!isObject(parsed)) {
    return { ok: false, reason: "Parsed value is not a JSON object" };
  }

  if (!("vault_auth" in parsed)) {
    return { ok: false, reason: "Missing required key: vault_auth" };
  }

  if (!("response" in parsed)) {
    return { ok: false, reason: "Missing required key: response" };
  }

  const vaultAuthError = validateVaultAuth(parsed["vault_auth"]);
  if (vaultAuthError !== null) {
    return { ok: false, reason: `vault_auth validation failed: ${vaultAuthError}` };
  }

  if (!isString(parsed["response"])) {
    return { ok: false, reason: "response must be a string" };
  }

  return {
    ok: true,
    parsed: parsed as unknown as ParsedAgentResponse,
  };
}

/**
 * Extracts the user-facing display text from a parsed agent response.
 * NEVER includes vault_auth content.
 */
export function extractDisplayResponse(parsed: ParsedAgentResponse): string {
  return parsed.response;
}
