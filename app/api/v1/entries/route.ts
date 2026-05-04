import { NextRequest, NextResponse } from "next/server";

import {
  type BrainEntrySensitivity,
  type BrainEntryStatus,
  type HandoffDeliveryStatus,
  isBrainEntryClass,
  isBrainEntrySensitivity,
  isBrainEntryStatus,
  isHandoffDeliveryStatus
} from "@/lib/brain-entry-schema/model";
import {
  BRAIN_ENTRY_STORAGE_MODE,
  listDemoBrainEntries,
  listStagedBrainEntries,
  stageBrainEntry
} from "@/lib/brain-entry-schema/validation";

function readStringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((entry): entry is string => typeof entry === "string") : [];
}

function readEntryStatus(value: unknown): BrainEntryStatus | undefined {
  return typeof value === "string" && isBrainEntryStatus(value) ? value : undefined;
}

function readEntrySensitivity(value: unknown): BrainEntrySensitivity | undefined {
  return typeof value === "string" && isBrainEntrySensitivity(value) ? value : undefined;
}

function readDeliveryStatus(value: unknown): HandoffDeliveryStatus | undefined {
  return typeof value === "string" && isHandoffDeliveryStatus(value) ? value : undefined;
}

export async function GET() {
  return NextResponse.json({
    storage_mode: BRAIN_ENTRY_STORAGE_MODE,
    staged_entries: listStagedBrainEntries(),
    demo_entries: listDemoBrainEntries()
  });
}

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;

  if (typeof body.class !== "string" || !isBrainEntryClass(body.class)) {
    return NextResponse.json(
      {
        status: "blocked",
        reason: "A valid entry class is required: Doctrine, Lesson, Receipt, Handoff, or Memory.",
        resolution_path: "Provide one of the supported entry classes and retry the staged-only entry submission."
      },
      { status: 400 }
    );
  }

  if (typeof body.tenant_id !== "string" || !body.tenant_id.trim()) {
    return NextResponse.json(
      {
        status: "blocked",
        reason: "tenant_id is required for staged entry validation.",
        resolution_path: "Provide a tenant_id from /api/v1/tenants before staging an entry."
      },
      { status: 400 }
    );
  }

  if (typeof body.title !== "string" || typeof body.body !== "string") {
    return NextResponse.json(
      {
        status: "blocked",
        reason: "title and body are required string fields for every staged entry.",
        resolution_path: "Provide string values for title and body, then retry the staged-only entry submission."
      },
      { status: 400 }
    );
  }

  if (typeof body.status === "string" && !isBrainEntryStatus(body.status)) {
    return NextResponse.json(
      {
        status: "blocked",
        reason: `Unsupported entry status '${body.status}'.`,
        resolution_path: "Use one of: active, superseded, stale, archived."
      },
      { status: 400 }
    );
  }

  if (typeof body.sensitivity === "string" && !isBrainEntrySensitivity(body.sensitivity)) {
    return NextResponse.json(
      {
        status: "blocked",
        reason: `Unsupported sensitivity '${body.sensitivity}'.`,
        resolution_path: "Use one of: public, internal, private, restricted."
      },
      { status: 400 }
    );
  }

  if (typeof body.delivery_status === "string" && !isHandoffDeliveryStatus(body.delivery_status)) {
    return NextResponse.json(
      {
        status: "blocked",
        reason: `Unsupported delivery_status '${body.delivery_status}'.`,
        resolution_path: "Use one of: pending, delivered, expired."
      },
      { status: 400 }
    );
  }

  const result = stageBrainEntry({
    tenant_id: body.tenant_id,
    workspace_id: typeof body.workspace_id === "string" ? body.workspace_id : undefined,
    class: body.class,
    title: body.title,
    body: body.body,
    status: readEntryStatus(body.status),
    source_agent: typeof body.source_agent === "string" ? body.source_agent : undefined,
    proof_reference: typeof body.proof_reference === "string" ? body.proof_reference : undefined,
    supersedes: typeof body.supersedes === "string" ? body.supersedes : undefined,
    sensitivity: readEntrySensitivity(body.sensitivity),
    tags: readStringArray(body.tags),
    delivery_status: readDeliveryStatus(body.delivery_status),
    expires_at: typeof body.expires_at === "string" ? body.expires_at : undefined
  });

  if (!result.ok) {
    const status = result.code === "missing_tenant" ? 404 : 400;
    return NextResponse.json(result, { status });
  }

  return NextResponse.json(result, { status: 201 });
}
