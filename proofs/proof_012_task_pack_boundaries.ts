import assert from "node:assert/strict";

import { retrieveBundle } from "../lib/librarian/service";

function jsonResponse(body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { "Content-Type": "application/json" }
  });
}

const responseMap = new Map<string, unknown>([
  [
    "https://api.github.com/repos/R1mob2-svg/global-agent-brain/branches/main",
    { commit: { sha: "commit-012" } }
  ],
  [
    "https://api.github.com/repos/R1mob2-svg/global-agent-brain/contents/Doctrine/AGENT_BRAIN_OS_BOOT_PROTOCOL.md?ref=main",
    { content: Buffer.from("# Agent Brain OS Boot Protocol\n", "utf8").toString("base64") }
  ],
  [
    "https://api.github.com/repos/R1mob2-svg/global-agent-brain/contents/Doctrine/GLOBAL_AGENT_DOCTRINE.md?ref=main",
    { content: Buffer.from("# Global Doctrine\n", "utf8").toString("base64") }
  ],
  [
    "https://api.github.com/repos/R1mob2-svg/global-agent-brain/contents/Doctrine/RELEASESEAL_AND_PACKAGING_DOCTRINE.md?ref=main",
    { content: Buffer.from("# ReleaseSeal\n", "utf8").toString("base64") }
  ],
  [
    "https://api.github.com/repos/R1mob2-svg/global-agent-brain/contents/Agents/Geminex/Inbox/FromNewton/2026-04-30_AGENT_BRAIN_OS_LIBRARIAN_MVP_POINTER.md?ref=main",
    { content: Buffer.from("# Pointer\n", "utf8").toString("base64") }
  ]
]);

async function main() {
  const bundle = await retrieveBundle(
    {
      agent: "Geminex",
      workspace: "Agent Brain OS",
      task: "Build Librarian MVP"
    },
    async (input) => {
      const url = typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url;
      const body = responseMap.get(url);
      if (!body) {
        return new Response(JSON.stringify({ message: `Unhandled URL ${url}` }), { status: 404 });
      }
      return jsonResponse(body);
    }
  );

  assert.ok(bundle.taskPacks.codex);
  assert.ok(bundle.taskPacks.ag);
  assert.ok(bundle.taskPacks.chantelle);
  assert.ok(bundle.taskPacks.future_agent);

  assert.ok(bundle.taskPacks.codex?.forbidden_operations.includes("deploy"));
  assert.ok(bundle.taskPacks.codex?.forbidden_operations.includes("merge"));
  assert.ok(bundle.taskPacks.codex?.forbidden_operations.includes("secrets"));
  assert.ok(bundle.taskPacks.ag?.forbidden_operations.includes("source-of-truth promotion"));
  assert.ok(bundle.taskPacks.chantelle?.forbidden_operations.includes("code mutation"));
  assert.ok(bundle.taskPacks.chantelle?.forbidden_operations.includes("secrets"));
  assert.ok(bundle.taskPacks.chantelle?.forbidden_operations.includes("private founder memory"));
  assert.ok(bundle.taskPacks.future_agent?.forbidden_operations.includes("deploy"));
  assert.ok(bundle.taskPacks.future_agent?.forbidden_operations.includes("merge"));
  assert.ok(bundle.taskPacks.future_agent?.forbidden_operations.includes("secrets"));
  assert.ok(bundle.taskPacks.future_agent?.allowed_operations.includes("inspect"));
  assert.ok(bundle.taskPacks.future_agent?.escalation_rules.includes("any writes"));

  console.log("PROOF_012_TASK_PACK_BOUNDARIES PASSED");
}

void main();
