import { NextRequest, NextResponse } from "next/server";

import { type TenantLimits, type TenantMetadata, isTenantStatus } from "@/lib/tenants/model";
import {
  TENANT_STORAGE_MODE,
  createTenant,
  listDemoTenants,
  listTenants
} from "@/lib/tenants/service";

function asPlainRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : {};
}

function readTenantStatus(value: unknown) {
  return typeof value === "string" && isTenantStatus(value) ? value : undefined;
}

function readTenantLimits(value: unknown): Partial<TenantLimits> {
  return Object.fromEntries(
    Object.entries(asPlainRecord(value)).filter(([, entry]) =>
      typeof entry === "string" || typeof entry === "number" || typeof entry === "boolean" || entry === null
    )
  ) as Partial<TenantLimits>;
}

function readTenantMetadata(value: unknown): TenantMetadata {
  return Object.fromEntries(
    Object.entries(asPlainRecord(value)).filter(([, entry]) =>
      typeof entry === "string" || typeof entry === "number" || typeof entry === "boolean" || entry === null
    )
  ) as TenantMetadata;
}

export async function GET() {
  return NextResponse.json({
    storage_mode: TENANT_STORAGE_MODE,
    tenants: listTenants(),
    demo_tenants: listDemoTenants()
  });
}

export async function POST(request: NextRequest) {
  const body = asPlainRecord(await request.json().catch(() => ({})));

  if (typeof body.tenant_name !== "string" || !body.tenant_name.trim()) {
    return NextResponse.json(
      {
        status: "blocked",
        reason: "tenant_name is required to create a tenant record.",
        resolution_path: "POST a non-empty tenant_name to /api/v1/tenants before using tenant-scoped APIs."
      },
      { status: 400 }
    );
  }

  if (typeof body.status === "string" && !isTenantStatus(body.status)) {
    return NextResponse.json(
      {
        status: "blocked",
        reason: `Unsupported tenant status '${body.status}'.`,
        resolution_path: "Use one of: active, suspended, provisioning_required."
      },
      { status: 400 }
    );
  }

  const result = createTenant({
    tenant_name: body.tenant_name,
    owner_email: typeof body.owner_email === "string" ? body.owner_email : undefined,
    github_repo_full_name:
      typeof body.github_repo_full_name === "string" ? body.github_repo_full_name : undefined,
    status: readTenantStatus(body.status),
    limits: readTenantLimits(body.limits),
    metadata: readTenantMetadata(body.metadata)
  });

  return NextResponse.json(result, { status: 201 });
}
