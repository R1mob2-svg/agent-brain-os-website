export interface BundleFileDefinition {
  path: string;
  reason: string;
}

export interface BundleDefinition {
  id: string;
  agent: string;
  workspace: string;
  task: string;
  title: string;
  summary: string;
  selected: BundleFileDefinition[];
  excluded: BundleFileDefinition[];
}

export interface RetrievedFile {
  path: string;
  reason: string;
  excerpt: string;
  bytes: number | null;
  available: boolean;
}

export interface ExcludedFile {
  path: string;
  reason: string;
}

export type ContextPackSourceAvailability = "available" | "missing";

export interface ContextPackSource {
  path: string;
  reason: string;
  availability: ContextPackSourceAvailability;
  excerpt: string;
  bytes: number | null;
}

export interface ContextPack {
  included_sources: ContextPackSource[];
  excluded_sources: ExcludedFile[];
  stale_warnings: string[];
  missing_context_warnings: string[];
  source_commit: string | null;
  retrieval_log_id: string;
}

export interface AuthorityPack {
  agent: string;
  workspace: string;
  allowed_operations: string[];
  forbidden_operations: string[];
  escalation_required_for: string[];
  protected_surfaces: string[];
}

export interface ProofContract {
  required_commands: string[];
  required_receipts: string[];
  pass_conditions: string[];
  fail_conditions: string[];
  no_fake_pass_rules: string[];
}

export interface TaskPackSource {
  path: string;
  reason: string;
}

export interface TaskPack {
  agent: string;
  objective: string;
  context_summary: string;
  included_sources: TaskPackSource[];
  excluded_sources: TaskPackSource[];
  allowed_operations: string[];
  forbidden_operations: string[];
  required_receipts: string[];
  escalation_rules: string[];
}

export interface TaskPacks {
  codex?: TaskPack;
  ag?: TaskPack;
  geminex?: TaskPack;
  chantelle?: TaskPack;
  future_agent?: TaskPack;
}

export interface RetrievalBundleResult {
  repo: string;
  branch: string;
  sourceCommit: string | null;
  retrievalLogId: string;
  mode: "bounded_read_only_candidate";
  response_generation_mode: "structured";
  agent: string;
  workspace: string;
  task: string;
  bundleTitle: string;
  bundleSummary: string;
  selectedFiles: RetrievedFile[];
  excludedFiles: ExcludedFile[];
  warnings: string[];
  contextPack: ContextPack;
  authorityPack: AuthorityPack;
  proofContract: ProofContract;
  taskPacks: TaskPacks;
}

export interface LibrarianHealthPayload {
  status: "ok";
  mode: "bounded_read_only_candidate";
  response_generation_mode: "structured";
  repo: string;
  branch: string;
  candidateWrites: "staged_only";
  allowedRoots: string[];
}

export interface CandidateMemoryInput {
  agent: string;
  workspace: string;
  proposedPath: string;
  title: string;
  content: string;
  rationale: string;
}

export interface CandidateMemoryResult {
  status:
    | "candidate_staged"
    | "blocked_secret_like"
    | "blocked_protected_path"
    | "blocked_invalid_path";
  response_generation_mode: "structured";
  candidateId: string | null;
  targetPath: string | null;
  reason: string | null;
  resolution_path: string | null;
  recovery_path: string | null;
  rationale: string;
  preview: string | null;
  warnings: string[];
}
