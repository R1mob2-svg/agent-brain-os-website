import { randomUUID } from "node:crypto";

export const BRAIN_ENTRY_CLASSES = ["Doctrine", "Lesson", "Receipt", "Handoff", "Memory"] as const;
export const BRAIN_ENTRY_STATUSES = ["active", "superseded", "stale", "archived"] as const;
export const BRAIN_ENTRY_SENSITIVITY = ["public", "internal", "private", "restricted"] as const;
export const HANDOFF_DELIVERY_STATUSES = ["pending", "delivered", "expired"] as const;

export type BrainEntryClass = (typeof BRAIN_ENTRY_CLASSES)[number];
export type BrainEntryStatus = (typeof BRAIN_ENTRY_STATUSES)[number];
export type BrainEntrySensitivity = (typeof BRAIN_ENTRY_SENSITIVITY)[number];
export type HandoffDeliveryStatus = (typeof HANDOFF_DELIVERY_STATUSES)[number];

export interface BrainEntryBase {
  entry_id: string;
  tenant_id: string;
  workspace_id?: string;
  class: BrainEntryClass;
  title: string;
  body: string;
  status: BrainEntryStatus;
  created_at: string;
  updated_at: string;
  source_agent?: string;
  proof_reference?: string;
  supersedes?: string;
  sensitivity: BrainEntrySensitivity;
  tags: string[];
}

export interface DoctrineEntry extends BrainEntryBase {
  class: "Doctrine";
  expires_by_default: false;
}

export interface LessonEntry extends BrainEntryBase {
  class: "Lesson";
}

export interface ReceiptEntry extends BrainEntryBase {
  class: "Receipt";
  historical_only: true;
  current_state_eligible: false;
}

export interface HandoffEntry extends BrainEntryBase {
  class: "Handoff";
  delivery_status: HandoffDeliveryStatus;
  expires_at?: string;
}

export interface MemoryEntry extends BrainEntryBase {
  class: "Memory";
  current_state_eligible: true;
}

export type BrainEntry = DoctrineEntry | LessonEntry | ReceiptEntry | HandoffEntry | MemoryEntry;

export interface StageBrainEntryInput {
  tenant_id: string;
  workspace_id?: string;
  class: BrainEntryClass;
  title: string;
  body: string;
  status?: BrainEntryStatus;
  source_agent?: string;
  proof_reference?: string;
  supersedes?: string;
  sensitivity?: BrainEntrySensitivity;
  tags?: string[];
  delivery_status?: HandoffDeliveryStatus;
  expires_at?: string;
}

export interface BrainEntryValidationIssue {
  field: string;
  reason: string;
}

export interface StageBrainEntrySuccess {
  ok: true;
  entry: BrainEntry;
  write_state: "staged_only";
  github_write: false;
  storage_mode: "mvp_dev_in_memory_only";
  warnings: string[];
}

export interface StageBrainEntryFailure {
  ok: false;
  code: "validation_failed" | "missing_tenant";
  reason: string;
  resolution_path: string;
  issues?: BrainEntryValidationIssue[];
}

export function isBrainEntryClass(value: string): value is BrainEntryClass {
  return BRAIN_ENTRY_CLASSES.includes(value as BrainEntryClass);
}

export function isBrainEntryStatus(value: string): value is BrainEntryStatus {
  return BRAIN_ENTRY_STATUSES.includes(value as BrainEntryStatus);
}

export function isBrainEntrySensitivity(value: string): value is BrainEntrySensitivity {
  return BRAIN_ENTRY_SENSITIVITY.includes(value as BrainEntrySensitivity);
}

export function isHandoffDeliveryStatus(value: string): value is HandoffDeliveryStatus {
  return HANDOFF_DELIVERY_STATUSES.includes(value as HandoffDeliveryStatus);
}

export function generateBrainEntryId(): string {
  return `entry_${randomUUID()}`;
}
