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
    { commit: { sha: "commit-003" } }
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
    { content: Buffer.from("# Pointer\nTarget repo: R1mob2-svg/agent-brain-os-website\n", "utf8").toString("base64") }
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

  assert.equal(bundle.sourceCommit, "commit-003");
  assert.ok(bundle.selectedFiles.length >= 4);
  assert.ok(bundle.excludedFiles.some((file) => file.path.includes("Shared_Doctrine")));
  assert.ok(
    bundle.selectedFiles.every((file) => file.path.startsWith("Doctrine/") || file.path.startsWith("Agents/"))
  );

  console.log("PROOF_003_RETRIEVAL_PERMISSION_FILTERS PASSED");
}

void main();
