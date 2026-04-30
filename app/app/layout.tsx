import Link from "next/link";

export const dynamic = "force-dynamic";

const nav = [
  { href: "/app", label: "Overview" },
  { href: "/app/librarian", label: "Librarian" },
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
          <h1 className="app-title">Librarian MVP</h1>
          <p className="sidebar-copy">
            A read-only retrieval control room with staged candidate updates and explicit file selection.
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
