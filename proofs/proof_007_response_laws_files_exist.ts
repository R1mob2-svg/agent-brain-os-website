import assert from "node:assert/strict";
import { promises as fs } from "node:fs";
import path from "node:path";

const requiredDoctrineFiles = [
  "Shared_Doctrine/AGENT_RESPONSE_GENERATION_LAWS.md",
  "Shared_Doctrine/STRUCTURAL_RESPONSE_FORMATS.md",
  "Shared_Doctrine/CANNED_RESPONSE_REGRESSION_PROMPTS.md",
  "Shared_Doctrine/BOOT_ACKNOWLEDGEMENT_TEMPLATE.md"
] as const;

const requiredLawHeadings = [
  "1. Responses are generated, never selected.",
  "2. No template is a structure exception unless proven.",
  "3. Uncertainty does not justify templates.",
  "4. Audit history is never current state.",
  "5. Self-reflection must work.",
  "6. Regex redaction requires proximity proof.",
  "7. Generation mode metadata required.",
  "8. Dead-end responses are forbidden.",
  "9. Across-prompt distinctness.",
  "10. Rip and replace, never layer."
] as const;

const requiredRegressionPrompts = [
  "scan my project for bugs",
  "list blockers",
  "give me a fix list for codex",
  "what can’t you do?",
  "explain your last response",
  "why did you say that?",
  "what’s broken about your previous answer?",
  "remove protected brain lock",
  "workspace binding required",
  "generation failed"
] as const;

async function main() {
  const root = process.cwd();

  for (const relativePath of requiredDoctrineFiles) {
    const absolutePath = path.join(root, relativePath);
    await assert.doesNotReject(() => fs.access(absolutePath), `${relativePath} is missing`);
  }

  const laws = await fs.readFile(path.join(root, requiredDoctrineFiles[0]), "utf8");
  for (const heading of requiredLawHeadings) {
    assert.match(laws, new RegExp(heading.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  }

  const prompts = await fs.readFile(path.join(root, requiredDoctrineFiles[2]), "utf8");
  for (const prompt of requiredRegressionPrompts) {
    assert.match(prompts, new RegExp(prompt.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  }

  const bootTemplate = await fs.readFile(path.join(root, requiredDoctrineFiles[3]), "utf8");
  assert.match(bootTemplate, /laws_acknowledged/);
  assert.match(bootTemplate, /restricted_mode/);

  console.log("PROOF_007_RESPONSE_LAWS_FILES_EXIST PASSED");
}

void main();
