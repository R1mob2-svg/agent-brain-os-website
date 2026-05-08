import assert from "node:assert/strict";

import { retrieveBundle } from "../lib/librarian/service";

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" }
  });
}

const responseMap = new Map<string, { status?: number; body: unknown }>([
  [
    "https://api.github.com/repos/R1mob2-svg/global-agent-brain/branches/main",
    { status: 404, body: { message: "branch not available in proof fixture" } }
  ],
  [
    "https://api.github.com/repos/R1mob2-svg/global-agent-brain/contents/Doctrine/AGENT_BRAIN_OS_BOOT_PROTOCOL.md?ref=main",
    { body: { content: Buffer.from("# Agent Brain OS Boot Protocol\n", "utf8").toString("base64") } }
  ],
  [
    "https://api.github.com/repos/R1mob2-svg/global-agent-brain/contents/Doctrine/GLOBAL_AGENT_DOCTRINE.md?ref=main",
    { body: { content: Buffer.from("# Global Doctrine\n", "utf8").toString("base64") } }
  ],
  [
    "https://api.github.com/repos/R1mob2-svg/global-agent-brain/contents/Doctrine/RELEASESEAL_AND_PACKAGING_DOCTRINE.md?ref=main",
    { status: 404, body: { message: "missing in proof fixture" } }
  ],
  [
    "https://api.github.com/repos/R1mob2-svg/global-agent-brain/contents/Agents/Geminex/Inbox/FromNewton/2026-04-30_AGENT_BRAIN_OS_LIBRARIAN_MVP_POINTER.md?ref=main",
    {
      body: {
        content: Buffer.from("# Pointer\nTarget repo: R1mob2-svg/agent-brain-os-website\n", "utf8").toString("base64")
      }
    }
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
      const fixture = responseMap.get(url);
      if (!fixture) {
        return jsonResponse({ message: `Unhandled URL ${url}` }, 404);
      }
      return jsonResponse(fixture.body, fixture.status ?? 200);
    }
  );

  assert.ok(bundle.contextPack);
  assert.ok(bundle.authorityPack);
  assert.ok(bundle.proofContract);
  assert.ok(bundle.taskPacks);
  assert.ok("sourceCommit" in bundle);
  assert.ok("source_commit" in bundle.contextPack);
  assert.equal(bundle.sourceCommit, null);
  assert.equal(bundle.contextPack.source_commit, null);
  assert.ok(bundle.retrievalLogId.startsWith("retrieval_"));
  assert.equal(bundle.contextPack.retrieval_log_id, bundle.retrievalLogId);
  assert.ok(bundle.excludedFiles.every((file) => file.reason.length > 0));
  assert.ok(bundle.contextPack.excluded_sources.every((file) => file.reason.length > 0));
  assert.ok(bundle.contextPack.missing_context_warnings.length > 0);
  assert.ok(bundle.contextPack.stale_warnings.length > 0);

  console.log("PROOF_011_PACK_GENERATION PASSED");
}

void main();
