import { buildGeminexIntegrationPlan } from "@/lib/integrations/geminex-plan";
import { buildMvpReleaseReceipt } from "@/lib/release/mvp-receipt";

export const dynamic = "force-dynamic";

const DEPLOYMENT_LABELS = {
  not_claimed: "unknown / not claimed unless proven",
  local_only: "local only",
  deployed_unverified: "deployed but unverified",
  deployed_verified: "deployed and verified"
} as const;

export default function StatusPage() {
  const receipt = buildMvpReleaseReceipt();
  const geminexPlan = buildGeminexIntegrationPlan();

  const facts = [
    { label: "Product", value: receipt.product },
    { label: "Status", value: "MVP / not full commercial SaaS" },
    { label: "Source memory repo", value: receipt.source_memory_repo },
    { label: "Current retrieval mode", value: "bounded read-only candidate" },
    { label: "Candidate writes", value: "staged only" },
    { label: "Tenant provisioning", value: "not implemented unless proven" },
    { label: "One GitHub repo per tenant", value: "not implemented unless proven" },
    { label: "API keys per tenant", value: "not implemented unless proven" },
    { label: "Postgres audit/query layer", value: "not implemented unless proven" },
    { label: "Billing", value: "not implemented" },
    {
      label: "Production deployment",
      value: DEPLOYMENT_LABELS[receipt.deployment_state]
    },
    { label: "Full SaaS readiness", value: "not claimed" }
  ];

  return (
    <main className="dashboard">
      <section className="card">
        <p className="section-kicker">Status truth</p>
        <h2>{receipt.product}</h2>
        <p>This surface prevents fake PASS. It reports proven and unproven capabilities separately.</p>
        <ul className="detail-list">
          {facts.map((fact) => (
            <li key={fact.label}>
              {fact.label}: {fact.value}
            </li>
          ))}
        </ul>
      </section>

      <section className="dashboard-grid">
        <article className="card">
          <p className="section-kicker">Proven now</p>
          <h2>Capabilities present in this branch</h2>
          <div className="stack-list">
            {receipt.proven_capabilities.map((capability) => (
              <div key={capability} className="stack-row">
                <span>{capability}</span>
                <p>Proven from files that exist in the active tree.</p>
              </div>
            ))}
          </div>
        </article>

        <article className="card">
          <p className="section-kicker">Unproven now</p>
          <h2>Capabilities that must not be overclaimed</h2>
          <div className="stack-list">
            {receipt.unproven_capabilities.map((capability) => (
              <div key={capability} className="stack-row">
                <span>{capability}</span>
                <p>Not claimed by this MVP branch unless a later proof says otherwise.</p>
              </div>
            ))}
          </div>
        </article>
      </section>

      <section className="dashboard-grid">
        <article className="card">
          <p className="section-kicker">Safety boundaries</p>
          <h2>What the MVP is bounded to do</h2>
          <div className="stack-list">
            {receipt.safety_boundaries.map((boundary) => (
              <div key={boundary} className="stack-row">
                <span>{boundary}</span>
                <p>Kept explicit so the UI does not inflate staged or missing capabilities into PASS.</p>
              </div>
            ))}
          </div>
        </article>

        <article className="card">
          <p className="section-kicker">Geminex customer path</p>
          <h2>Planned, not integrated</h2>
          <p>{geminexPlan.current_state}</p>
          <div className="stack-list">
            {geminexPlan.phases.map((phase) => (
              <div key={phase.order} className="stack-row">
                <span>
                  {phase.order}. {phase.title}
                </span>
                <p>{phase.summary}</p>
              </div>
            ))}
          </div>
        </article>
      </section>
    </main>
  );
}
