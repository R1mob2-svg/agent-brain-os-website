import { listAuditEvents } from "@/lib/audit/service";
import { listInboxMessages } from "@/lib/message-bus/inbox";
import { listOutboxReceipts } from "@/lib/message-bus/outbox";

export interface DashboardSurfaceCard {
  href: string;
  title: string;
  summary: string;
  metric_label: string;
  metric_value: string;
}

export function buildDashboardSurfaceCards(): DashboardSurfaceCard[] {
  const inbox = listInboxMessages();
  const outbox = listOutboxReceipts();
  const audit = listAuditEvents();

  return [
    {
      href: "/app/librarian",
      title: "Librarian",
      summary: "Bounded GitHub retrieval and staged candidate memory remain separate from the new bus surfaces.",
      metric_label: "Mode",
      metric_value: "read-only retrieval"
    },
    {
      href: "/app/inbox",
      title: "Inbox",
      summary: "Safe task intake with nonce replay protection and no live worker dispatch claim.",
      metric_label: "Messages",
      metric_value: String(inbox.messages.length)
    },
    {
      href: "/app/outbox",
      title: "Outbox",
      summary: "Historical receipts for verdict tracking. Current runtime state still requires revalidation.",
      metric_label: "Receipts",
      metric_value: String(outbox.receipts.length)
    },
    {
      href: "/app/audit",
      title: "Audit",
      summary: "Historical event log for actions and testing hooks, with no current-state inference path.",
      metric_label: "Events",
      metric_value: String(audit.events.length)
    }
  ];
}

export function buildDashboardKnownGaps(): string[] {
  return [
    "No production persistence has been added. Inbox, outbox, and audit data are stored in-process only.",
    "No GitHub write lane exists for message bus or audit surfaces in this MVP.",
    "No cross-tenant worker routing, dispatch worker, or durable queue consumer is implemented.",
    "Outbox receipts and audit events are historical records and must not be treated as live state."
  ];
}

export function buildDashboardBoundaryRules(): string[] {
  return [
    "This app is an MVP control room, not a full SaaS runtime.",
    "Current state still belongs to direct revalidation, not inferred receipt or audit history.",
    "Replay protection is nonce-based within the active single-process memory store.",
    "Receipts prove what was submitted historically, not what is running now."
  ];
}
