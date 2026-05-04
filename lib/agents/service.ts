import { buildAgentIdentity, type AgentIdentity, type RegisterAgentInput } from "@/lib/agents/model";
import { getTenantById } from "@/lib/tenants/service";

export const AGENT_STORAGE_MODE = "mvp_dev_in_memory_only" as const;

interface AgentStore {
  agents: Map<string, AgentIdentity>;
}

export interface AgentRegistrationSuccess {
  ok: true;
  agent: AgentIdentity;
  storage_mode: typeof AGENT_STORAGE_MODE;
}

export interface AgentRegistrationFailure {
  ok: false;
  code: "missing_tenant" | "admin_verification_not_implemented" | "admin_scope_required";
  reason: string;
  resolution_path: string;
}

declare global {
  var __agentBrainOsAgentStore: AgentStore | undefined;
}

function getAgentStore(): AgentStore {
  if (!globalThis.__agentBrainOsAgentStore) {
    globalThis.__agentBrainOsAgentStore = {
      // MVP-only storage. This is not production identity persistence or isolation.
      agents: new Map<string, AgentIdentity>()
    };
  }

  return globalThis.__agentBrainOsAgentStore;
}

const DEMO_AGENTS: AgentIdentity[] = [
  {
    agent_id: "agent_geminex_demo_001",
    tenant_id: "tenant_demo_foundry_001",
    display_name: "Geminex Demo",
    role: "librarian-operator",
    allowed_operations: ["tenant:read", "memory:read", "receipt:write"],
    forbidden_operations: ["repo:delete", "admin"],
    allowed_paths: ["app/api/v1/**", "lib/**"],
    blocked_paths: ["Shared_Doctrine/**", "lib/response-laws/**"],
    trust_level: "standard",
    status: "active",
    created_at: "2026-05-04T00:00:00.000Z",
    updated_at: "2026-05-04T00:00:00.000Z"
  }
];

function cloneAgent(agent: AgentIdentity): AgentIdentity {
  return structuredClone(agent);
}

function requiresAdminVerification(allowedOperations: readonly string[]): boolean {
  return allowedOperations.some((operation) => /^admin(?::|$)/i.test(operation));
}

export function registerAgentIdentity(
  input: RegisterAgentInput,
  authContext: {
    verificationImplemented?: boolean;
    adminScopeVerified?: boolean;
  } = {}
): AgentRegistrationSuccess | AgentRegistrationFailure {
  if (!getTenantById(input.tenant_id)) {
    return {
      ok: false,
      code: "missing_tenant",
      reason: `Tenant '${input.tenant_id}' does not exist, so the agent identity cannot be registered.`,
      resolution_path: "Create the tenant first via /api/v1/tenants, then retry the tenant-scoped agent registration."
    };
  }

  const candidate = buildAgentIdentity(input);
  if (requiresAdminVerification(candidate.allowed_operations)) {
    if (!authContext.verificationImplemented) {
      return {
        ok: false,
        code: "admin_verification_not_implemented",
        reason: "Admin verification for agent self-escalation is not implemented on this MVP route yet.",
        resolution_path: "Wire admin-scoped API key verification before allowing agent identities to claim admin operations."
      };
    }

    if (!authContext.adminScopeVerified) {
      return {
        ok: false,
        code: "admin_scope_required",
        reason: "The requested agent identity includes admin operations, but no verified admin-scoped key was provided.",
        resolution_path: "Retry with a verified admin-scoped key once tenant API-key auth is fully wired into this route."
      };
    }
  }

  const store = getAgentStore();
  const existing = store.agents.get(candidate.agent_id);
  const agent: AgentIdentity = existing
    ? {
        ...existing,
        ...candidate,
        created_at: existing.created_at,
        updated_at: candidate.updated_at
      }
    : candidate;

  store.agents.set(agent.agent_id, agent);

  return {
    ok: true,
    agent: cloneAgent(agent),
    storage_mode: AGENT_STORAGE_MODE
  };
}

export function listAgents(): AgentIdentity[] {
  return [...getAgentStore().agents.values()]
    .sort((left, right) => left.created_at.localeCompare(right.created_at))
    .map(cloneAgent);
}

export function listAgentsForTenant(tenantId: string): AgentIdentity[] {
  return listAgents().filter((agent) => agent.tenant_id === tenantId);
}

export function listDemoAgents(): AgentIdentity[] {
  return DEMO_AGENTS.map(cloneAgent);
}

export function clearAgentStoreForProofs() {
  getAgentStore().agents.clear();
}
