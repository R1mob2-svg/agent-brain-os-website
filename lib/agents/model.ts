import { createHash } from "node:crypto";

export const AGENT_TRUST_LEVELS = ["low", "standard", "elevated"] as const;
export const AGENT_STATUSES = ["active", "suspended"] as const;

export type AgentTrustLevel = (typeof AGENT_TRUST_LEVELS)[number];
export type AgentStatus = (typeof AGENT_STATUSES)[number];

export interface AgentIdentity {
  agent_id: string;
  tenant_id: string;
  display_name: string;
  role: string;
  allowed_operations: string[];
  forbidden_operations: string[];
  allowed_paths: string[];
  blocked_paths: string[];
  trust_level: AgentTrustLevel;
  status: AgentStatus;
  created_at: string;
  updated_at: string;
}

export interface RegisterAgentInput {
  tenant_id: string;
  display_name: string;
  role: string;
  allowed_operations?: string[];
  forbidden_operations?: string[];
  allowed_paths?: string[];
  blocked_paths?: string[];
  trust_level?: AgentTrustLevel;
  status?: AgentStatus;
}

function normalizeAgentSlug(value: string): string {
  const slug = value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 24);
  return slug || "agent";
}

function normalizeStringArray(values: string[] | undefined): string[] {
  return [...new Set((values ?? []).map((value) => value.trim()).filter(Boolean))];
}

export function isAgentTrustLevel(value: string): value is AgentTrustLevel {
  return AGENT_TRUST_LEVELS.includes(value as AgentTrustLevel);
}

export function isAgentStatus(value: string): value is AgentStatus {
  return AGENT_STATUSES.includes(value as AgentStatus);
}

export function generateAgentId(input: Pick<RegisterAgentInput, "tenant_id" | "display_name" | "role">): string {
  const canonical = [
    input.tenant_id.trim().toLowerCase(),
    input.display_name.trim().toLowerCase(),
    input.role.trim().toLowerCase()
  ].join("|");
  const digest = createHash("sha256").update(canonical).digest("hex").slice(0, 12);
  return `agent_${normalizeAgentSlug(input.display_name)}_${digest}`;
}

export function buildAgentIdentity(input: RegisterAgentInput, now = new Date().toISOString()): AgentIdentity {
  return {
    agent_id: generateAgentId(input),
    tenant_id: input.tenant_id.trim(),
    display_name: input.display_name.trim(),
    role: input.role.trim(),
    allowed_operations: normalizeStringArray(input.allowed_operations),
    forbidden_operations: normalizeStringArray(input.forbidden_operations),
    allowed_paths: normalizeStringArray(input.allowed_paths),
    blocked_paths: normalizeStringArray(input.blocked_paths),
    trust_level: input.trust_level ?? "standard",
    status: input.status ?? "active",
    created_at: now,
    updated_at: now
  };
}
