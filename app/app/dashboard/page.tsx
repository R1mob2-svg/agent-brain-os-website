import Link from "next/link";

import {
  buildDashboardBoundaryRules,
  buildDashboardKnownGaps,
  buildDashboardSurfaceCards
} from "@/lib/dashboard/service";

export const dynamic = "force-dynamic";

export default function MessageBusDashboardPage() {
  const surfaces = buildDashboardSurfaceCards();
  const knownGaps = buildDashboardKnownGaps();
  const boundaryRules = buildDashboardBoundaryRules();

  return (
    <main className="dashboard">
      <section className="card">
        <p className="section-kicker">MVP boundary</p>
        <h2>Message bus and audit dashboard</h2>
        <p>
          Product boundary: MVP, not full SaaS. Inbox, outbox, and audit are served from a single-process
          memory store with no production persistence, no GitHub write path, and no cross-tenant routing
          claim.
        </p>
        <div className="metrics-row">
          <span>Storage: MVP memory store</span>
          <span>GitHub writes: false</span>
          <span>Current-state inference: disabled</span>
        </div>
      </section>

      <section className="bundle-grid">
        {surfaces.map((surface) => (
          <Link key={surface.href} href={surface.href} className="bundle-card">
            <h3>{surface.title}</h3>
            <p>{surface.summary}</p>
            <span>
              {surface.metric_label}: {surface.metric_value}
            </span>
          </Link>
        ))}
      </section>

      <section className="dashboard-grid">
        <article className="card">
          <p className="section-kicker">Known unproven capabilities</p>
          <div className="stack-list">
            {knownGaps.map((gap) => (
              <div key={gap} className="stack-row">
                <span>Unproven</span>
                <p>{gap}</p>
              </div>
            ))}
          </div>
        </article>

        <article className="card">
          <p className="section-kicker">Boundary rules</p>
          <div className="stack-list">
            {boundaryRules.map((rule) => (
              <div key={rule} className="stack-row">
                <span>Truth rule</span>
                <p>{rule}</p>
              </div>
            ))}
          </div>
        </article>
      </section>
    </main>
  );
}
