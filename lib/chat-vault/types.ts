/**
 * Chat Vault V0.1 — Core Types
 * Runtime hallucination gate companion to ASIOD V4.
 * Do not import secrets, env vars, or provider credentials here.
 */

// ─── Enums ────────────────────────────────────────────────────────────────────

export enum ClaimType {
  FACTUAL = "FACTUAL",
  REASONING = "REASONING",
  SUBJECTIVE = "SUBJECTIVE",
  UNCERTAIN = "UNCERTAIN",
  RETRIEVED = "RETRIEVED",
  STRUCTURE_FAILURE = "STRUCTURE_FAILURE",
}

export enum Verifiability {
  VERIFIABLE = "VERIFIABLE",
  UNVERIFIABLE = "UNVERIFIABLE",
  VERIFIABLE_WITH_LATENCY = "VERIFIABLE_WITH_LATENCY",
}

export enum ReceiptType {
  FILE = "FILE",
  API = "API",
  DB = "DB",
  URL = "URL",
  MEMORY = "MEMORY",
  NONE = "NONE",
}

export enum DecisionVerdict {
  FULLY_VERIFIED = "FULLY_VERIFIED",
  PARTIALLY_VERIFIED = "PARTIALLY_VERIFIED",
  DEGRADED = "DEGRADED",
  REJECTED = "REJECTED",
  STRUCTURE_FAILURE = "STRUCTURE_FAILURE",
}

export enum InterceptorMode {
  FOUNDER_COMMAND = "founder_command",
  PROTECTED_ACTION = "protected_action",
  PRODUCTION_DATA_WRITE = "production_data_write",
  GENERAL_CHAT = "general_chat",
  READ_ONLY_QUERY = "read_only_query",
}

export enum ClaimValidationStatus {
  VERIFIED = "VERIFIED",
  UNVERIFIABLE = "UNVERIFIABLE",
  REJECTED = "REJECTED",
  SKIPPED = "SKIPPED",
  TIMED_OUT = "TIMED_OUT",
}

// ─── Receipt & Claim ──────────────────────────────────────────────────────────

export interface Receipt {
  type: ReceiptType;
  path?: string;
  url?: string;
  session_retrieval_id?: string;
  expected_match?: string;
  retrieval_method?: string;
}

export interface Claim {
  claim_id: string;
  claim_type: ClaimType;
  claim_text: string;
  verifiability: Verifiability;
  receipt: Receipt;
}

// ─── VaultAuth ────────────────────────────────────────────────────────────────

export interface VaultAuth {
  agent_id: string;
  session_id: string;
  response_id: string;
  timestamp: string;
  claims_made: Claim[];
  claims_not_made: string[];
  uncertainty_acknowledged: string[];
}

// ─── Parsed Agent Response ────────────────────────────────────────────────────

export interface ParsedAgentResponse {
  vault_auth: VaultAuth;
  response: string;
}

export interface ParseResult {
  ok: true;
  parsed: ParsedAgentResponse;
}

export interface ParseFailure {
  ok: false;
  reason: string;
}

export type ParseOutcome = ParseResult | ParseFailure;

// ─── Claim Validation ─────────────────────────────────────────────────────────

export interface ClaimValidationOutcome {
  claim_id: string;
  claim_type: ClaimType;
  status: ClaimValidationStatus;
  reason: string;
  timing_ms: number;
}

// ─── Interceptor Request / Response ──────────────────────────────────────────

export interface InterceptorRequest {
  tenant_id: string;
  agent_id: string;
  session_id: string;
  raw_response: string;
  mode: InterceptorMode;
  agent_writable_paths?: string[];
  recently_modified_paths?: string[];
  memory_retrievals?: string[];
}

export interface InterceptorResponse {
  decision: DecisionVerdict;
  display_response: string | null;
  verification_footer: string;
  claims: ClaimValidationOutcome[];
  blocked_reasons: string[];
  audit_id: string;
}

// ─── Decision Result ──────────────────────────────────────────────────────────

export interface DecisionResult {
  verdict: DecisionVerdict;
  display_response: string | null;
  verification_footer: string;
  blocked_reasons: string[];
}

// ─── Audit Entry ──────────────────────────────────────────────────────────────

export interface TimingBreakdown {
  parse_ms: number;
  validation_ms: number;
  decision_ms: number;
  audit_write_ms: number;
  total_ms: number;
}

export interface AuditEntry {
  audit_id: string;
  tenant_id: string;
  agent_id: string;
  session_id: string;
  response_id: string;
  timestamp: string;
  raw_response_hash: string;
  parsed_vault_auth: VaultAuth | null;
  claim_validation_outcomes: ClaimValidationOutcome[];
  timing_breakdown: TimingBreakdown;
  final_decision: DecisionVerdict;
  display_response_hash: string | null;
  blocked_reasons: string[];
  mode: InterceptorMode;
}

// ─── Policy ───────────────────────────────────────────────────────────────────

export type FailMode = "fail_closed" | "fail_open_with_warning";

export interface ChatVaultPolicy {
  latency_budget_ms: number;
  fail_modes: Record<string, FailMode>;
  allowlisted_receipt_paths: string[];
  forbidden_receipt_paths: string[];
  max_claims_per_response: number;
  max_expected_match_length: number;
  audit_logging_enabled: boolean;
  raw_response_storage_mode: "hash_only" | "full";
  url_validation_enabled: boolean;
}
