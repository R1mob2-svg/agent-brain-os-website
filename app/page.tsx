import Link from "next/link";

import { buildBundleCards } from "@/lib/librarian/service";

const bundleCards = buildBundleCards();

export default function HomePage() {
  return (
    <main className="page">
      <section className="hero">
        <div className="hero__copy">
          <p className="eyebrow">Agent Brain OS</p>
          <h1>Give every AI agent a governed memory librarian.</h1>
          <p className="lede">
            The vault is GitHub. The Librarian is the control plane. The app turns the right doctrine,
            handoff, and proof bundle into a usable working context without exposing raw chaos or secrets.
          </p>
          <div className="hero__actions">
            <Link className="button button--primary" href="/app/librarian">
              Open the Librarian MVP
            </Link>
            <Link className="button button--ghost" href="/app">
              View the operator dashboard
            </Link>
          </div>
          <ul className="pill-row">
            <li>Bounded GitHub retrieval</li>
            <li>Staged candidate updates</li>
            <li>Proof before promotion</li>
          </ul>
        </div>
        <div className="hero__panel card">
          <img
            src="/assets/agent-brain-os-hero.svg"
            alt="Agent Brain OS hero illustration"
            className="hero__image"
          />
        </div>
      </section>

      <section className="section-grid">
        <article className="card">
          <p className="section-kicker">What changes</p>
          <h2>Before and after the Librarian</h2>
          <div className="compare-grid">
            <div>
              <h3>Normal agent</h3>
              <ul>
                <li>Reloads context badly</li>
                <li>Mixes stale handoffs</li>
                <li>Cannot explain why a file was chosen</li>
              </ul>
            </div>
            <div>
              <h3>Agent Brain OS agent</h3>
              <ul>
                <li>Loads a bounded bundle</li>
                <li>Shows exclusions and reasons</li>
                <li>Stages candidate memory instead of blindly writing</li>
              </ul>
            </div>
          </div>
        </article>

        <article className="card">
          <p className="section-kicker">Control room</p>
          <h2>What the MVP includes</h2>
          <div className="feature-list">
            {bundleCards.map((bundle) => (
              <div key={bundle.id} className="feature-row">
                <span>{bundle.title}</span>
                <p>{bundle.summary}</p>
              </div>
            ))}
          </div>
        </article>
      </section>

      <section className="section-grid">
        <article className="card">
          <p className="section-kicker">Librarian API</p>
          <h2>Bounded retrieval, not browser-side token leakage.</h2>
          <p>
            Retrieval happens server-side. The browser never talks to private GitHub APIs directly, and
            candidate updates stay staged until a governed promotion path exists.
          </p>
        </article>
        <article className="card">
          <p className="section-kicker">Truth boundary</p>
          <h2>No fake scale claims.</h2>
          <p>
            This MVP proves a premium landing page, a real app shell, bounded retrieval from the live
            GitHub Agent Brain, and candidate memory safety. It does not pretend to be a finished
            multi-tenant platform.
          </p>
        </article>
      </section>
    </main>
  );
}
