import assert from "node:assert/strict";

import { GET, POST } from "../app/api/v1/audit/route";
import * as auditService from "../lib/audit/service";

async function main() {
  auditService.resetAuditStore();

  const createResponse = await POST(
    new Request("http://localhost/api/v1/audit", {
      method: "POST",
      headers: {
        "content-type": "application/json"
      },
      body: JSON.stringify({
        tenant_id: "tenant-alpha",
        actor_id: "agent-codex",
        action: "queue_reviewed",
        target_type: "inbox_message",
        target_id: "message-001",
        summary: "Manual MVP audit event creation for proof coverage.",
        metadata: {
          mode: "proof",
          actor_lane: "chat-4"
        }
      })
    })
  );

  assert.equal(createResponse.status, 201);
  const createdPayload = (await createResponse.json()) as {
    historical: boolean;
    current_state_claim: boolean;
    event: {
      historical: boolean;
    };
  };

  assert.equal(createdPayload.historical, true);
  assert.equal(createdPayload.current_state_claim, false);
  assert.equal(createdPayload.event.historical, true);

  const listResponse = await GET(new Request("http://localhost/api/v1/audit?tenant_id=tenant-alpha"));
  assert.equal(listResponse.status, 200);
  const listPayload = (await listResponse.json()) as {
    events: Array<{ action: string; historical: boolean }>;
  };

  assert.equal(listPayload.events.length, 1);
  assert.equal(listPayload.events[0]?.action, "queue_reviewed");
  assert.equal(listPayload.events[0]?.historical, true);
  assert.ok(!("buildCurrentStateFromAudit" in auditService));

  console.log("PROOF_021_AUDIT_HISTORICAL_ONLY PASSED");
}

void main();
