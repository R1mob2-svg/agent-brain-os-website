import assert from "node:assert/strict";

import { GET, POST } from "../app/api/v1/outbox/route";
import { OUTBOX_RECEIPT_VERDICTS } from "../lib/message-bus/model";
import { resetOutboxStore } from "../lib/message-bus/outbox";

async function main() {
  resetOutboxStore();

  for (const [index, verdict] of OUTBOX_RECEIPT_VERDICTS.entries()) {
    const createResponse = await POST(
      new Request("http://localhost/api/v1/outbox", {
        method: "POST",
        headers: {
          "content-type": "application/json"
        },
        body: JSON.stringify({
          tenant_id: "tenant-alpha",
          source_agent_id: "agent-codex",
          related_message_id: "message-001",
          status: index === 0 ? "submitted" : "accepted",
          verdict,
          summary: `Receipt for ${verdict}`,
          proof_refs: [`proof-${index + 1}`],
          nonce: `nonce-outbox-00${index + 1}`
        })
      })
    );

    assert.equal(createResponse.status, 201);
    const payload = (await createResponse.json()) as {
      historical: boolean;
      current_state_claim: boolean;
      receipt: {
        verdict: string;
        historical: boolean;
      };
    };

    assert.equal(payload.historical, true);
    assert.equal(payload.current_state_claim, false);
    assert.equal(payload.receipt.verdict, verdict);
    assert.equal(payload.receipt.historical, true);
  }

  const listResponse = await GET(new Request("http://localhost/api/v1/outbox?tenant_id=tenant-alpha"));
  assert.equal(listResponse.status, 200);
  const listPayload = (await listResponse.json()) as {
    receipts: Array<{ verdict: string }>;
    supported_verdicts: string[];
  };

  assert.equal(listPayload.receipts.length, 4);
  assert.deepEqual(listPayload.supported_verdicts, [...OUTBOX_RECEIPT_VERDICTS]);

  const invalidVerdictResponse = await POST(
    new Request("http://localhost/api/v1/outbox", {
      method: "POST",
      headers: {
        "content-type": "application/json"
      },
      body: JSON.stringify({
        tenant_id: "tenant-alpha",
        source_agent_id: "agent-codex",
        verdict: "READY",
        summary: "This verdict should be rejected.",
        proof_refs: [],
        nonce: "nonce-outbox-invalid"
      })
    })
  );

  assert.equal(invalidVerdictResponse.status, 400);

  const replayResponse = await POST(
    new Request("http://localhost/api/v1/outbox", {
      method: "POST",
      headers: {
        "content-type": "application/json"
      },
      body: JSON.stringify({
        tenant_id: "tenant-alpha",
        source_agent_id: "agent-codex",
        verdict: "PASS",
        summary: "Replay should be rejected.",
        proof_refs: ["proof-replay"],
        nonce: "nonce-outbox-001"
      })
    })
  );

  assert.equal(replayResponse.status, 409);
  const replayPayload = (await replayResponse.json()) as {
    error: string;
  };

  assert.equal(replayPayload.error, "replay_nonce_detected");

  console.log("PROOF_020_OUTBOX_RECEIPTS PASSED");
}

void main();
