import assert from "node:assert/strict";
import { promises as fs } from "node:fs";
import path from "node:path";

import { detectUnsafeConceptWordRedaction } from "../lib/response-laws/enforcement";

async function walk(current: string): Promise<string[]> {
  const entries = await fs.readdir(current, { withFileTypes: true });
  const files: string[] = [];

  for (const entry of entries) {
    if (entry.name === "node_modules" || entry.name === ".next" || entry.name === ".git") {
      continue;
    }

    const absolute = path.join(current, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await walk(absolute)));
      continue;
    }

    if (/\.(?:ts|tsx)$/i.test(entry.name)) {
      files.push(absolute);
    }
  }

  return files;
}

async function main() {
  const root = process.cwd();
  const sourceRoots = ["app", "lib"].map((relative) => path.join(root, relative));
  const files = (
    await Promise.all(
      sourceRoots.map(async (directory) => {
        try {
          return await walk(directory);
        } catch {
          return [];
        }
      })
    )
  ).flat();

  const findings: string[] = [];

  for (const file of files) {
    const content = await fs.readFile(file, "utf8");
    const matches = detectUnsafeConceptWordRedaction(content);
    for (const match of matches) {
      findings.push(`${path.relative(root, file)} -> ${match.snippet}`);
    }
  }

  assert.equal(findings.length, 0, `Unsafe concept-word redaction detected:\n${findings.join("\n")}`);
  console.log("PROOF_009_REDACTION_PROXIMITY PASSED");
}

void main();
