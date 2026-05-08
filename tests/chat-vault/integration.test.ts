import { POST } from "../../app/api/chat-vault-interceptor/route";
import { InterceptorMode, DecisionVerdict } from "../../lib/chat-vault/types";

function assert(condition: boolean, message: string) {
  if (!condition) throw new Error(`Assertion failed: ${message}`);
}

async function runTests() {
  console.log("Running Integration Tests...");

  const validRaw = JSON.stringify({
    vault_auth: {
      agent_id: "AG",
      session_id: "s1",
      response_id: "r1",
      timestamp: new Date().toISOString(),
      claims_made: [],
      claims_not_made: [],
      uncertainty_acknowledged: []
    },
    response: "Hello integration"
  });

  const requestObj = {
    tenant_id: "rob",
    agent_id: "AG",
    session_id: "s1",
    raw_response: validRaw,
    mode: InterceptorMode.GENERAL_CHAT
  };

  const req = new Request("http://localhost/api/chat-vault-interceptor", {
    method: "POST",
    body: JSON.stringify(requestObj)
  });

  const res = await POST(req);
  assert(res.status === 200, "Should return 200 OK");
  
  const body = await res.json();
  
  assert(body.decision === DecisionVerdict.PARTIALLY_VERIFIED || body.decision === DecisionVerdict.FULLY_VERIFIED, "Empty claims should be at least partially verified");
  assert(body.display_response === "Hello integration", "Response should be preserved");
  assert(body.audit_id && body.audit_id !== "pending", "Audit ID should be generated");

  console.log("Integration Tests Passed ✓");
}

runTests().catch(err => {
  console.error("Integration Tests Failed ❌", err);
  process.exit(1);
});
