import assert from "node:assert/strict";

import { NextRequest } from "next/server";

import { GET } from "../app/api/librarian/retrieve/route";

function jsonResponse(body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { "Content-Type": "application/json" }
  });
}

const responseMap = new Map<string, unknown>([
  [
    "https://api.github.com/repos/R1mob2-svg/global-agent-brain/branches/main",
    { commit: { sha: "commit-013" } }
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
  const originalFetch = global.fetch;
  global.fetch = (async (input) => {
    const url = typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url;
    const body = responseMap.get(url);
    if (!body) {
      return new Response(JSON.stringify({ message: `Unhandled URL ${url}` }), { status: 404 });
    }
    return jsonResponse(body);
  }) as typeof fetch;

  try {
    const response = await GET(new NextRequest("http://localhost/api/librarian/retrieve"));
    const payload = (await response.json()) as Record<string, unknown>;

    assert.equal(payload.repo, "R1mob2-svg/global-agent-brain");
    assert.ok("contextPack" in payload);
    assert.ok("authorityPack" in payload);
    assert.ok("proofContract" in payload);
    assert.ok("taskPacks" in payload);
  } finally {
    global.fetch = originalFetch;
  }

  console.log("PROOF_013_LIBRARIAN_API_SHAPE PASSED");
}

void main();
