import { INBOX_MESSAGE_STATUSES } from "@/lib/message-bus/model";
import { listInboxMessages } from "@/lib/message-bus/inbox";

export const dynamic = "force-dynamic";

export default function InboxPage() {
  const inbox = listInboxMessages();

  return (
    <main className="dashboard">
      <section className="card">
        <p className="section-kicker">Inbox queue MVP</p>
        <h2>Inbox task intake</h2>
        <p>
          Replay protection uses per-tenant nonces in the active memory store. No fake live worker claim:
          dispatch is not implemented, and creating a message does not prove a worker picked it up.
        </p>
        <div className="metrics-row">
          <span>Storage: {inbox.storage_mode}</span>
          <span>GitHub writes: {String(inbox.github_write)}</span>
          <span>Cross-tenant routing: {String(inbox.cross_tenant_routing)}</span>
        </div>
      </section>

      <section className="dashboard-grid">
        <article className="card">
          <p className="section-kicker">Inbox lifecycle states</p>
          <div className="stack-list">
            {INBOX_MESSAGE_STATUSES.map((status) => (
              <div key={status} className="stack-row">
                <span>{status}</span>
                <p>Supported lifecycle label for manual queue tracking in the MVP surface.</p>
              </div>
            ))}
          </div>
        </article>

        <article className="card">
          <p className="section-kicker">Current messages</p>
          {inbox.messages.length === 0 ? (
            <p className="empty-state">No inbox messages have been created in this process yet.</p>
          ) : (
            <div className="stack-list">
              {inbox.messages.map((message) => (
                <div key={message.message_id} className="stack-row">
                  <span>
                    {message.title} · {message.status}
                  </span>
                  <p>
                    Tenant: {message.tenant_id} | Target: {message.target_agent_id} | Task: {message.task_type}
                  </p>
                  <small>
                    Nonce: {message.nonce} | Source: {message.source_agent_id ?? "manual"} | Created:{" "}
                    {message.created_at}
                  </small>
                </div>
              ))}
            </div>
          )}
        </article>
      </section>
    </main>
  );
}
