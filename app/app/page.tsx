import { buildAgentCards, buildBundleCards, buildHealthPayload, buildWorkspaceCards } from "@/lib/librarian/service";

export const dynamic = "force-dynamic";

export default function DashboardPage() {
  const health = buildHealthPayload();
  const agents = buildAgentCards();
  const workspaces = buildWorkspaceCards();
  const bundles = buildBundleCards();

  return (
    <main className="dashboard">
      <section className="dashboard-grid">
        <article className="card">
          <p className="section-kicker">Runtime health</p>
          <h2>{health.status.toUpperCase()}</h2>
          <ul className="detail-list">
            <li>Mode: {health.mode}</li>
            <li>Repo: {health.repo}</li>
            <li>Candidate writes: {health.candidateWrites}</li>
            <li>Allowed roots: {health.allowedRoots.length}</li>
          </ul>
        </article>
        <article className="card">
          <p className="section-kicker">What this app proves</p>
          <h2>Marketing site + working control room</h2>
          <p>
            The dashboard, librarian, candidate, agent, and workspace screens are all live routes. The
            API is bounded to read-only retrieval and staged candidate responses.
          </p>
        </article>
      </section>

      <section className="dashboard-grid">
        <article className="card">
          <p className="section-kicker">Agents</p>
          <div className="stack-list">
            {agents.map((agent) => (
              <div key={agent.title} className="stack-row">
                <span>{agent.title}</span>
                <p>{agent.note}</p>
              </div>
            ))}
          </div>
        </article>
        <article className="card">
          <p className="section-kicker">Workspaces</p>
          <div className="stack-list">
            {workspaces.map((workspace) => (
              <div key={workspace.title} className="stack-row">
                <span>{workspace.title}</span>
                <p>{workspace.note}</p>
              </div>
            ))}
          </div>
        </article>
      </section>

      <section className="card">
        <p className="section-kicker">Available bounded bundles</p>
        <div className="bundle-grid">
          {bundles.map((bundle) => (
            <article key={bundle.id} className="bundle-card">
              <h3>{bundle.title}</h3>
              <p>{bundle.summary}</p>
              <span>{bundle.count} selected files</span>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
