import assert from "node:assert/strict";
import { renderToStaticMarkup } from "react-dom/server";

import AuditPage from "../app/app/audit/page";
import MessageBusDashboardPage from "../app/app/dashboard/page";
import InboxPage from "../app/app/inbox/page";
import OutboxPage from "../app/app/outbox/page";

assert.equal(typeof MessageBusDashboardPage, "function");
assert.equal(typeof InboxPage, "function");
assert.equal(typeof OutboxPage, "function");
assert.equal(typeof AuditPage, "function");

const dashboardHtml = renderToStaticMarkup(MessageBusDashboardPage());
assert.match(dashboardHtml, /Product boundary: MVP, not full SaaS\./);
assert.match(dashboardHtml, /Known unproven capabilities/);

const inboxHtml = renderToStaticMarkup(InboxPage());
assert.match(inboxHtml, /Replay protection uses per-tenant nonces/);
assert.match(inboxHtml, /No fake live worker claim/);

const outboxHtml = renderToStaticMarkup(OutboxPage());
assert.match(outboxHtml, /Historical-only receipt warning: current state requires revalidation\./);

const auditHtml = renderToStaticMarkup(AuditPage());
assert.match(auditHtml, /Audit events are historical only\./);
assert.match(auditHtml, /Current state requires revalidation/);

console.log("PROOF_022_DASHBOARD_SURFACES PASSED");
