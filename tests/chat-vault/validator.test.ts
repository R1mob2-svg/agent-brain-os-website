import { validateClaim } from "../../lib/chat-vault/validator";
import { ClaimType, ReceiptType, Verifiability, InterceptorMode, ClaimValidationStatus } from "../../lib/chat-vault/types";
import type { Claim, InterceptorRequest } from "../../lib/chat-vault/types";
import { writeFileSync, unlinkSync, mkdirSync, existsSync } from "fs";
import { join } from "path";

function assert(condition: boolean, message: string) {
  if (!condition) throw new Error(`Assertion failed: ${message}`);
}

const mockRequest: InterceptorRequest = {
  tenant_id: "rob",
  agent_id: "AG",
  session_id: "s1",
  raw_response: "{}",
  mode: InterceptorMode.GENERAL_CHAT,
  agent_writable_paths: ["agent_workspace/"],
  recently_modified_paths: ["docs/recent.md"],
  memory_retrievals: ["mem1"]
};

const baseClaim: Claim = {
  claim_id: "c1",
  claim_type: ClaimType.FACTUAL,
  claim_text: "Test",
  verifiability: Verifiability.VERIFIABLE,
  receipt: { type: ReceiptType.NONE }
};

async function runTests() {
  console.log("Running Validator Tests...");

  // Setup mock file for testing
  const testDir = join(process.cwd(), "docs");
  if (!existsSync(testDir)) mkdirSync(testDir, { recursive: true });
  const testFile = join(testDir, "test_allowlist.md");
  writeFileSync(testFile, "This is the expected_match string in the file.", "utf-8");

  try {
    // 1. FACTUAL + NONE -> rejected
    const res1 = await validateClaim(baseClaim, mockRequest);
    assert(res1.status === ClaimValidationStatus.REJECTED, "FACTUAL with NONE should be REJECTED");

    // 2. REASONING + NONE -> unverifiable
    const res2 = await validateClaim({ ...baseClaim, claim_type: ClaimType.REASONING }, mockRequest);
    assert(res2.status === ClaimValidationStatus.UNVERIFIABLE, "REASONING with NONE should be UNVERIFIABLE");

    // 3. FILE outside allowlist -> rejected
    const res3 = await validateClaim({
      ...baseClaim,
      receipt: { type: ReceiptType.FILE, path: "secrets/api.key", expected_match: "key" }
    }, mockRequest);
    assert(res3.status === ClaimValidationStatus.REJECTED, "FILE outside allowlist should be REJECTED");

    // 4. FILE inside allowlist + expected_match present -> verified
    const res4 = await validateClaim({
      ...baseClaim,
      receipt: { type: ReceiptType.FILE, path: "docs/test_allowlist.md", expected_match: "expected_match string" }
    }, mockRequest);
    assert(res4.status === ClaimValidationStatus.VERIFIED, "Valid allowlisted FILE should be VERIFIED");

    // 5. FILE inside allowlist + expected_match missing -> rejected
    const res5 = await validateClaim({
      ...baseClaim,
      receipt: { type: ReceiptType.FILE, path: "docs/test_allowlist.md", expected_match: "NOT_IN_FILE" }
    }, mockRequest);
    assert(res5.status === ClaimValidationStatus.REJECTED, "Missing expected_match should be REJECTED");

    // 6. Fake receipt path -> rejected
    const res6 = await validateClaim({
      ...baseClaim,
      receipt: { type: ReceiptType.FILE, path: "docs/does_not_exist.md", expected_match: "test" }
    }, mockRequest);
    assert(res6.status === ClaimValidationStatus.REJECTED, "Fake path should be REJECTED");

    // 7. Self-referential path -> rejected
    const res7 = await validateClaim({
      ...baseClaim,
      receipt: { type: ReceiptType.FILE, path: "agent_workspace/my_file.md", expected_match: "test" }
    }, mockRequest);
    assert(res7.status === ClaimValidationStatus.REJECTED, "Self-referential path should be REJECTED");

    // 8. Recently modified path -> rejected
    const res8 = await validateClaim({
      ...baseClaim,
      receipt: { type: ReceiptType.FILE, path: "docs/recent.md", expected_match: "test" }
    }, mockRequest);
    assert(res8.status === ClaimValidationStatus.REJECTED, "Recently modified path should be REJECTED");

    // 9. Tenant mismatch -> rejected
    const res9 = await validateClaim({
      ...baseClaim,
      receipt: { type: ReceiptType.FILE, path: "tenants/other_tenant/file.md", expected_match: "test" }
    }, mockRequest);
    assert(res9.status === ClaimValidationStatus.REJECTED, "Tenant mismatch should be REJECTED");

    // 10. Valid RETRIEVED -> verified
    const res10 = await validateClaim({
      ...baseClaim,
      claim_type: ClaimType.RETRIEVED,
      receipt: { type: ReceiptType.MEMORY, session_retrieval_id: "mem1" }
    }, mockRequest);
    assert(res10.status === ClaimValidationStatus.VERIFIED, "Valid RETRIEVED should be VERIFIED");

  } finally {
    if (existsSync(testFile)) unlinkSync(testFile);
  }

  console.log("Validator Tests Passed ✓");
}

runTests().catch(err => {
  console.error("Validator Tests Failed ❌", err);
  process.exit(1);
});
