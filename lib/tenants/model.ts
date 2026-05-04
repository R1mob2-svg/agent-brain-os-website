import { createHash } from "node:crypto";

export const TENANT_STATUSES = ["active", "suspended", "provisioning_required"] as const;

export type TenantStatus = (typeof TENANT_STATUSES)[number];

export type TenantMetadataValue = string | number | boolean | null;
export type TenantMetadata = Record<string, TenantMetadataValue>;

export interface TenantLimits {
  max_agents: number | null;
  max_api_keys: number | null;
  max_entries: number | null;
  max_workspaces: number | null;
  [key: string]: string | number | boolean | null;
}

export interface TenantRecord {
  tenant_id: string;
  tenant_name: string;
  owner_email?: string;
  github_repo_full_name?: string;
  status: TenantStatus;
  created_at: string;
  updated_at: string;
  limits: TenantLimits;
  metadata: TenantMetadata;
}

export interface CreateTenantInput {
  tenant_name: string;
  owner_email?: string;
  github_repo_full_name?: string;
  status?: TenantStatus;
  limits?: Partial<TenantLimits>;
  metadata?: TenantMetadata;
}

export interface TenantProvisioningResult {
  tenant: TenantRecord;
  provisioning_state: "repo_provisioning_not_implemented";
  resolution_path: "Slice Pack later must add governed GitHub repo provisioning";
  storage_mode: "mvp_dev_in_memory_only";
}

export const DEFAULT_TENANT_LIMITS: TenantLimits = {
  max_agents: 25,
  max_api_keys: 25,
  max_entries: 5_000,
  max_workspaces: 10
};

function normalizeTenantSlug(tenantName: string): string {
  const slug = tenantName
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 24);
  return slug || "tenant";
}

export function isTenantStatus(value: string): value is TenantStatus {
  return TENANT_STATUSES.includes(value as TenantStatus);
}

export function generateDeterministicTenantId(
  input: Pick<CreateTenantInput, "tenant_name" | "owner_email" | "github_repo_full_name">
): string {
  const canonical = [
    input.tenant_name.trim().toLowerCase(),
    input.owner_email?.trim().toLowerCase() ?? "",
    input.github_repo_full_name?.trim().toLowerCase() ?? ""
  ].join("|");
  const digest = createHash("sha256").update(canonical).digest("hex").slice(0, 12);
  return `tenant_${normalizeTenantSlug(input.tenant_name)}_${digest}`;
}

export function buildTenantRecord(input: CreateTenantInput, now = new Date().toISOString()): TenantRecord {
  const tenantName = input.tenant_name.trim();
  const ownerEmail = input.owner_email?.trim();
  const githubRepoFullName = input.github_repo_full_name?.trim();
  const limits = Object.fromEntries(
    Object.entries(input.limits ?? {}).filter(([, value]) => value !== undefined)
  ) as Partial<TenantLimits>;

  return {
    tenant_id: generateDeterministicTenantId({
      tenant_name: tenantName,
      owner_email: ownerEmail,
      github_repo_full_name: githubRepoFullName
    }),
    tenant_name: tenantName,
    owner_email: ownerEmail || undefined,
    github_repo_full_name: githubRepoFullName || undefined,
    status: input.status ?? "provisioning_required",
    created_at: now,
    updated_at: now,
    limits: {
      ...DEFAULT_TENANT_LIMITS,
      ...limits
    } as TenantLimits,
    metadata: { ...(input.metadata ?? {}) }
  };
}
