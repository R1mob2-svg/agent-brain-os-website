import { NextRequest, NextResponse } from "next/server";

import {
  type AgentStatus,
  type AgentTrustLevel,
  isAgentStatus,
  isAgentTrustLevel
} from "@/lib/agents/model";
import {
  AGENT_STORAGE_MODE,
  listAgents,
  listDemoAgents,
  registerAgentIdentity
} from "@/lib/agents/service";

function readStringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((entry): entry is string => typeof entry === "string") : [];
}

function readTrustLevel(value: unknown): AgentTrustLevel | undefined {
  return typeof value === "string" && isAgentTrustLevel(value) ? value : undefined;
}

function readAgentStatus(value: unknown): AgentStatus | undefined {
  return typeof value === "string" && isAgentStatus(value) ? value : undefined;
}

export async function GET() {
  return NextResponse.json({
    storage_mode: AGENT_STORAGE_MODE,
    agents: listAgents(),
    demo_agents: listDemoAgents()
  });
}

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;

  if (typeof body.tenant_id !== "string" || !body.tenant_id.trim()) {
    return NextResponse.json(
      {
        status: "blocked",
        reason: "tenant_id is required for tenant-scoped agent registration.",
        resolution_path: "Provide a valid tenant_id from /api/v1/tenants before registering an agent identity."
      },
      { status: 400 }
    );
  }

  if (typeof body.display_name !== "string" || !body.display_name.trim()) {
    return NextResponse.json(
      {
        status: "blocked",
        reason: "display_name is required for agent registration.",
        resolution_path: "Provide a non-empty display_name and retry the tenant-scoped agent registration."
      },
      { status: 400 }
    );
  }

  if (typeof body.role !== "string" || !body.role.trim()) {
    return NextResponse.json(
      {
        status: "blocked",
        reason: "role is required for agent registration.",
        resolution_path: "Provide a non-empty role and retry the tenant-scoped agent registration."
      },
      { status: 400 }
    );
  }

  if (typeof body.trust_level === "string" && !isAgentTrustLevel(body.trust_level)) {
    return NextResponse.json(
      {
        status: "blocked",
        reason: `Unsupported trust_level '${body.trust_level}'.`,
        resolution_path: "Use one of: low, standard, elevated."
      },
      { status: 400 }
    );
  }

  if (typeof body.status === "string" && !isAgentStatus(body.status)) {
    return NextResponse.json(
      {
        status: "blocked",
        reason: `Unsupported agent status '${body.status}'.`,
        resolution_path: "Use one of: active, suspended."
      },
      { status: 400 }
    );
  }

  const result = registerAgentIdentity({
    tenant_id: body.tenant_id,
    display_name: body.display_name,
    role: body.role,
    allowed_operations: readStringArray(body.allowed_operations),
    forbidden_operations: readStringArray(body.forbidden_operations),
    allowed_paths: readStringArray(body.allowed_paths),
    blocked_paths: readStringArray(body.blocked_paths),
    trust_level: readTrustLevel(body.trust_level),
    status: readAgentStatus(body.status)
  });

  if (!result.ok) {
    const status = result.code === "missing_tenant" ? 404 : 409;
    return NextResponse.json(result, { status });
  }

  return NextResponse.json(result, { status: 201 });
}
