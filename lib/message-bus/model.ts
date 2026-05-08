import { randomUUID } from "node:crypto";

export const MVP_STORAGE_MODE = "mvp_dev_in_memory_only" as const;
export const GITHUB_WRITE_ENABLED = false as const;

export const INBOX_MESSAGE_STATUSES = ["created", "dispatched", "acknowledged", "completed", "failed"] as const;
export const OUTBOX_RECEIPT_STATUSES = ["submitted", "accepted", "rejected", "failed"] as const;
export const OUTBOX_RECEIPT_VERDICTS = ["PASS", "PARTIAL", "BLOCKED", "FAIL"] as const;

export type InboxMessageStatus = (typeof INBOX_MESSAGE_STATUSES)[number];
export type OutboxReceiptStatus = (typeof OUTBOX_RECEIPT_STATUSES)[number];
export type OutboxReceiptVerdict = (typeof OUTBOX_RECEIPT_VERDICTS)[number];

export interface InboxMessage {
  message_id: string;
  tenant_id: string;
  target_agent_id: string;
  source_agent_id?: string;
  task_type: string;
  title: string;
  body: string;
  status: InboxMessageStatus;
  nonce: string;
  created_at: string;
  updated_at: string;
  acknowledged_at?: string;
  completed_at?: string;
  failed_reason?: string;
  receipt_id?: string;
}

export interface CreateInboxMessageInput {
  tenant_id: string;
  target_agent_id: string;
  source_agent_id?: string;
  task_type: string;
  title: string;
  body: string;
  nonce: string;
}

export interface OutboxReceipt {
  receipt_id: string;
  tenant_id: string;
  source_agent_id: string;
  related_message_id?: string;
  status: OutboxReceiptStatus;
  verdict: OutboxReceiptVerdict;
  summary: string;
  proof_refs: string[];
  created_at: string;
  updated_at: string;
  nonce: string;
  historical: true;
}

export interface CreateOutboxReceiptInput {
  tenant_id: string;
  source_agent_id: string;
  related_message_id?: string;
  status?: OutboxReceiptStatus;
  verdict: OutboxReceiptVerdict;
  summary: string;
  proof_refs?: string[];
  nonce: string;
}

export interface MessageBusDisclosure {
  storage_mode: typeof MVP_STORAGE_MODE;
  github_write: typeof GITHUB_WRITE_ENABLED;
  replay_protection: "tenant_nonce_memory_guard";
}

export interface HistoricalDisclosure {
  historical: true;
  current_state_claim: false;
}

export class MessageBusValidationError extends Error {
  readonly code: string;

  constructor(code: string, message: string) {
    super(message);
    this.code = code;
    this.name = "MessageBusValidationError";
  }
}

export class ReplayProtectionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ReplayProtectionError";
  }
}

export function buildMessageBusDisclosure(): MessageBusDisclosure {
  return {
    storage_mode: MVP_STORAGE_MODE,
    github_write: GITHUB_WRITE_ENABLED,
    replay_protection: "tenant_nonce_memory_guard"
  };
}

export function buildHistoricalDisclosure(): HistoricalDisclosure {
  return {
    historical: true,
    current_state_claim: false
  };
}

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function requireString(value: unknown, field: string): string {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new MessageBusValidationError("invalid_request", `${field} must be a non-empty string.`);
  }

  return value.trim();
}

export function optionalString(value: unknown, field: string): string | undefined {
  if (value === undefined || value === null) {
    return undefined;
  }

  if (typeof value !== "string") {
    throw new MessageBusValidationError("invalid_request", `${field} must be a string when provided.`);
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

export function optionalStringArray(value: unknown, field: string): string[] | undefined {
  if (value === undefined || value === null) {
    return undefined;
  }

  if (!Array.isArray(value) || value.some((entry) => typeof entry !== "string" || entry.trim().length === 0)) {
    throw new MessageBusValidationError("invalid_request", `${field} must be an array of non-empty strings.`);
  }

  return value.map((entry) => entry.trim());
}

export function assertEnumValue<T extends readonly string[]>(
  value: unknown,
  field: string,
  allowed: T
): T[number] {
  if (typeof value !== "string" || !allowed.includes(value)) {
    throw new MessageBusValidationError("invalid_request", `${field} must be one of: ${allowed.join(", ")}.`);
  }

  return value;
}

export function createReplayKey(tenantId: string, nonce: string): string {
  return `${tenantId}::${nonce}`;
}

export function newMessageBusId(prefix: "message" | "receipt" | "audit"): string {
  return `${prefix}_${randomUUID()}`;
}
