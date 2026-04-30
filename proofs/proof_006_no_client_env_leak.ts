import assert from "node:assert/strict";
import { promises as fs } from "node:fs";
import path from "node:path";

async function walk(current: string): Promise<string[]> {
  const entries = await fs.readdir(current, { withFileTypes: true });
  const files: string[] = [];
  for (const entry of entries) {
    if (entry.name === "node_modules" || entry.name === ".next" || entry.name === ".git") continue;
    const absolute = path.join(current, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await walk(absolute)));
      continue;
    }
    if (/\.(?:ts|tsx|js|jsx)$/i.test(entry.name)) {
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

  for (const file of files) {
    const content = await fs.readFile(file, "utf8");
    assert.doesNotMatch(content, /NEXT_PUBLIC_GITHUB_TOKEN/);
    const isClientFile = /^["']use client["'];/m.test(content);
    if (isClientFile) {
      assert.doesNotMatch(content, /process\.env\./, `Client file leaked env access: ${file}`);
    }
  }

  console.log("PROOF_006_NO_CLIENT_ENV_LEAK PASSED");
}

void main();
