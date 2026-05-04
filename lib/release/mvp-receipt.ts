import { execSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { AGENT_BRAIN_REPO } from "@/lib/librarian/repo-map";

export const MVP_PRODUCT_NAME = "Agent Brain OS Librarian MVP";
export const MVP_WEBSITE_REPO = "R1mob2-svg/agent-brain-os-website";
export const MVP_RELEASE_STATUS = "MVP_NOT_FULL_SAAS" as const;

export type MvpDeploymentState =
  | "not_claimed"
  | "local_only"
  | "deployed_unverified"
  | "deployed_verified";

export type MvpReleaseVerdict = "PASS" | "PARTIAL" | "BLOCKED" | "FAIL";

export interface MvpReleaseReceipt {
  product: typeof MVP_PRODUCT_NAME;
  repo: typeof MVP_WEBSITE_REPO;
  branch: string;
  source_memory_repo: typeof AGENT_BRAIN_REPO;
  status: typeof MVP_RELEASE_STATUS;
  proven_capabilities: string[];
  unproven_capabilities: string[];
  safety_boundaries: string[];
  proof_scripts: string[];
  deployment_state: MvpDeploymentState;
  final_verdict: MvpReleaseVerdict;
}

const MODULE_DIR = dirname(fileURLToPath(import.meta.url));
const PACKAGE_JSON_PATH = resolve(MODULE_DIR, "../../package.json");

const PROVEN_CAPABILITY_CHECKS = [
  {
    label: "Next.js app shell",
    files: [
      resolve(MODULE_DIR, "../../app/layout.tsx"),
      resolve(MODULE_DIR, "../../app/app/layout.tsx"),
      resolve(MODULE_DIR, "../../app/app/page.tsx")
    ]
  },
  {
    label: "Librarian MVP",
    files: [
      resolve(MODULE_DIR, "../../app/app/librarian/page.tsx"),
      resolve(MODULE_DIR, "../../app/api/librarian/health/route.ts"),
      resolve(MODULE_DIR, "../../lib/librarian/service.ts")
    ]
  },
  {
    label: "bounded retrieval",
    files: [
      resolve(MODULE_DIR, "../../app/api/librarian/retrieve/route.ts"),
      resolve(MODULE_DIR, "../../lib/librarian/repo-map.ts"),
      resolve(MODULE_DIR, "../../lib/librarian/service.ts")
    ]
  },
  {
    label: "candidate staging",
    files: [
      resolve(MODULE_DIR, "../../app/api/librarian/candidates/route.ts"),
      resolve(MODULE_DIR, "../../lib/librarian/service.ts")
    ]
  },
  {
    label: "proof scripts",
    files: [
      resolve(MODULE_DIR, "../../proofs/proof_001_librarian_health.ts"),
      resolve(MODULE_DIR, "../../proofs/proof_002_repo_map_safety.ts"),
      resolve(MODULE_DIR, "../../proofs/proof_003_retrieval_permission_filters.ts"),
      resolve(MODULE_DIR, "../../proofs/proof_004_candidate_memory_safety.ts"),
      resolve(MODULE_DIR, "../../proofs/proof_005_frontend_routes_render.ts"),
      resolve(MODULE_DIR, "../../proofs/proof_006_no_client_env_leak.ts"),
      resolve(MODULE_DIR, "../../proofs/proof_023_mvp_receipt_truth.ts"),
      resolve(MODULE_DIR, "../../proofs/proof_024_status_and_beta_truth.ts")
    ]
  }
] as const;

const UNPROVEN_CAPABILITIES = [
  "commercial SaaS readiness",
  "tenant provisioning",
  "one GitHub repo per tenant",
  "live customer billing",
  "production tenant isolation",
  "Geminex API migration as customer",
  "public beta customer proof",
  "ReleaseSeal containment-pack parity"
] as const;

const SAFETY_BOUNDARIES = [
  "bounded read-only retrieval only",
  "candidate writes are staged only",
  "tenant provisioning is not implemented unless proven",
  "API keys per tenant are not implemented unless proven",
  "billing is not implemented",
  "production deployment is unknown and not claimed unless proven"
] as const;

const PROOF_SCRIPT_CANDIDATES = [
  "proof:001",
  "proof:002",
  "proof:003",
  "proof:004",
  "proof:005",
  "proof:006",
  "proof:023",
  "proof:024"
] as const;

function repoFileExists(absolutePath: string): boolean {
  return existsSync(absolutePath);
}

function resolveBranch(): string {
  const envBranch =
    process.env.VERCEL_GIT_COMMIT_REF?.trim() ||
    process.env.GITHUB_HEAD_REF?.trim() ||
    process.env.GITHUB_REF_NAME?.trim();

  if (envBranch) {
    return envBranch;
  }

  try {
    const branch = execSync("git branch --show-current", {
      cwd: process.cwd(),
      stdio: ["ignore", "pipe", "ignore"]
    })
      .toString("utf8")
      .trim();

    if (branch) {
      return branch;
    }
  } catch {
    return "unknown";
  }

  return "unknown";
}

function detectProvenCapabilities(): string[] {
  return PROVEN_CAPABILITY_CHECKS.filter((capability) =>
    capability.files.every((file) => repoFileExists(file))
  ).map((capability) => capability.label);
}

function detectProofScripts(): string[] {
  try {
    const packageJson = JSON.parse(readFileSync(PACKAGE_JSON_PATH, "utf8")) as {
      scripts?: Record<string, string>;
    };
    const scripts = packageJson.scripts ?? {};
    return PROOF_SCRIPT_CANDIDATES.filter((scriptName) => typeof scripts[scriptName] === "string");
  } catch {
    return [];
  }
}

export function buildMvpReleaseReceipt(): MvpReleaseReceipt {
  const provenCapabilities = detectProvenCapabilities();

  return {
    product: MVP_PRODUCT_NAME,
    repo: MVP_WEBSITE_REPO,
    branch: resolveBranch(),
    source_memory_repo: AGENT_BRAIN_REPO,
    status: MVP_RELEASE_STATUS,
    proven_capabilities: provenCapabilities,
    unproven_capabilities: [...UNPROVEN_CAPABILITIES],
    safety_boundaries: [...SAFETY_BOUNDARIES],
    proof_scripts: detectProofScripts(),
    deployment_state: "not_claimed",
    final_verdict: provenCapabilities.length >= 4 ? "PARTIAL" : "BLOCKED"
  };
}
