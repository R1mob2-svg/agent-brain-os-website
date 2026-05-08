import { stageCandidateMemoryUpdate } from "@/lib/librarian/service";

export const dynamic = "force-dynamic";

export default function CandidatesPage() {
  const safeCandidate = stageCandidateMemoryUpdate({
    agent: "Geminex",
    workspace: "Agent Brain OS",
    proposedPath: "Agents/Geminex/Candidates/agent-brain-os-librarian-mvp.md",
    title: "Librarian MVP memory candidate",
    content: "Preserve the bounded retrieval lane and stage candidate updates before promotion.",
    rationale: "Customer-safe MVP memory staging demo."
  });

  return (
    <main className="dashboard">
      <section className="card">
        <p className="section-kicker">Candidate memory staging</p>
        <h2>Staged, not promoted</h2>
        <p>
          This screen demonstrates the staged memory lane. The Librarian can validate a candidate,
          preview it, and stop before any GitHub promotion is attempted.
        </p>
        <div className="stack-list">
          <div className="stack-row">
            <span>Status</span>
            <p>{safeCandidate.status}</p>
          </div>
          <div className="stack-row">
            <span>Target path</span>
            <p>{safeCandidate.targetPath ?? "none"}</p>
          </div>
          <div className="stack-row">
            <span>Preview</span>
            <pre className="code-block">{safeCandidate.preview ?? "No preview available."}</pre>
          </div>
        </div>
      </section>
    </main>
  );
}
