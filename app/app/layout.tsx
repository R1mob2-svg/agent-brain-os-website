import Link from "next/link";

export const dynamic = "force-dynamic";

const nav = [
  { href: "/app", label: "Overview" },
  { href: "/app/dashboard", label: "Dashboard" },
  { href: "/app/librarian", label: "Librarian" },
  { href: "/app/inbox", label: "Inbox" },
  { href: "/app/outbox", label: "Outbox" },
  { href: "/app/audit", label: "Audit" },
  { href: "/app/agents", label: "Agents" },
  { href: "/app/workspaces", label: "Workspaces" },
  { href: "/app/candidates", label: "Candidates" }
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="app-shell">
      <aside className="app-sidebar card">
        <div>
          <p className="eyebrow">Agent Brain OS</p>
          <h1 className="app-title">Agent Brain OS MVP</h1>
          <p className="sidebar-copy">
            A bounded control room for Librarian retrieval, staged candidates, and MVP message-bus plus audit
            surfaces with explicit caveats.
          </p>
        </div>

        <nav className="sidebar-nav">
          {nav.map((item) => (
            <Link key={item.href} href={item.href}>
              {item.label}
            </Link>
          ))}
        </nav>
      </aside>
      <div className="app-main">{children}</div>
    </div>
  );
}
