import { NextResponse } from "next/server";

import { createInboxMessage, listInboxMessages } from "@/lib/message-bus/inbox";
import {
  MessageBusValidationError,
  ReplayProtectionError,
  isRecord,
  optionalString,
  requireString
} from "@/lib/message-bus/model";

export const dynamic = "force-dynamic";

function validationErrorResponse(error: MessageBusValidationError) {
  return NextResponse.json(
    {
      error: error.code,
      message: error.message,
      ...listInboxMessages()
    },
    { status: 400 }
  );
}

function replayErrorResponse(error: ReplayProtectionError) {
  return NextResponse.json(
    {
      error: "replay_nonce_detected",
      message: error.message,
      ...listInboxMessages()
    },
    { status: 409 }
  );
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const payload = listInboxMessages({
    tenant_id: url.searchParams.get("tenant_id") ?? undefined,
    target_agent_id: url.searchParams.get("target_agent_id") ?? undefined,
    source_agent_id: url.searchParams.get("source_agent_id") ?? undefined
  });

  return NextResponse.json(payload);
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    if (!isRecord(body)) {
      throw new MessageBusValidationError("invalid_request", "Request body must be a JSON object.");
    }

    const message = createInboxMessage({
      tenant_id: requireString(body.tenant_id, "tenant_id"),
      target_agent_id: requireString(body.target_agent_id, "target_agent_id"),
      source_agent_id: optionalString(body.source_agent_id, "source_agent_id"),
      task_type: requireString(body.task_type, "task_type"),
      title: requireString(body.title, "title"),
      body: requireString(body.body, "body"),
      nonce: requireString(body.nonce, "nonce")
    });

    return NextResponse.json(
      {
        ...listInboxMessages({
          tenant_id: message.tenant_id
        }),
        message
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof ReplayProtectionError) {
      return replayErrorResponse(error);
    }

    if (error instanceof MessageBusValidationError) {
      return validationErrorResponse(error);
    }

    return NextResponse.json(
      {
        error: "internal_error",
        message: "Inbox message creation failed in the MVP memory store.",
        ...listInboxMessages()
      },
      { status: 500 }
    );
  }
}
