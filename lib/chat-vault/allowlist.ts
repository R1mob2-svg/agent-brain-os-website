/**
 * Chat Vault V0.1 — Allowlist
 * Determines whether receipt paths are allowed, forbidden, or tenant-scoped.
 * Policy is loaded from config/chat-vault-policy.json.
 */

import { readFileSync } from "fs";
import { join } from "path";
import type { ChatVaultPolicy } from "./types";

// ─── Policy loader ─────────────────────────────────────────────────────────────

let _policy: ChatVaultPolicy | null = null;

export function loadPolicy(): ChatVaultPolicy {
  if (_policy !== null) return _policy;

  const configPath = join(process.cwd(), "config", "chat-vault-policy.json");
  const raw = readFileSync(configPath, "utf-8");
  const parsed: unknown = JSON.parse(raw);

  if (typeof parsed !== "object" || parsed === null) {
    throw new Error("chat-vault-policy.json did not parse to an object");
  }

  _policy = parsed as ChatVaultPolicy;
  return _policy;
}

// Reset for testing
export function _resetPolicyCache(): void {
  _policy = null;
}

// ─── Glob matching ─────────────────────────────────────────────────────────────

/**
 * Minimal glob matcher supporting `**` and `*` wildcards.
 * No external dependency — avoids touching package.json.
 */
function matchesGlob(pattern: string, input: string): boolean {
  // Normalise separators
  const norm = (s: string) => s.replace(/\\/g, "/");
  const p = norm(pattern);
  const s = norm(input);

  // Convert glob to regex
  const regexStr = p
    .replace(/[.+^${}()|[\]\\]/g, "\\$&") // escape regex special chars
    .replace(/\*\*/g, "__DOUBLE_STAR__")
    .replace(/\*/g, "[^/]*")
    .replace(/__DOUBLE_STAR__\//g, "(?:.+/)?")
    .replace(/__DOUBLE_STAR__/g, ".*");

  const regex = new RegExp(`^${regexStr}$`);
  return regex.test(s);
}

// ─── Public API ────────────────────────────────────────────────────────────────

/**
 * Returns true if the path matches any allowlisted pattern.
 */
export function isPathAllowlisted(path: string): boolean {
  const policy = loadPolicy();
  return policy.allowlisted_receipt_paths.some((pattern) =>
    matchesGlob(pattern, path)
  );
}

/**
 * Returns true if the path matches any forbidden pattern.
 */
export function isPathForbidden(path: string): boolean {
  const policy = loadPolicy();
  return policy.forbidden_receipt_paths.some((pattern) =>
    matchesGlob(pattern, path)
  );
}

/**
 * Returns true if a path contains a tenant_id segment that does NOT match
 * the requesting tenant_id (tenant scope mismatch).
 *
 * Heuristic: paths prefixed with `tenants/<other_tenant>/` are tenant-scoped.
 * If the path has no tenant segment, this returns false (not a mismatch).
 */
export function isTenantMismatch(path: string, tenantId: string): boolean {
  const norm = path.replace(/\\/g, "/");
  const match = norm.match(/^tenants\/([^/]+)\//);
  if (match === null) return false;
  return match[1] !== tenantId;
}

/**
 * Returns true if the path appears to be a self-referential agent path
 * (agent working directory conventions).
 */
export function isSelfReferential(
  path: string,
  agentWritablePaths: string[]
): boolean {
  const norm = (s: string) => s.replace(/\\/g, "/").toLowerCase();
  const normPath = norm(path);
  return agentWritablePaths.some((wp) => normPath.startsWith(norm(wp)));
}

/**
 * Returns true if the path was recently modified by the requesting agent.
 */
export function isRecentlyModified(
  path: string,
  recentlyModifiedPaths: string[]
): boolean {
  const norm = (s: string) => s.replace(/\\/g, "/").toLowerCase();
  return recentlyModifiedPaths.some(
    (mp) => norm(mp) === norm(path)
  );
}
