import { BLOCKED_ROOTS } from "@/lib/librarian/repo-map";
import type {
  AuthorityPack,
  BundleDefinition,
  ContextPack,
  ExcludedFile,
  ProofContract,
  RetrievedFile,
  TaskPack,
  TaskPackSource,
  TaskPacks
} from "@/lib/librarian/types";

const SHARED_PROTECTED_SURFACES = [
  ...BLOCKED_ROOTS,
  "tenant/API-key files",
  "release receipt files",
  "protected governance changes"
];

const BASE_REQUIRED_RECEIPTS = [
  "source commit",
  "retrieval log id",
  "proof outputs",
  "git diff --check",
  "git status --short"
];

const BASE_PROOF_COMMANDS = [
  "npm run typecheck",
  "npm run build",
  "npm run proof:001",
  "npm run proof:002",
  "npm run proof:003",
  "npm run proof:004",
  "npm run proof:005",
  "npm run proof:006",
  "git diff --check",
  "git status --short"
];

function dedupe(values: string[]): string[] {
  return Array.from(new Set(values.map((value) => value.trim()).filter(Boolean)));
}

function toTaskPackSources(files: Array<RetrievedFile | ExcludedFile>): TaskPackSource[] {
  return files.map((file) => ({
    path: file.path,
    reason: file.reason
  }));
}

function buildContextSummary(bundle: BundleDefinition, selectedFiles: RetrievedFile[], retrievalLogId: string): string {
  const availableCount = selectedFiles.filter((file) => file.available).length;
  return `${bundle.summary} ${availableCount}/${selectedFiles.length} selected sources were available in retrieval ${retrievalLogId}.`;
}

function buildProtectedSurfaces(agent: string): string[] {
  const protectedSurfaces = [...SHARED_PROTECTED_SURFACES];
  if (agent.trim().toLowerCase() !== "chantelle") {
    protectedSurfaces.push("Agents/Chantelle/**");
  }
  return dedupe(protectedSurfaces);
}

function buildAgentProfile(
  agent: string,
  workspace: string
): Pick<AuthorityPack, "allowed_operations" | "forbidden_operations" | "escalation_required_for" | "protected_surfaces"> {
  const normalizedAgent = agent.trim().toLowerCase();
  const protected_surfaces = buildProtectedSurfaces(agent);

  if (normalizedAgent === "codex") {
    return {
      allowed_operations: ["inspect", "patch scoped files", "run proof commands"],
      forbidden_operations: ["deploy", "merge", "secrets", "protected governance changes"],
      escalation_required_for: ["cross-repo edits", "new dependencies", "protected surface reads"],
      protected_surfaces
    };
  }

  if (normalizedAgent === "ag") {
    return {
      allowed_operations: ["browser verification", "visual QA", "deployment inspection"],
      forbidden_operations: ["source-of-truth promotion", "secrets", "protected lock edits"],
      escalation_required_for: ["repo mutation", "environment changes", "production cutover"],
      protected_surfaces
    };
  }

  if (normalizedAgent === "geminex") {
    return {
      allowed_operations: ["route", "verify runtime truth", "produce receipts"],
      forbidden_operations: ["fake deploys", "unapproved protected mutation", "secrets", "fake PASS"],
      escalation_required_for: ["deployment promotion", "protected mutation", "cross-repo truth changes"],
      protected_surfaces
    };
  }

  if (normalizedAgent === "chantelle") {
    return {
      allowed_operations: ["customer-safe summaries", "sales handoffs", "offer drafts"],
      forbidden_operations: ["code mutation", "secrets", "private founder memory"],
      escalation_required_for: ["live customer sends", "price or scope commitments", "CRM mutation"],
      protected_surfaces
    };
  }

  if (normalizedAgent === "future_agent") {
    return {
      allowed_operations: ["inspect", "summarize", "draft plan"],
      forbidden_operations: ["deploy", "merge", "secrets", "code mutation", "source-of-truth promotion"],
      escalation_required_for: ["any writes", "external communication", "environment access", "protected surface reads"],
      protected_surfaces
    };
  }

  return {
    allowed_operations: ["inspect"],
    forbidden_operations: ["deploy", "merge", "secrets", "source-of-truth promotion"],
    escalation_required_for: [`unmapped ${agent} action in ${workspace}`],
    protected_surfaces
  };
}

function buildTaskPack(
  agent: string,
  bundle: BundleDefinition,
  selectedFiles: RetrievedFile[],
  excludedFiles: ExcludedFile[],
  proofContract: ProofContract,
  retrievalLogId: string
): TaskPack {
  const authority = buildAuthorityPack({ agent, workspace: bundle.workspace });
  return {
    agent,
    objective:
      agent === "Codex"
        ? "Implement or repair the bounded Librarian surface using only the retrieved sources and current repo truth."
        : agent === "AG"
          ? "Verify browser-visible behavior, visual clarity, and deployment truth without promoting source of truth."
          : agent === "Geminex"
            ? "Route the retrieved bundle into runtime truth checks and produce receipts without inventing state."
            : agent === "Chantelle"
              ? "Turn the retrieved bundle into a customer-safe summary or handoff without touching code or private memory."
              : "Stay conservative: inspect the bounded bundle, summarize it, and escalate before any mutation.",
    context_summary: buildContextSummary(bundle, selectedFiles, retrievalLogId),
    included_sources: toTaskPackSources(selectedFiles),
    excluded_sources: toTaskPackSources(excludedFiles),
    allowed_operations: authority.allowed_operations,
    forbidden_operations: authority.forbidden_operations,
    required_receipts: [...proofContract.required_receipts],
    escalation_rules: [...authority.escalation_required_for]
  };
}

export function buildContextPack(input: {
  selectedFiles: RetrievedFile[];
  excludedFiles: ExcludedFile[];
  sourceCommit: string | null;
  retrievalLogId: string;
  warnings?: string[];
}): ContextPack {
  const stale_warnings = dedupe([
    ...(input.warnings ?? []),
    ...(input.sourceCommit ? [] : ["Source commit unavailable; retrieval may be stale relative to the live branch head."])
  ]);
  const missing_context_warnings = dedupe(
    input.selectedFiles
      .filter((file) => !file.available)
      .map((file) => `Missing context: ${file.path} (${file.reason || "retrieval unavailable"})`)
  );

  return {
    included_sources: input.selectedFiles.map((file) => ({
      path: file.path,
      reason: file.reason,
      availability: file.available ? "available" : "missing",
      excerpt: file.excerpt,
      bytes: file.bytes
    })),
    excluded_sources: input.excludedFiles.map((file) => ({
      path: file.path,
      reason: file.reason
    })),
    stale_warnings,
    missing_context_warnings,
    source_commit: input.sourceCommit,
    retrieval_log_id: input.retrievalLogId
  };
}

export function buildAuthorityPack(input: { agent: string; workspace: string }): AuthorityPack {
  const profile = buildAgentProfile(input.agent, input.workspace);
  return {
    agent: input.agent,
    workspace: input.workspace,
    allowed_operations: profile.allowed_operations,
    forbidden_operations: profile.forbidden_operations,
    escalation_required_for: profile.escalation_required_for,
    protected_surfaces: profile.protected_surfaces
  };
}

export function buildProofContract(input: { agent: string; workspace: string; task: string }): ProofContract {
  return {
    required_commands: [...BASE_PROOF_COMMANDS],
    required_receipts: [...BASE_REQUIRED_RECEIPTS],
    pass_conditions: [
      "Context pack is present with included and excluded sources.",
      "Authority pack matches the active agent and workspace.",
      "Proof outputs are green before any PASS claim.",
      "Protected surfaces remain untouched and unexposed."
    ],
    fail_conditions: [
      "Missing context warnings are suppressed or ignored.",
      "Required commands are skipped but the work is still marked PASS.",
      "Protected surfaces or secret-bearing files are exposed.",
      `${input.agent} task pack drifts outside ${input.workspace} bounded retrieval truth.`
    ],
    no_fake_pass_rules: [
      "No PASS without running the required commands.",
      "No PASS if source commit is unavailable without an explicit warning.",
      "No PASS if retrieval log id is missing from the receipt trail.",
      "No PASS if missing or excluded sources are hidden from the operator."
    ]
  };
}

export function buildTaskPacks(input: {
  bundle: BundleDefinition;
  selectedFiles: RetrievedFile[];
  excludedFiles: ExcludedFile[];
  proofContract: ProofContract;
  retrievalLogId: string;
}): TaskPacks {
  return {
    codex: buildTaskPack("Codex", input.bundle, input.selectedFiles, input.excludedFiles, input.proofContract, input.retrievalLogId),
    ag: buildTaskPack("AG", input.bundle, input.selectedFiles, input.excludedFiles, input.proofContract, input.retrievalLogId),
    geminex: buildTaskPack(
      "Geminex",
      input.bundle,
      input.selectedFiles,
      input.excludedFiles,
      input.proofContract,
      input.retrievalLogId
    ),
    chantelle: buildTaskPack(
      "Chantelle",
      input.bundle,
      input.selectedFiles,
      input.excludedFiles,
      input.proofContract,
      input.retrievalLogId
    ),
    future_agent: buildTaskPack(
      "future_agent",
      input.bundle,
      input.selectedFiles,
      input.excludedFiles,
      input.proofContract,
      input.retrievalLogId
    )
  };
}
