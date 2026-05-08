import {
  OUTBOX_RECEIPT_STATUSES,
  OUTBOX_RECEIPT_VERDICTS,
  type CreateOutboxReceiptInput,
  type HistoricalDisclosure,
  type MessageBusDisclosure,
  type OutboxReceipt,
  type OutboxReceiptStatus,
  type OutboxReceiptVerdict,
  ReplayProtectionError,
  buildHistoricalDisclosure,
  buildMessageBusDisclosure,
  createReplayKey,
  newMessageBusId
} from "@/lib/message-bus/model";

interface OutboxStore {
  receipts: OutboxReceipt[];
  nonceIndex: Set<string>;
}

interface OutboxListFilters {
  tenant_id?: string;
  source_agent_id?: string;
}

interface OutboxListPayload extends MessageBusDisclosure, HistoricalDisclosure {
  supported_statuses: OutboxReceiptStatus[];
  supported_verdicts: OutboxReceiptVerdict[];
  receipts: OutboxReceipt[];
}

const globalStore = globalThis as typeof globalThis & {
  __agentBrainOutboxStore?: OutboxStore;
};

function getOutboxStore(): OutboxStore {
  if (!globalStore.__agentBrainOutboxStore) {
    globalStore.__agentBrainOutboxStore = {
      receipts: [],
      nonceIndex: new Set<string>()
    };
  }

  return globalStore.__agentBrainOutboxStore;
}

function sortNewestFirst(receipts: OutboxReceipt[]): OutboxReceipt[] {
  return [...receipts].sort((left, right) => right.created_at.localeCompare(left.created_at));
}

export function createOutboxReceipt(input: CreateOutboxReceiptInput): OutboxReceipt {
  const store = getOutboxStore();
  const replayKey = createReplayKey(input.tenant_id, input.nonce);

  if (store.nonceIndex.has(replayKey)) {
    throw new ReplayProtectionError("Outbox nonce has already been accepted for this tenant.");
  }

  const timestamp = new Date().toISOString();
  const receipt: OutboxReceipt = {
    receipt_id: newMessageBusId("receipt"),
    tenant_id: input.tenant_id,
    source_agent_id: input.source_agent_id,
    related_message_id: input.related_message_id,
    status: input.status ?? "submitted",
    verdict: input.verdict,
    summary: input.summary,
    proof_refs: input.proof_refs ?? [],
    created_at: timestamp,
    updated_at: timestamp,
    nonce: input.nonce,
    historical: true
  };

  store.nonceIndex.add(replayKey);
  store.receipts.push(receipt);
  return receipt;
}

export function listOutboxReceipts(filters: OutboxListFilters = {}): OutboxListPayload {
  const store = getOutboxStore();
  const receipts = store.receipts.filter((receipt) => {
    if (filters.tenant_id && receipt.tenant_id !== filters.tenant_id) {
      return false;
    }

    if (filters.source_agent_id && receipt.source_agent_id !== filters.source_agent_id) {
      return false;
    }

    return true;
  });

  return {
    ...buildMessageBusDisclosure(),
    ...buildHistoricalDisclosure(),
    supported_statuses: [...OUTBOX_RECEIPT_STATUSES],
    supported_verdicts: [...OUTBOX_RECEIPT_VERDICTS],
    receipts: sortNewestFirst(receipts)
  };
}

export function resetOutboxStore() {
  globalStore.__agentBrainOutboxStore = {
    receipts: [],
    nonceIndex: new Set<string>()
  };
}
