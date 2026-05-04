import assert from "node:assert/strict";
import { promises as fs } from "node:fs";
import path from "node:path";

import { detectCannedResponsePatterns } from "../lib/response-laws/enforcement";

const scanRoots = [
  { directory: "app", extensions: [".ts", ".tsx"] },
  { directory: "lib", extensions: [".ts"] },
  { directory: "Shared_Doctrine", extensions: [".md"] }
] as const;

async function walk(current: string, extensions: readonly string[]): Promise<string[]> {
  const entries = await fs.readdir(current, { withFileTypes: true });
  const files: string[] = [];

  for (const entry of entries) {
    if (entry.name === "node_modules" || entry.name === ".next" || entry.name === ".git") {
      continue;
    }

    const absolute = path.join(current, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await walk(absolute, extensions)));
      continue;
    }

    if (extensions.some((extension) => entry.name.endsWith(extension))) {
      files.push(absolute);
    }
  }

  return files;
}

function isDoctrineForbiddenExample(text: string, matchIndex: number): boolean {
  const lines = text.split(/\r?\n/);
  let runningIndex = 0;

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    const lineStart = runningIndex;
    const lineEnd = runningIndex + line.length;
    runningIndex = lineEnd + 1;

    if (matchIndex < lineStart || matchIndex > lineEnd) {
      continue;
    }

    const context = lines.slice(Math.max(0, index - 4), index + 1).join("\n").toLowerCase();
    return /forbidden example|forbidden examples|forbidden founder-facing prose/.test(context);
  }

  return false;
}

function isDetectionRegistryFile(file: string, text: string): boolean {
  return (
    file.endsWith(`${path.sep}lib${path.sep}response-laws${path.sep}enforcement.ts`) &&
    /FORBIDDEN_FOUNDER_FACING_PATTERNS/.test(text)
  );
}

async function main() {
  const root = process.cwd();
  const findings: string[] = [];

  for (const scanRoot of scanRoots) {
    const absoluteRoot = path.join(root, scanRoot.directory);
    let files: string[] = [];

    try {
      files = await walk(absoluteRoot, scanRoot.extensions);
    } catch {
      files = [];
    }

    for (const file of files) {
      const content = await fs.readFile(file, "utf8");
      const matches = detectCannedResponsePatterns(content).filter((match) => {
        const isDoctrineFile = file.includes(`${path.sep}Shared_Doctrine${path.sep}`);
        if (isDetectionRegistryFile(file, content)) {
          return false;
        }
        return !isDoctrineFile || !isDoctrineForbiddenExample(content, match.index);
      });

      for (const match of matches) {
        findings.push(`${path.relative(root, file)}:${match.line} -> ${match.pattern}`);
      }
    }
  }

  assert.equal(findings.length, 0, `Canned founder-facing patterns detected:\n${findings.join("\n")}`);
  console.log("PROOF_008_NO_CANNED_RESPONSE_PATTERNS PASSED");
}

void main();
