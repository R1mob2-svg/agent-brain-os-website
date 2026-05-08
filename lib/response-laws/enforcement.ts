export const FORBIDDEN_FOUNDER_FACING_PATTERNS = [
  "Functional Estimate",
  "AG Fix List",
  "That turn failed internally before a grounded answer was ready",
  "That only makes sense with the prior point in context",
  "Ask the full point again",
  "Workspace binding required. Bind a workspace first."
] as const;

export const APPROVED_RESPONSE_GENERATION_MODES = ["live", "structured", "cached", "citation"] as const;

export type ResponseGenerationMode = (typeof APPROVED_RESPONSE_GENERATION_MODES)[number];

export interface CannedResponsePatternMatch {
  pattern: string;
  matchedText: string;
  index: number;
  line: number;
}

export interface BlockingResponseValidationResult {
  valid: boolean;
  hasSpecificReason: boolean;
  hasResolutionPath: boolean;
  pathKey: "resolution_path" | "recovery_path" | null;
}

export interface UnsafeConceptWordRedactionMatch {
  snippet: string;
  index: number;
}

const NORMALIZE_NON_ALPHANUMERIC = /[^a-z0-9]+/g;
const REPLACE_CALL_REGEX = /\.replace(?:All)?\(\s*(\/(?:\\.|[^\/\n])+\/[dgimsuvy]*)/g;
const CONCEPT_WORDS = ["token", "secret", "credential", "password"] as const;
const CREDENTIAL_PATTERN_HINTS = [
  "bearer",
  "github_pat_",
  "gho_",
  "ghp_",
  "ghu_",
  "ghs_",
  "ghr_",
  "sk-",
  "api_key",
  "authorization",
  ".env",
  "private key",
  "secret key",
  "credential pattern",
  "credential-like",
  "proximity"
] as const;

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function lineNumberAt(text: string, index: number): number {
  return text.slice(0, index).split(/\r?\n/).length;
}

function normalizeForSimilarity(value: string): string {
  return value.toLowerCase().replace(NORMALIZE_NON_ALPHANUMERIC, " ").trim();
}

function buildBigrams(value: string): string[] {
  if (value.length < 2) {
    return value.length === 0 ? [] : [value];
  }

  const bigrams: string[] = [];
  for (let index = 0; index < value.length - 1; index += 1) {
    bigrams.push(value.slice(index, index + 2));
  }
  return bigrams;
}

function hasSpecificReasonInObject(value: unknown): boolean {
  if (!value || typeof value !== "object") {
    return false;
  }

  const reason = (value as Record<string, unknown>).reason;
  return typeof reason === "string" && reason.trim().length >= 12;
}

function hasResolutionPathInObject(
  value: unknown
): { hasResolutionPath: boolean; pathKey: "resolution_path" | "recovery_path" | null } {
  if (!value || typeof value !== "object") {
    return { hasResolutionPath: false, pathKey: null };
  }

  const record = value as Record<string, unknown>;
  if (typeof record.resolution_path === "string" && record.resolution_path.trim().length >= 12) {
    return { hasResolutionPath: true, pathKey: "resolution_path" };
  }
  if (typeof record.recovery_path === "string" && record.recovery_path.trim().length >= 12) {
    return { hasResolutionPath: true, pathKey: "recovery_path" };
  }

  return { hasResolutionPath: false, pathKey: null };
}

function snippetAround(text: string, index: number, radius = 120): string {
  const start = Math.max(0, index - radius);
  const end = Math.min(text.length, index + radius);
  return text.slice(start, end);
}

export function detectCannedResponsePatterns(text: string): CannedResponsePatternMatch[] {
  const matches: CannedResponsePatternMatch[] = [];

  for (const pattern of FORBIDDEN_FOUNDER_FACING_PATTERNS) {
    const matcher = new RegExp(escapeRegExp(pattern), "gi");
    for (const match of text.matchAll(matcher)) {
      const index = match.index ?? 0;
      matches.push({
        pattern,
        matchedText: match[0],
        index,
        line: lineNumberAt(text, index)
      });
    }
  }

  return matches.sort((left, right) => left.index - right.index);
}

export function validateBlockingResponseHasResolutionPath(text: string): BlockingResponseValidationResult {
  try {
    const parsed = JSON.parse(text) as unknown;
    const hasSpecificReason = hasSpecificReasonInObject(parsed);
    const resolution = hasResolutionPathInObject(parsed);
    return {
      valid: hasSpecificReason && resolution.hasResolutionPath,
      hasSpecificReason,
      hasResolutionPath: resolution.hasResolutionPath,
      pathKey: resolution.pathKey
    };
  } catch {
    const hasSpecificReason =
      /(?:^|[{\s,])["']?reason["']?\s*:\s*["'`][^"'`]{12,}["'`]/m.test(text);
    const hasResolutionPath =
      /(?:^|[{\s,])["']?(resolution_path|recovery_path)["']?\s*:\s*["'`][^"'`]{12,}["'`]/m.test(text);
    const pathKey = text.includes("resolution_path")
      ? "resolution_path"
      : text.includes("recovery_path")
        ? "recovery_path"
        : null;

    return {
      valid: hasSpecificReason && hasResolutionPath,
      hasSpecificReason,
      hasResolutionPath,
      pathKey
    };
  }
}

export function validateGenerationMode(mode: string | null | undefined): mode is ResponseGenerationMode {
  return APPROVED_RESPONSE_GENERATION_MODES.includes(mode as ResponseGenerationMode);
}

export function detectUnsafeConceptWordRedaction(sourceText: string): UnsafeConceptWordRedactionMatch[] {
  const matches: UnsafeConceptWordRedactionMatch[] = [];
  const lowercaseSource = sourceText.toLowerCase();

  for (const match of lowercaseSource.matchAll(REPLACE_CALL_REGEX)) {
    const regexLiteral = match[1] ?? "";
    const usesConceptWord = CONCEPT_WORDS.some((word) => regexLiteral.includes(word));
    if (!usesConceptWord) {
      continue;
    }

    const index = match.index ?? 0;
    const nearbySnippet = snippetAround(lowercaseSource, index);
    const hasCredentialLikeContext = CREDENTIAL_PATTERN_HINTS.some((hint) => nearbySnippet.includes(hint));
    if (hasCredentialLikeContext) {
      continue;
    }

    matches.push({
      snippet: snippetAround(sourceText, index).replace(/\s+/g, " ").trim(),
      index
    });
  }

  return matches;
}

export function calculateSimilarity(a: string, b: string): number {
  const left = normalizeForSimilarity(a);
  const right = normalizeForSimilarity(b);

  if (left === right) {
    return 1;
  }
  if (!left || !right) {
    return 0;
  }

  const leftBigrams = buildBigrams(left);
  const rightBigrams = buildBigrams(right);
  const rightCounts = new Map<string, number>();

  for (const bigram of rightBigrams) {
    rightCounts.set(bigram, (rightCounts.get(bigram) ?? 0) + 1);
  }

  let overlap = 0;
  for (const bigram of leftBigrams) {
    const count = rightCounts.get(bigram) ?? 0;
    if (count > 0) {
      overlap += 1;
      rightCounts.set(bigram, count - 1);
    }
  }

  return (2 * overlap) / (leftBigrams.length + rightBigrams.length);
}
