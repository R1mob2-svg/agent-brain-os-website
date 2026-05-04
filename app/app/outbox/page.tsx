import { OUTBOX_RECEIPT_STATUSES, OUTBOX_RECEIPT_VERDICTS } from "@/lib/message-bus/model";
import { listOutboxReceipts } from "@/lib/message-bus/outbox";

export const dynamic = "force-dynamic";

export default function OutboxPage() {
  const outbox = listOutboxReceipts();

  return (
    <main className="dashboard">
      <section className="card">
        <p className="section-kicker">Historical receipts</p>
        <h2>Outbox receipts</h2>
        <p>
          Historical-only receipt warning: current state requires revalidation. Receipts record what was
          submitted or accepted historically inside this MVP store, and they must not be surfaced as live
          worker truth.
        </p>
        <div className="metrics-row">
          <span>Storage: {outbox.storage_mode}</span>
          <span>Historical: {String(outbox.historical)}</span>
          <span>Current-state claim: {String(outbox.current_state_claim)}</span>
        </div>
      </section>

      <section className="dashboard-grid">
        <article className="card">
          <p className="section-kicker">Receipt states</p>
          <div className="stack-list">
            {OUTBOX_RECEIPT_STATUSES.map((status) => (
              <div key={status} className="stack-row">
                <span>{status}</span>
                <p>Supported historical receipt status for the MVP polling surface.</p>
              </div>
            ))}
          </div>
        </article>

        <article className="card">
          <p className="section-kicker">Supported verdicts</p>
          <div className="stack-list">
            {OUTBOX_RECEIPT_VERDICTS.map((verdict) => (
              <div key={verdict} className="stack-row">
                <span>{verdict}</span>
                <p>Allowed verdict label for bounded proof reporting.</p>
              </div>
            ))}
          </div>
        </article>
      </section>

      <section className="card">
        <p className="section-kicker">Current receipts</p>
        {outbox.receipts.length === 0 ? (
          <p className="empty-state">No outbox receipts have been submitted in this process yet.</p>
        ) : (
          <div className="stack-list">
            {outbox.receipts.map((receipt) => (
              <div key={receipt.receipt_id} className="stack-row">
                <span>
                  {receipt.verdict} · {receipt.status}
                </span>
                <p>
                  Tenant: {receipt.tenant_id} | Source: {receipt.source_agent_id} | Summary: {receipt.summary}
                </p>
                <small>
                  Proof refs: {receipt.proof_refs.length > 0 ? receipt.proof_refs.join(", ") : "none"} | Related
                  message: {receipt.related_message_id ?? "none"} | Created: {receipt.created_at}
                </small>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
