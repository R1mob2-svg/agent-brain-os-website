import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { renderToStaticMarkup } from "react-dom/server";

import StatusPage from "../app/app/status/page";

const statusPagePath = resolve(process.cwd(), "app/app/status/page.tsx");
const betaPlanPath = resolve(process.cwd(), "docs/BETA_LAUNCH_PLAN.md");
const geminexPlanPath = resolve(process.cwd(), "docs/GEMINEX_AS_FIRST_CUSTOMER_PLAN.md");
const roadmapPath = resolve(process.cwd(), "docs/COMMERCIAL_V1_ROADMAP_AFTER_MVP.md");

assert.equal(existsSync(statusPagePath), true);
assert.equal(existsSync(betaPlanPath), true);
assert.equal(existsSync(geminexPlanPath), true);
assert.equal(existsSync(roadmapPath), true);

const statusHtml = renderToStaticMarkup(StatusPage());
assert.match(statusHtml, /MVP \/ not full commercial SaaS/);
assert.match(
  statusHtml,
  /This surface prevents fake PASS\. It reports proven and unproven capabilities separately\./
);
assert.match(statusHtml, /ReleaseSeal containment-pack parity/);

const betaPlan = readFileSync(betaPlanPath, "utf8");
const geminexPlan = readFileSync(geminexPlanPath, "utf8");
const roadmap = readFileSync(roadmapPath, "utf8");
const combinedDocs = [betaPlan, geminexPlan, roadmap].join("\n");

assert.match(betaPlan, /5 friendly agency beta target/i);
assert.match(betaPlan, /8-week beta offer/i);
assert.match(betaPlan, /No public launch before 3 stable paying agencies\./i);
assert.match(geminexPlan, /Current state: not integrated yet\./i);
assert.doesNotMatch(combinedDocs, /public beta is already live/i);
assert.doesNotMatch(combinedDocs, /beta is already live/i);

console.log("PROOF_024_STATUS_AND_BETA_TRUTH PASSED");
