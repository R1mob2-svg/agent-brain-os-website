import { MVP_STORAGE_MODE, newMessageBusId } from "@/lib/message-bus/model";

import type { AuditEvent, CreateAuditEventInput } from "@/lib/audit/model";

interface AuditStore {
  events: AuditEvent[];
}

interface AuditListFilters {
  tenant_id?: string;
  actor_id?: string;
  target_id?: string;
}

const globalStore = globalThis as typeof globalThis & {
  __agentBrainAuditStore?: AuditStore;
};

function getAuditStore(): AuditStore {
  if (!globalStore.__agentBrainAuditStore) {
    globalStore.__agentBrainAuditStore = {
      events: []
    };
  }

  return globalStore.__agentBrainAuditStore;
}

function sortNewestFirst(events: AuditEvent[]): AuditEvent[] {
  return [...events].sort((left, right) => right.timestamp.localeCompare(left.timestamp));
}

export function createAuditEvent(input: CreateAuditEventInput): AuditEvent {
  const event: AuditEvent = {
    audit_id: newMessageBusId("audit"),
    tenant_id: input.tenant_id,
    actor_id: input.actor_id,
    action: input.action,
    target_type: input.target_type,
    target_id: input.target_id,
    timestamp: new Date().toISOString(),
    summary: input.summary,
    metadata: input.metadata ?? {},
    historical: true
  };

  getAuditStore().events.push(event);
  return event;
}

export function listAuditEvents(filters: AuditListFilters = {}) {
  const events = getAuditStore().events.filter((event) => {
    if (filters.tenant_id && event.tenant_id !== filters.tenant_id) {
      return false;
    }

    if (filters.actor_id && event.actor_id !== filters.actor_id) {
      return false;
    }

    if (filters.target_id && event.target_id !== filters.target_id) {
      return false;
    }

    return true;
  });

  return {
    storage_mode: MVP_STORAGE_MODE,
    historical: true as const,
    current_state_claim: false as const,
    events: sortNewestFirst(events)
  };
}

export function resetAuditStore() {
  globalStore.__agentBrainAuditStore = {
    events: []
  };
}
