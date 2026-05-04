import { NextResponse } from "next/server";

import { createOutboxReceipt, listOutboxReceipts } from "@/lib/message-bus/outbox";
import {
  MessageBusValidationError,
  OUTBOX_RECEIPT_STATUSES,
  OUTBOX_RECEIPT_VERDICTS,
  ReplayProtectionError,
  assertEnumValue,
  isRecord,
  optionalString,
  optionalStringArray,
  requireString
} from "@/lib/message-bus/model";

export const dynamic = "force-dynamic";

function validationErrorResponse(error: MessageBusValidationError) {
  return NextResponse.json(
    {
      error: error.code,
      message: error.message,
      ...listOutboxReceipts()
    },
    { status: 400 }
  );
}

function replayErrorResponse(error: ReplayProtectionError) {
  return NextResponse.json(
    {
      error: "replay_nonce_detected",
      message: error.message,
      ...listOutboxReceipts()
    },
    { status: 409 }
  );
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const payload = listOutboxReceipts({
    tenant_id: url.searchParams.get("tenant_id") ?? undefined,
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

    const statusValue = optionalString(body.status, "status");
    const receipt = createOutboxReceipt({
      tenant_id: requireString(body.tenant_id, "tenant_id"),
      source_agent_id: requireString(body.source_agent_id, "source_agent_id"),
      related_message_id: optionalString(body.related_message_id, "related_message_id"),
      status: statusValue ? assertEnumValue(statusValue, "status", OUTBOX_RECEIPT_STATUSES) : undefined,
      verdict: assertEnumValue(body.verdict, "verdict", OUTBOX_RECEIPT_VERDICTS),
      summary: requireString(body.summary, "summary"),
      proof_refs: optionalStringArray(body.proof_refs, "proof_refs"),
      nonce: requireString(body.nonce, "nonce")
    });

    return NextResponse.json(
      {
        ...listOutboxReceipts({
          tenant_id: receipt.tenant_id
        }),
        receipt
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
        message: "Outbox receipt submission failed in the MVP memory store.",
        ...listOutboxReceipts()
      },
      { status: 500 }
    );
  }
}
