import {
  INBOX_MESSAGE_STATUSES,
  type CreateInboxMessageInput,
  type InboxMessage,
  type InboxMessageStatus,
  type MessageBusDisclosure,
  ReplayProtectionError,
  buildMessageBusDisclosure,
  createReplayKey,
  newMessageBusId
} from "@/lib/message-bus/model";

interface InboxStore {
  messages: InboxMessage[];
  nonceIndex: Set<string>;
}

interface InboxListFilters {
  tenant_id?: string;
  target_agent_id?: string;
  source_agent_id?: string;
}

interface InboxListPayload extends MessageBusDisclosure {
  supported_statuses: InboxMessageStatus[];
  cross_tenant_routing: false;
  live_worker_claim: false;
  messages: InboxMessage[];
}

const globalStore = globalThis as typeof globalThis & {
  __agentBrainInboxStore?: InboxStore;
};

function getInboxStore(): InboxStore {
  if (!globalStore.__agentBrainInboxStore) {
    globalStore.__agentBrainInboxStore = {
      messages: [],
      nonceIndex: new Set<string>()
    };
  }

  return globalStore.__agentBrainInboxStore;
}

function sortNewestFirst(messages: InboxMessage[]): InboxMessage[] {
  return [...messages].sort((left, right) => right.created_at.localeCompare(left.created_at));
}

export function createInboxMessage(input: CreateInboxMessageInput): InboxMessage {
  const store = getInboxStore();
  const replayKey = createReplayKey(input.tenant_id, input.nonce);

  if (store.nonceIndex.has(replayKey)) {
    throw new ReplayProtectionError("Inbox nonce has already been accepted for this tenant.");
  }

  const timestamp = new Date().toISOString();
  const message: InboxMessage = {
    message_id: newMessageBusId("message"),
    tenant_id: input.tenant_id,
    target_agent_id: input.target_agent_id,
    source_agent_id: input.source_agent_id,
    task_type: input.task_type,
    title: input.title,
    body: input.body,
    status: "created",
    nonce: input.nonce,
    created_at: timestamp,
    updated_at: timestamp
  };

  store.nonceIndex.add(replayKey);
  store.messages.push(message);
  return message;
}

export function listInboxMessages(filters: InboxListFilters = {}): InboxListPayload {
  const store = getInboxStore();
  const messages = store.messages.filter((message) => {
    if (filters.tenant_id && message.tenant_id !== filters.tenant_id) {
      return false;
    }

    if (filters.target_agent_id && message.target_agent_id !== filters.target_agent_id) {
      return false;
    }

    if (filters.source_agent_id && message.source_agent_id !== filters.source_agent_id) {
      return false;
    }

    return true;
  });

  return {
    ...buildMessageBusDisclosure(),
    supported_statuses: [...INBOX_MESSAGE_STATUSES],
    cross_tenant_routing: false,
    live_worker_claim: false,
    messages: sortNewestFirst(messages)
  };
}

export function resetInboxStore() {
  globalStore.__agentBrainInboxStore = {
    messages: [],
    nonceIndex: new Set<string>()
  };
}
