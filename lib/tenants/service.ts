import {
  buildTenantRecord,
  type CreateTenantInput,
  type TenantProvisioningResult,
  type TenantRecord
} from "@/lib/tenants/model";

export const TENANT_STORAGE_MODE = "mvp_dev_in_memory_only" as const;
export const TENANT_PROVISIONING_STATE = "repo_provisioning_not_implemented" as const;
export const TENANT_PROVISIONING_RESOLUTION_PATH =
  "Slice Pack later must add governed GitHub repo provisioning" as const;

interface TenantStore {
  tenants: Map<string, TenantRecord>;
}

declare global {
  var __agentBrainOsTenantStore: TenantStore | undefined;
}

function getTenantStore(): TenantStore {
  if (!globalThis.__agentBrainOsTenantStore) {
    globalThis.__agentBrainOsTenantStore = {
      // MVP-only storage to keep the slice functional before real persistence exists.
      tenants: new Map<string, TenantRecord>()
    };
  }

  return globalThis.__agentBrainOsTenantStore;
}

const DEMO_TENANTS: TenantRecord[] = [
  {
    tenant_id: "tenant_demo_foundry_001",
    tenant_name: "Foundry Demo",
    owner_email: "ops@foundry.demo",
    github_repo_full_name: undefined,
    status: "provisioning_required",
    created_at: "2026-05-04T00:00:00.000Z",
    updated_at: "2026-05-04T00:00:00.000Z",
    limits: {
      max_agents: 5,
      max_api_keys: 5,
      max_entries: 500,
      max_workspaces: 2
    },
    metadata: {
      tier: "demo",
      note: "MVP-only example tenant with no repo provisioning."
    }
  }
];

function cloneTenantRecord(record: TenantRecord): TenantRecord {
  return structuredClone(record);
}

export function listTenants(): TenantRecord[] {
  return [...getTenantStore().tenants.values()]
    .sort((left, right) => left.created_at.localeCompare(right.created_at))
    .map(cloneTenantRecord);
}

export function listDemoTenants(): TenantRecord[] {
  return DEMO_TENANTS.map(cloneTenantRecord);
}

export function getTenantById(tenantId: string): TenantRecord | undefined {
  const record = getTenantStore().tenants.get(tenantId);
  return record ? cloneTenantRecord(record) : undefined;
}

export function createTenant(input: CreateTenantInput): TenantProvisioningResult {
  const store = getTenantStore();
  const nextRecord = buildTenantRecord(input);
  const existing = store.tenants.get(nextRecord.tenant_id);
  const record: TenantRecord = existing
    ? {
        ...existing,
        ...nextRecord,
        created_at: existing.created_at,
        updated_at: nextRecord.updated_at
      }
    : nextRecord;

  store.tenants.set(record.tenant_id, record);

  return {
    tenant: cloneTenantRecord(record),
    provisioning_state: TENANT_PROVISIONING_STATE,
    resolution_path: TENANT_PROVISIONING_RESOLUTION_PATH,
    storage_mode: TENANT_STORAGE_MODE
  };
}

export function clearTenantStoreForProofs() {
  getTenantStore().tenants.clear();
}
