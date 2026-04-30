import { randomUUID } from "node:crypto";

import {
  AGENT_BRAIN_BRANCH,
  AGENT_BRAIN_REPO,
  ALLOWED_ROOTS,
  BLOCKED_ROOTS,
  BUNDLE_DEFINITIONS,
  isAllowedBundlePath,
  resolveBundle
} from "@/lib/librarian/repo-map";
import type {
  CandidateMemoryInput,
  CandidateMemoryResult,
  LibrarianHealthPayload,
  RetrievalBundleResult,
  RetrievedFile
} from "@/lib/librarian/types";

interface GitHubJsonResponse {
  ok: boolean;
  status: number;
  json: unknown;
}

function githubHeaders(): HeadersInit {
  const token = process.env.GITHUB_TOKEN?.trim();
  return token
    ? {
        Accept: "application/vnd.github+json",
        Authorization: `Bearer ${token}`,
        "User-Agent": "agent-brain-os-librarian",
        "X-GitHub-Api-Version": "2022-11-28"
      }
    : {
        Accept: "application/vnd.github+json",
        "User-Agent": "agent-brain-os-librarian",
        "X-GitHub-Api-Version": "2022-11-28"
      };
}

async function fetchGitHubJson(url: string, fetcher: typeof fetch = fetch): Promise<GitHubJsonResponse> {
  const response = await fetcher(url, { headers: githubHeaders(), cache: "no-store" });
  const text = await response.text();
  let json: unknown = null;
  if (text) {
    try {
      json = JSON.parse(text);
    } catch {
      json = null;
    }
  }
  return {
    ok: response.ok,
    status: response.status,
    json
  };
}

function excerptFromContent(content: string): string {
  const firstLine =
    content
      .split(/\r?\n/)
      .map((line) => line.trim())
      .find((line) => line.length > 0) ?? "No readable excerpt.";
  return firstLine.slice(0, 180);
}

async function fetchRepoHead(fetcher: typeof fetch = fetch): Promise<{ commit: string | null; warnings: string[] }> {
  try {
    const response = await fetchGitHubJson(
      `https://api.github.com/repos/${AGENT_BRAIN_REPO}/branches/${AGENT_BRAIN_BRANCH}`,
      fetcher
    );
    const sha =
      response.ok &&
      response.json &&
      typeof response.json === "object" &&
      typeof ((response.json as Record<string, unknown>).commit as Record<string, unknown> | undefined)?.sha === "string"
        ? ((((response.json as Record<string, unknown>).commit as Record<string, unknown>).sha) as string)
        : null;
    if (!sha) {
      return {
        commit: null,
        warnings: ["GitHub branch head could not be resolved for the current retrieval."]
      };
    }
    return { commit: sha, warnings: [] };
  } catch {
    return {
      commit: null,
      warnings: ["GitHub branch head lookup failed, so the source commit is unavailable in this retrieval."]
    };
  }
}

async function fetchBundleFile(pathname: string, fetcher: typeof fetch = fetch): Promise<RetrievedFile> {
  try {
    const response = await fetchGitHubJson(
      `https://api.github.com/repos/${AGENT_BRAIN_REPO}/contents/${pathname.split("/").map(encodeURIComponent).join("/")}?ref=${AGENT_BRAIN_BRANCH}`,
      fetcher
    );
    if (!response.ok || !response.json || typeof response.json !== "object") {
      return {
        path: pathname,
        reason: "File could not be loaded from GitHub in this retrieval.",
        excerpt: "Unavailable",
        bytes: null,
        available: false
      };
    }
    const encodedContent = typeof (response.json as Record<string, unknown>).content === "string"
      ? ((response.json as Record<string, unknown>).content as string)
      : "";
    const decoded = Buffer.from(encodedContent.replace(/\n/g, ""), "base64").toString("utf8");
    return {
      path: pathname,
      reason: "",
      excerpt: excerptFromContent(decoded),
      bytes: decoded.length,
      available: true
    };
  } catch {
    return {
      path: pathname,
      reason: "GitHub retrieval failed for this file in the current environment.",
      excerpt: "Unavailable",
      bytes: null,
      available: false
    };
  }
}

export function buildHealthPayload(): LibrarianHealthPayload {
  return {
    status: "ok",
    mode: "bounded_read_only_candidate",
    repo: AGENT_BRAIN_REPO,
    branch: AGENT_BRAIN_BRANCH,
    candidateWrites: "staged_only",
    allowedRoots: [...ALLOWED_ROOTS]
  };
}

export async function retrieveBundle(
  input: {
    agent: string;
    workspace: string;
    task: string;
  },
  fetcher: typeof fetch = fetch
): Promise<RetrievalBundleResult> {
  const bundle = resolveBundle(input.agent, input.workspace, input.task);
  const head = await fetchRepoHead(fetcher);
  const selectedFiles = await Promise.all(
    bundle.selected.map(async (file) => {
      const fetched = await fetchBundleFile(file.path, fetcher);
      return {
        ...fetched,
        reason: file.reason
      };
    })
  );

  return {
    repo: AGENT_BRAIN_REPO,
    branch: AGENT_BRAIN_BRANCH,
    sourceCommit: head.commit,
    retrievalLogId: `retrieval_${randomUUID()}`,
    mode: "bounded_read_only_candidate",
    agent: bundle.agent,
    workspace: bundle.workspace,
    task: bundle.task,
    bundleTitle: bundle.title,
    bundleSummary: bundle.summary,
    selectedFiles,
    excludedFiles: bundle.excluded.map((file) => ({
      path: file.path,
      reason: file.reason
    })),
    warnings: head.warnings
  };
}

export function stageCandidateMemoryUpdate(input: CandidateMemoryInput): CandidateMemoryResult {
  const proposedPath = input.proposedPath.trim().replace(/\\/g, "/");
  if (!/^Agents\/[A-Za-z0-9._-]+\/Candidates\/[A-Za-z0-9._/-]+\.md$/i.test(proposedPath)) {
    return {
      status: "blocked_invalid_path",
      candidateId: null,
      targetPath: null,
      rationale: "Candidate updates must stay under Agents/<agent>/Candidates/*.md",
      preview: null,
      warnings: []
    };
  }

  if (!isAllowedBundlePath(proposedPath) || BLOCKED_ROOTS.some((blocked) => proposedPath.startsWith(blocked))) {
    return {
      status: "blocked_protected_path",
      candidateId: null,
      targetPath: proposedPath,
      rationale: "Candidate path falls outside the bounded Agent Brain OS write lane.",
      preview: null,
      warnings: []
    };
  }

  if (/(github_pat_|gh[opusr]_|sk-|Bearer\s+[A-Za-z0-9._~+/=-]{16,}|\.env\b|token\b|secret\b)/i.test(input.content)) {
    return {
      status: "blocked_secret_like",
      candidateId: null,
      targetPath: proposedPath,
      rationale: "Candidate content looks secret-bearing and cannot be staged.",
      preview: null,
      warnings: []
    };
  }

  return {
    status: "candidate_staged",
    candidateId: `candidate_${randomUUID()}`,
    targetPath: proposedPath,
    rationale: input.rationale,
    preview: [
      `# ${input.title.trim()}`,
      "",
      `Agent: ${input.agent.trim()}`,
      `Workspace: ${input.workspace.trim()}`,
      "",
      input.content.trim()
    ].join("\n"),
    warnings: ["Candidate staged only. No GitHub write or promotion was attempted."]
  };
}

export function buildWorkspaceCards() {
  return [
    {
      title: "Agent Brain OS",
      note: "Website, Librarian control plane, retrieval bundles, staged candidate updates."
    },
    {
      title: "My New Agents",
      note: "Founder runtime, NEO, Kerry, Twilio safety, protected execution boundaries."
    },
    {
      title: "Global Doctrine",
      note: "Boot, doctrine, proof, release packaging, and shared operating rules."
    }
  ];
}

export function buildAgentCards() {
  return [
    { title: "Geminex", note: "Build, deploy, browser proof, ReleaseSeal, governed repo mutation." },
    { title: "NEO", note: "Founder-facing operator surface with bounded repair and read-only truth answers." },
    { title: "Codex", note: "Forensic execution, repair, validation, and integration work." },
    { title: "Kerry", note: "Voice / comms operator with outbound safety and honest simulation boundaries." }
  ];
}

export function buildBundleCards() {
  return BUNDLE_DEFINITIONS.map((bundle) => ({
    id: bundle.id,
    title: bundle.title,
    summary: bundle.summary,
    count: bundle.selected.length
  }));
}
