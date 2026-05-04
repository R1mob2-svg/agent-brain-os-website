import assert from "node:assert/strict";

import { GET, POST } from "../app/api/v1/inbox/route";
import { resetInboxStore } from "../lib/message-bus/inbox";
import { INBOX_MESSAGE_STATUSES } from "../lib/message-bus/model";

async function main() {
  resetInboxStore();

  const createResponse = await POST(
    new Request("http://localhost/api/v1/inbox", {
      method: "POST",
      headers: {
        "content-type": "application/json"
      },
      body: JSON.stringify({
        tenant_id: "tenant-alpha",
        target_agent_id: "agent-codex",
        source_agent_id: "agent-neo",
        task_type: "audit",
        title: "Review inbox MVP",
        body: "Verify safe task intake and nonce replay protection.",
        nonce: "nonce-inbox-001"
      })
    })
  );

  assert.equal(createResponse.status, 201);
  const createdPayload = (await createResponse.json()) as {
    storage_mode: string;
    github_write: boolean;
    message: {
      status: string;
      nonce: string;
    };
    supported_statuses: string[];
  };

  assert.equal(createdPayload.storage_mode, "mvp_memory_store");
  assert.equal(createdPayload.github_write, false);
  assert.equal(createdPayload.message.status, "created");
  assert.equal(createdPayload.message.nonce, "nonce-inbox-001");
  assert.deepEqual(createdPayload.supported_statuses, [...INBOX_MESSAGE_STATUSES]);

  const listResponse = await GET(new Request("http://localhost/api/v1/inbox?tenant_id=tenant-alpha"));
  assert.equal(listResponse.status, 200);
  const listPayload = (await listResponse.json()) as {
    messages: Array<{
      tenant_id: string;
      target_agent_id: string;
    }>;
  };

  assert.equal(listPayload.messages.length, 1);
  assert.equal(listPayload.messages[0]?.tenant_id, "tenant-alpha");
  assert.equal(listPayload.messages[0]?.target_agent_id, "agent-codex");

  const replayResponse = await POST(
    new Request("http://localhost/api/v1/inbox", {
      method: "POST",
      headers: {
        "content-type": "application/json"
      },
      body: JSON.stringify({
        tenant_id: "tenant-alpha",
        target_agent_id: "agent-codex",
        task_type: "audit",
        title: "Replay should fail",
        body: "Same nonce must be rejected.",
        nonce: "nonce-inbox-001"
      })
    })
  );

  assert.equal(replayResponse.status, 409);
  const replayPayload = (await replayResponse.json()) as {
    error: string;
    github_write: boolean;
  };

  assert.equal(replayPayload.error, "replay_nonce_detected");
  assert.equal(replayPayload.github_write, false);

  console.log("PROOF_019_INBOX_MESSAGE_BUS PASSED");
}

void main();
