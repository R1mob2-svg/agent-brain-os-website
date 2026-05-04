import { NextRequest, NextResponse } from "next/server";

import {
  API_KEY_STORAGE_MODE,
  createApiKey,
  listApiKeysForTenant
} from "@/lib/api-keys/service";
import { getTenantById } from "@/lib/tenants/service";

interface TenantKeyRouteContext {
  params: Promise<{
    tenantId: string;
  }>;
}

function asPlainRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : {};
}

export async function GET(_request: NextRequest, context: TenantKeyRouteContext) {
  const { tenantId } = await context.params;

  if (!getTenantById(tenantId)) {
    return NextResponse.json(
      {
        status: "blocked",
        reason: `Tenant '${tenantId}' does not exist, so no API keys can be listed.`,
        resolution_path: "Create the tenant first via /api/v1/tenants before querying tenant API keys."
      },
      { status: 404 }
    );
  }

  return NextResponse.json({
    storage_mode: API_KEY_STORAGE_MODE,
    tenant_id: tenantId,
    keys: listApiKeysForTenant(tenantId)
  });
}

export async function POST(request: NextRequest, context: TenantKeyRouteContext) {
  const { tenantId } = await context.params;
  const body = asPlainRecord(await request.json().catch(() => ({})));
  const scopes = Array.isArray(body.scopes) ? body.scopes.filter((scope) => typeof scope === "string") : [];

  const result = createApiKey({
    tenant_id: tenantId,
    agent_id: typeof body.agent_id === "string" ? body.agent_id : undefined,
    scopes
  });

  if (!result.ok) {
    const status = result.code === "missing_tenant" ? 404 : 400;
    return NextResponse.json(result, { status });
  }

  return NextResponse.json(result, { status: 201 });
}
