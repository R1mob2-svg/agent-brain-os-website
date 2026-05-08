/**
 * Chat Vault V0.1 — Audit Logger
 * Append-only audit logger for tracking interceptor decisions.
 */

import { mkdir, writeFile } from "fs/promises";
import { join } from "path";
import { createHash } from "crypto";
import type { AuditEntry } from "./types";
import { loadPolicy } from "./allowlist";

export interface AuditLoggerAdapter {
  log(entry: AuditEntry): Promise<void>;
}

function hashString(input: string): string {
  return createHash("sha256").update(input).digest("hex");
}

export class LocalFsAuditLogger implements AuditLoggerAdapter {
  private async ensureDirectory(dateStr: string): Promise<string> {
    const dirPath = join(process.cwd(), "audit-log", "chat-vault", dateStr);
    try {
      await mkdir(dirPath, { recursive: true });
    } catch (err: unknown) {
      // Ignore if exists
      const e = err as NodeJS.ErrnoException;
      if (e.code !== "EEXIST") throw e;
    }
    return dirPath;
  }

  async log(entry: AuditEntry): Promise<void> {
    const policy = loadPolicy();
    if (!policy.audit_logging_enabled) return;

    // Sanitize raw data based on policy
    const safeEntry = { ...entry };
    
    if (policy.raw_response_storage_mode === "hash_only") {
      // The entry already contains hashes, but we ensure we don't accidentally
      // log the raw response anywhere else if added later.
    }

    const dateStr = new Date().toISOString().split("T")[0];
    const dirPath = await this.ensureDirectory(dateStr);
    const filePath = join(dirPath, `${entry.response_id}.json`);

    const fileContent = JSON.stringify(safeEntry, null, 2);
    
    // Append-only simulation (write new file per response_id)
    await writeFile(filePath, fileContent, { flag: "wx", encoding: "utf-8" }).catch(err => {
      // If file exists, we don't overwrite (immutable audit log principle)
      if (err.code !== "EEXIST") {
        throw err;
      }
    });
  }
}

export function createAuditEntry(
  rawResponse: string,
  displayResponse: string | null,
  partialEntry: Omit<AuditEntry, "raw_response_hash" | "display_response_hash" | "audit_id">
): AuditEntry {
  return {
    audit_id: crypto.randomUUID(),
    raw_response_hash: hashString(rawResponse),
    display_response_hash: displayResponse ? hashString(displayResponse) : null,
    ...partialEntry
  };
}
