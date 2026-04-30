import { buildWorkspaceCards } from "@/lib/librarian/service";

export const dynamic = "force-dynamic";

export default function WorkspacesPage() {
  const workspaces = buildWorkspaceCards();

  return (
    <main className="dashboard">
      <section className="card">
        <p className="section-kicker">Workspace scopes</p>
        <h2>Bounded by owner lane and task lane</h2>
        <div className="bundle-grid">
          {workspaces.map((workspace) => (
            <article key={workspace.title} className="bundle-card">
              <h3>{workspace.title}</h3>
              <p>{workspace.note}</p>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
