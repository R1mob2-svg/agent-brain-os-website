import { retrieveBundle } from "@/lib/librarian/service";

export const dynamic = "force-dynamic";

export default async function LibrarianPage() {
  const bundle = await retrieveBundle({
    agent: "Geminex",
    workspace: "Agent Brain OS",
    task: "Build Librarian MVP"
  });

  return (
    <main className="dashboard">
      <section className="card">
        <p className="section-kicker">Live bounded retrieval</p>
        <h2>{bundle.bundleTitle}</h2>
        <p>{bundle.bundleSummary}</p>
        <div className="metrics-row">
          <span>Retrieval log: {bundle.retrievalLogId}</span>
          <span>Source commit: {bundle.sourceCommit ?? "unavailable"}</span>
          <span>Mode: {bundle.mode}</span>
        </div>
        {bundle.warnings.length > 0 ? (
          <div className="warning-box">
            {bundle.warnings.map((warning) => (
              <p key={warning}>{warning}</p>
            ))}
          </div>
        ) : null}
      </section>

      <section className="dashboard-grid">
        <article className="card">
          <p className="section-kicker">Selected files</p>
          <div className="stack-list">
            {bundle.selectedFiles.map((file) => (
              <div key={file.path} className="stack-row">
                <span>{file.path}</span>
                <p>{file.reason}</p>
                <small>{file.available ? file.excerpt : "Unavailable in this environment."}</small>
              </div>
            ))}
          </div>
        </article>

        <article className="card">
          <p className="section-kicker">Excluded files</p>
          <div className="stack-list">
            {bundle.excludedFiles.map((file) => (
              <div key={file.path} className="stack-row">
                <span>{file.path}</span>
                <p>{file.reason}</p>
              </div>
            ))}
          </div>
        </article>
      </section>
    </main>
  );
}
