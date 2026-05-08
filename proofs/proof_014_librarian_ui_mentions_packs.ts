import assert from "node:assert/strict";
import { promises as fs } from "node:fs";
import path from "node:path";

async function main() {
  const pagePath = path.join(process.cwd(), "app", "app", "librarian", "page.tsx");
  const source = await fs.readFile(pagePath, "utf8");

  assert.match(source, /Context Pack/);
  assert.match(source, /Authority Pack/);
  assert.match(source, /Proof Contract/);
  assert.match(source, /Codex Task Pack/);
  assert.match(source, /AG Task Pack/);
  assert.match(source, /Excluded Sources/);

  console.log("PROOF_014_LIBRARIAN_UI_MENTIONS_PACKS PASSED");
}

void main();
