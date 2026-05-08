export interface GeminexIntegrationPhase {
  order: number;
  title: string;
  summary: string;
  success_receipt: string;
}

export interface GeminexRequiredEndpoint {
  path: string;
  purpose: string;
  status: "existing" | "planned_not_implemented";
}

export interface GeminexIntegrationPlan {
  integration_status: "not_integrated";
  current_state: string;
  target_state: string;
  required_endpoints: GeminexRequiredEndpoint[];
  required_secrets_or_config: string[];
  required_receipts: string[];
  rollback_plan: string[];
  phases: GeminexIntegrationPhase[];
  no_fake_integration_claim: string;
}

const GEMINEX_PHASES: GeminexIntegrationPhase[] = [
  {
    order: 1,
    title: "Create internal Rob tenant",
    summary: "Create the first internal tenant boundary for Rob before any Geminex customer cutover.",
    success_receipt: "tenant_created_with_internal_scope"
  },
  {
    order: 2,
    title: "Generate Geminex API key",
    summary: "Issue a bounded customer key that belongs to the Geminex tenant instead of reusing direct repo access.",
    success_receipt: "geminex_api_key_issued_and_scoped"
  },
  {
    order: 3,
    title: "Replace direct GitHub brain reads with Agent Brain OS context-pack API",
    summary: "Move Geminex from direct GitHub reads to a bounded API surface that returns only approved context packs.",
    success_receipt: "context_pack_cutover_proved"
  },
  {
    order: 4,
    title: "Submit Geminex run receipts to outbox API",
    summary: "Send Geminex run receipts into Agent Brain OS so execution truth is visible without reading raw repo state.",
    success_receipt: "outbox_receipt_submission_proved"
  },
  {
    order: 5,
    title: "Verify retrieval logs and exclusions",
    summary: "Prove the retrieval log, exclusions, and safety boundaries still hold after Geminex starts consuming the API.",
    success_receipt: "retrieval_log_and_exclusion_proof_green"
  },
  {
    order: 6,
    title: "Gate production use behind proof",
    summary: "Do not allow production use until the tenant, key, retrieval, and receipt proofs all pass from the active tree.",
    success_receipt: "production_gate_proof_green"
  }
];

export function buildGeminexIntegrationPlan(): GeminexIntegrationPlan {
  return {
    integration_status: "not_integrated",
    current_state:
      "Geminex is not integrated yet. It does not consume Agent Brain OS through a customer API in this branch.",
    target_state:
      "Geminex consumes Agent Brain OS via API for bounded context packs and submits receipts back through a governed outbox lane.",
    required_endpoints: [
      {
        path: "GET /api/librarian/health",
        purpose: "Expose the current bounded Librarian health truth.",
        status: "existing"
      },
      {
        path: "GET /api/librarian/release-receipt",
        purpose: "Expose the MVP receipt and non-SaaS truth boundary.",
        status: "existing"
      },
      {
        path: "POST /api/librarian/context-pack",
        purpose: "Return bounded context packs so Geminex can stop reading the GitHub brain directly.",
        status: "planned_not_implemented"
      },
      {
        path: "POST /api/librarian/outbox/receipts",
        purpose: "Accept Geminex run receipts and keep execution truth inside Agent Brain OS.",
        status: "planned_not_implemented"
      }
    ],
    required_secrets_or_config: [
      "GEMINEX_TENANT_ID",
      "GEMINEX_API_KEY",
      "AGENT_BRAIN_OS_BASE_URL",
      "retrieval root allowlist",
      "retrieval exclusion list",
      "outbox receipt signing secret"
    ],
    required_receipts: [
      "tenant creation receipt",
      "Geminex API key issuance receipt",
      "context-pack response proof",
      "outbox receipt acceptance proof",
      "retrieval log and exclusion proof",
      "production gate proof"
    ],
    rollback_plan: [
      "Keep the current direct-read Geminex path available until the API cutover is proven.",
      "Revoke the Geminex API key immediately if retrieval scope, exclusion rules, or receipt integrity fail.",
      "Switch Geminex back to the current direct-read workflow if the API path cannot prove parity.",
      "Leave production use disabled until the proof set is green again."
    ],
    phases: GEMINEX_PHASES,
    no_fake_integration_claim:
      "No fake integration claim. Geminex is a planned first customer, not an already integrated customer in this branch."
  };
}
