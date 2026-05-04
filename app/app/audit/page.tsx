import { listAuditEvents } from "@/lib/audit/service";

export const dynamic = "force-dynamic";

export default function AuditPage() {
  const audit = listAuditEvents();

  return (
    <main className="dashboard">
      <section className="card">
        <p className="section-kicker">Historical audit</p>
        <h2>Audit events</h2>
        <p>
          Audit events are historical only. Current state requires revalidation from the live surface because
          the audit log records prior actions and testing hooks, not authoritative runtime truth.
        </p>
        <div className="metrics-row">
          <span>Storage: {audit.storage_mode}</span>
          <span>Historical: {String(audit.historical)}</span>
          <span>Current-state claim: {String(audit.current_state_claim)}</span>
        </div>
      </section>

      <section className="card">
        <p className="section-kicker">Current audit events</p>
        {audit.events.length === 0 ? (
          <p className="empty-state">No audit events have been recorded in this process yet.</p>
        ) : (
          <div className="stack-list">
            {audit.events.map((event) => (
              <div key={event.audit_id} className="stack-row">
                <span>
                  {event.action} · {event.target_type}
                </span>
                <p>
                  Tenant: {event.tenant_id} | Actor: {event.actor_id} | Target: {event.target_id}
                </p>
                <small>{event.summary}</small>
                <pre className="code-block">{JSON.stringify(event.metadata, null, 2)}</pre>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
