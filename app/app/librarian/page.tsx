import { retrieveBundle } from "@/lib/librarian/service";
import type { TaskPack } from "@/lib/librarian/types";

export const dynamic = "force-dynamic";

function StringList({ items }: { items: string[] }) {
  return items.length > 0 ? (
    <ul className="detail-list">
      {items.map((item) => (
        <li key={item}>{item}</li>
      ))}
    </ul>
  ) : (
    <p>No entries in this retrieval.</p>
  );
}

function TaskPackCard({ title, pack }: { title: string; pack: TaskPack | undefined }) {
  if (!pack) {
    return null;
  }

  return (
    <article className="card">
      <p className="section-kicker">{title}</p>
      <h2>{title}</h2>
      <div className="stack-list">
        <div className="stack-row">
          <span>Objective</span>
          <p>{pack.objective}</p>
        </div>
        <div className="stack-row">
          <span>Context</span>
          <p>{pack.context_summary}</p>
        </div>
        <div className="stack-row">
          <span>Included Sources</span>
          <ul className="detail-list">
            {pack.included_sources.map((source) => (
              <li key={`${title}-${source.path}`}>
                {source.path} - {source.reason}
              </li>
            ))}
          </ul>
        </div>
        <div className="stack-row">
          <span>Excluded Sources</span>
          <ul className="detail-list">
            {pack.excluded_sources.map((source) => (
              <li key={`${title}-excluded-${source.path}`}>
                {source.path} - {source.reason}
              </li>
            ))}
          </ul>
        </div>
        <div className="stack-row">
          <span>Allowed Operations</span>
          <StringList items={pack.allowed_operations} />
        </div>
        <div className="stack-row">
          <span>Forbidden Operations</span>
          <StringList items={pack.forbidden_operations} />
        </div>
        <div className="stack-row">
          <span>Required Receipts</span>
          <StringList items={pack.required_receipts} />
        </div>
        <div className="stack-row">
          <span>Escalation Rules</span>
          <StringList items={pack.escalation_rules} />
        </div>
      </div>
    </article>
  );
}

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
          <span>Repo: {bundle.repo}</span>
          <span>Branch: {bundle.branch}</span>
          <span>Source commit: {bundle.sourceCommit ?? "unavailable"}</span>
          <span>Retrieval log: {bundle.retrievalLogId}</span>
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
          <p className="section-kicker">Context Pack</p>
          <h2>Context Pack</h2>
          <div className="stack-list">
            <div className="stack-row">
              <span>Source Repo</span>
              <p>{bundle.repo}</p>
            </div>
            <div className="stack-row">
              <span>Source Branch</span>
              <p>{bundle.branch}</p>
            </div>
            <div className="stack-row">
              <span>Source Commit</span>
              <p>{bundle.contextPack.source_commit ?? "Unavailable in this retrieval."}</p>
            </div>
            <div className="stack-row">
              <span>Retrieval Log ID</span>
              <p>{bundle.contextPack.retrieval_log_id}</p>
            </div>
            <div className="stack-row">
              <span>Coverage</span>
              <p>
                {bundle.contextPack.included_sources.length} included sources /{" "}
                {bundle.contextPack.excluded_sources.length} excluded sources
              </p>
            </div>
          </div>
          <div className="warning-box">
            <p>Stale Warnings</p>
            <StringList items={bundle.contextPack.stale_warnings} />
          </div>
          <div className="warning-box">
            <p>Missing Warnings</p>
            <StringList items={bundle.contextPack.missing_context_warnings} />
          </div>
        </article>

        <article className="card">
          <p className="section-kicker">Authority Pack</p>
          <h2>Authority Pack</h2>
          <div className="stack-list">
            <div className="stack-row">
              <span>Agent</span>
              <p>{bundle.authorityPack.agent}</p>
            </div>
            <div className="stack-row">
              <span>Workspace</span>
              <p>{bundle.authorityPack.workspace}</p>
            </div>
            <div className="stack-row">
              <span>Allowed Operations</span>
              <StringList items={bundle.authorityPack.allowed_operations} />
            </div>
            <div className="stack-row">
              <span>Forbidden Operations</span>
              <StringList items={bundle.authorityPack.forbidden_operations} />
            </div>
            <div className="stack-row">
              <span>Escalation Required For</span>
              <StringList items={bundle.authorityPack.escalation_required_for} />
            </div>
            <div className="stack-row">
              <span>Protected Surfaces</span>
              <StringList items={bundle.authorityPack.protected_surfaces} />
            </div>
          </div>
        </article>
      </section>

      <section className="dashboard-grid">
        <article className="card">
          <p className="section-kicker">Included Sources</p>
          <h2>Included Sources</h2>
          <div className="stack-list">
            {bundle.contextPack.included_sources.map((file) => (
              <div key={file.path} className="stack-row">
                <span>{file.path}</span>
                <p>{file.reason}</p>
                <small>
                  Availability: {file.availability} | Bytes: {file.bytes ?? "unknown"} | Excerpt: {file.excerpt}
                </small>
              </div>
            ))}
          </div>
        </article>

        <article className="card">
          <p className="section-kicker">Excluded Sources</p>
          <h2>Excluded Sources</h2>
          <div className="stack-list">
            {bundle.contextPack.excluded_sources.map((file) => (
              <div key={file.path} className="stack-row">
                <span>{file.path}</span>
                <p>{file.reason}</p>
              </div>
            ))}
          </div>
        </article>
      </section>

      <section className="card">
        <p className="section-kicker">Proof Contract</p>
        <h2>Proof Contract</h2>
        <div className="stack-list">
          <div className="stack-row">
            <span>Required Commands</span>
            <StringList items={bundle.proofContract.required_commands} />
          </div>
          <div className="stack-row">
            <span>Required Receipts</span>
            <StringList items={bundle.proofContract.required_receipts} />
          </div>
          <div className="stack-row">
            <span>Pass Conditions</span>
            <StringList items={bundle.proofContract.pass_conditions} />
          </div>
          <div className="stack-row">
            <span>Fail Conditions</span>
            <StringList items={bundle.proofContract.fail_conditions} />
          </div>
          <div className="stack-row">
            <span>No Fake PASS Rules</span>
            <StringList items={bundle.proofContract.no_fake_pass_rules} />
          </div>
        </div>
      </section>

      <section className="dashboard-grid">
        <TaskPackCard title="Codex Task Pack" pack={bundle.taskPacks.codex} />
        <TaskPackCard title="AG Task Pack" pack={bundle.taskPacks.ag} />
      </section>

      <section className="dashboard-grid">
        <TaskPackCard title="Geminex Task Pack" pack={bundle.taskPacks.geminex} />
        <TaskPackCard title="Chantelle Task Pack" pack={bundle.taskPacks.chantelle} />
      </section>

      <section className="dashboard-grid">
        <TaskPackCard title="Future Agent Task Pack" pack={bundle.taskPacks.future_agent} />
      </section>
    </main>
  );
}
