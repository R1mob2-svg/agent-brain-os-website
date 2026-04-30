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

export interface RetrievalBundleResult {
  repo: string;
  branch: string;
  sourceCommit: string | null;
  retrievalLogId: string;
  mode: "bounded_read_only_candidate";
  agent: string;
  workspace: string;
  task: string;
  bundleTitle: string;
  bundleSummary: string;
  selectedFiles: RetrievedFile[];
  excludedFiles: ExcludedFile[];
  warnings: string[];
}

export interface LibrarianHealthPayload {
  status: "ok";
  mode: "bounded_read_only_candidate";
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
  candidateId: string | null;
  targetPath: string | null;
  rationale: string;
  preview: string | null;
  warnings: string[];
}
