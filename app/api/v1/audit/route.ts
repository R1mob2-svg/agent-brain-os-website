import { NextResponse } from "next/server";

import { createAuditEvent, listAuditEvents } from "@/lib/audit/service";
import { MessageBusValidationError, isRecord, requireString } from "@/lib/message-bus/model";

export const dynamic = "force-dynamic";

function validationErrorResponse(error: MessageBusValidationError) {
  return NextResponse.json(
    {
      error: error.code,
      message: error.message,
      ...listAuditEvents()
    },
    { status: 400 }
  );
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const payload = listAuditEvents({
    tenant_id: url.searchParams.get("tenant_id") ?? undefined,
    actor_id: url.searchParams.get("actor_id") ?? undefined,
    target_id: url.searchParams.get("target_id") ?? undefined
  });

  return NextResponse.json(payload);
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    if (!isRecord(body)) {
      throw new MessageBusValidationError("invalid_request", "Request body must be a JSON object.");
    }

    const metadata = body.metadata;
    if (metadata !== undefined && !isRecord(metadata)) {
      throw new MessageBusValidationError("invalid_request", "metadata must be a JSON object when provided.");
    }

    const event = createAuditEvent({
      tenant_id: requireString(body.tenant_id, "tenant_id"),
      actor_id: requireString(body.actor_id, "actor_id"),
      action: requireString(body.action, "action"),
      target_type: requireString(body.target_type, "target_type"),
      target_id: requireString(body.target_id, "target_id"),
      summary: requireString(body.summary, "summary"),
      metadata
    });

    return NextResponse.json(
      {
        ...listAuditEvents({
          tenant_id: event.tenant_id
        }),
        event
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof MessageBusValidationError) {
      return validationErrorResponse(error);
    }

    return NextResponse.json(
      {
        error: "internal_error",
        message: "Audit event creation failed in the MVP memory store.",
        ...listAuditEvents()
      },
      { status: 500 }
    );
  }
}
