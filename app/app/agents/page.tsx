import { buildAgentCards } from "@/lib/librarian/service";

export const dynamic = "force-dynamic";

export default function AgentsPage() {
  const agents = buildAgentCards();

  return (
    <main className="dashboard">
      <section className="card">
        <p className="section-kicker">Agent lanes</p>
        <h2>Who the Librarian serves</h2>
        <div className="bundle-grid">
          {agents.map((agent) => (
            <article key={agent.title} className="bundle-card">
              <h3>{agent.title}</h3>
              <p>{agent.note}</p>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
