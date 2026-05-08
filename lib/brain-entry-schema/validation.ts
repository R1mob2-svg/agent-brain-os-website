import { getTenantById } from "@/lib/tenants/service";

import {
  type BrainEntry,
  type BrainEntryValidationIssue,
  type StageBrainEntryFailure,
  type StageBrainEntryInput,
  type StageBrainEntrySuccess,
  generateBrainEntryId,
  isBrainEntrySensitivity,
  isBrainEntryStatus,
  isHandoffDeliveryStatus
} from "@/lib/brain-entry-schema/model";

export const BRAIN_ENTRY_STORAGE_MODE = "mvp_dev_in_memory_only" as const;

interface BrainEntryStore {
  entries: Map<string, BrainEntry>;
}

declare global {
  var __agentBrainOsBrainEntryStore: BrainEntryStore | undefined;
}

function getBrainEntryStore(): BrainEntryStore {
  if (!globalThis.__agentBrainOsBrainEntryStore) {
    globalThis.__agentBrainOsBrainEntryStore = {
      // MVP-only staging. This does not write to GitHub or provide production persistence.
      entries: new Map<string, BrainEntry>()
    };
  }

  return globalThis.__agentBrainOsBrainEntryStore;
}

const DEMO_ENTRIES: BrainEntry[] = [
  {
    entry_id: "entry_demo_doctrine_001",
    tenant_id: "tenant_demo_foundry_001",
    class: "Doctrine",
    title: "Doctrine: Proof Before Promotion",
    body: "Law: no PASS claim is allowed until proof receipts exist for the active tree.",
    status: "active",
    created_at: "2026-05-04T00:00:00.000Z",
    updated_at: "2026-05-04T00:00:00.000Z",
    sensitivity: "internal",
    tags: ["doctrine", "proof"],
    expires_by_default: false
  },
  {
    entry_id: "entry_demo_receipt_001",
    tenant_id: "tenant_demo_foundry_001",
    class: "Receipt",
    title: "Receipt: Example historical import",
    body: "Historical receipt showing prior execution context for audit reference only.",
    status: "active",
    created_at: "2026-05-04T00:00:00.000Z",
    updated_at: "2026-05-04T00:00:00.000Z",
    sensitivity: "internal",
    tags: ["receipt", "history"],
    historical_only: true,
    current_state_eligible: false
  }
];

function cloneEntry(entry: BrainEntry): BrainEntry {
  return structuredClone(entry);
}

function normalizeTags(tags: string[] | undefined): string[] {
  return [...new Set((tags ?? []).map((tag) => tag.trim()).filter(Boolean))];
}

export function validateBrainEntryInput(input: StageBrainEntryInput): BrainEntryValidationIssue[] {
  const issues: BrainEntryValidationIssue[] = [];
  const title = input.title.trim();
  const body = input.body.trim();

  if (!input.tenant_id.trim()) {
    issues.push({
      field: "tenant_id",
      reason: "A tenant_id is required for every Agent Brain OS entry."
    });
  }

  if (!title) {
    issues.push({
      field: "title",
      reason: "Entries must provide a non-empty title."
    });
  }

  if (!body) {
    issues.push({
      field: "body",
      reason: "Entries must provide a non-empty body."
    });
  }

  if (input.status && !isBrainEntryStatus(input.status)) {
    issues.push({
      field: "status",
      reason: `Unsupported entry status '${input.status}'.`
    });
  }

  if (input.sensitivity && !isBrainEntrySensitivity(input.sensitivity)) {
    issues.push({
      field: "sensitivity",
      reason: `Unsupported sensitivity '${input.sensitivity}'.`
    });
  }

  const tags = normalizeTags(input.tags);
  if ((input.tags ?? []).length > 0 && tags.length === 0) {
    issues.push({
      field: "tags",
      reason: "Tags must contain at least one non-empty value when provided."
    });
  }

  if (input.class === "Doctrine" && !/\b(rule|principle|law)\b/i.test(`${title} ${body}`)) {
    issues.push({
      field: "body",
      reason: "Doctrine entries must include explicit rule, principle, or law language."
    });
  }

  if (input.class === "Handoff" && input.delivery_status && !isHandoffDeliveryStatus(input.delivery_status)) {
    issues.push({
      field: "delivery_status",
      reason: `Unsupported handoff delivery status '${input.delivery_status}'.`
    });
  }

  return issues;
}

function buildBrainEntry(input: StageBrainEntryInput, now = new Date().toISOString()): BrainEntry {
  const baseEntry = {
    entry_id: generateBrainEntryId(),
    tenant_id: input.tenant_id.trim(),
    workspace_id: input.workspace_id?.trim() || undefined,
    class: input.class,
    title: input.title.trim(),
    body: input.body.trim(),
    status: input.status ?? "active",
    created_at: now,
    updated_at: now,
    source_agent: input.source_agent?.trim() || undefined,
    proof_reference: input.proof_reference?.trim() || undefined,
    supersedes: input.supersedes?.trim() || undefined,
    sensitivity: input.sensitivity ?? "internal",
    tags: normalizeTags(input.tags)
  } as const;

  switch (input.class) {
    case "Doctrine":
      return {
        ...baseEntry,
        class: "Doctrine",
        expires_by_default: false
      };
    case "Lesson":
      return {
        ...baseEntry,
        class: "Lesson"
      };
    case "Receipt":
      return {
        ...baseEntry,
        class: "Receipt",
        historical_only: true,
        current_state_eligible: false
      };
    case "Handoff":
      return {
        ...baseEntry,
        class: "Handoff",
        delivery_status: input.delivery_status ?? "pending",
        expires_at: input.expires_at?.trim() || undefined
      };
    case "Memory":
      return {
        ...baseEntry,
        class: "Memory",
        current_state_eligible: true
      };
  }
}

function findSupersededMemoryCandidate(entry: BrainEntry): BrainEntry | undefined {
  return [...getBrainEntryStore().entries.values()]
    .filter((candidate) => candidate.class === "Memory")
    .filter((candidate) => candidate.tenant_id === entry.tenant_id)
    .filter((candidate) => candidate.workspace_id === entry.workspace_id)
    .filter((candidate) => candidate.title === entry.title)
    .filter((candidate) => candidate.status === "active")
    .sort((left, right) => right.updated_at.localeCompare(left.updated_at))[0];
}

export function stageBrainEntry(
  input: StageBrainEntryInput
): StageBrainEntrySuccess | StageBrainEntryFailure {
  if (!getTenantById(input.tenant_id)) {
    return {
      ok: false,
      code: "missing_tenant",
      reason: `Tenant '${input.tenant_id}' does not exist, so the entry cannot be staged.`,
      resolution_path: "Create the tenant first via /api/v1/tenants before staging tenant-scoped entries."
    };
  }

  const issues = validateBrainEntryInput(input);
  if (issues.length > 0) {
    return {
      ok: false,
      code: "validation_failed",
      reason: "The proposed entry did not satisfy the Agent Brain OS schema rules.",
      resolution_path: "Fix the validation issues and retry the staged-only entry submission.",
      issues
    };
  }

  const entry = buildBrainEntry(input);
  const store = getBrainEntryStore();
  const warnings: string[] = [];

  if (entry.class === "Memory") {
    const superseded = findSupersededMemoryCandidate(entry);
    if (superseded) {
      store.entries.set(superseded.entry_id, {
        ...superseded,
        status: "superseded",
        updated_at: entry.updated_at
      });

      if (!entry.supersedes) {
        entry.supersedes = superseded.entry_id;
      }

      warnings.push("Previous active memory with the same title was superseded by this newer memory entry.");
    }
  }

  if (entry.class === "Receipt") {
    warnings.push("Receipt entries are staged as historical-only records and must not be treated as current state.");
  }

  store.entries.set(entry.entry_id, entry);

  return {
    ok: true,
    entry: cloneEntry(entry),
    write_state: "staged_only",
    github_write: false,
    storage_mode: BRAIN_ENTRY_STORAGE_MODE,
    warnings
  };
}

export function listStagedBrainEntries(): BrainEntry[] {
  return [...getBrainEntryStore().entries.values()]
    .sort((left, right) => left.created_at.localeCompare(right.created_at))
    .map(cloneEntry);
}

export function listDemoBrainEntries(): BrainEntry[] {
  return DEMO_ENTRIES.map(cloneEntry);
}

export function clearBrainEntryStoreForProofs() {
  getBrainEntryStore().entries.clear();
}
