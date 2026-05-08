import { NextResponse } from "next/server";
import type { InterceptorRequest, InterceptorResponse } from "../../../lib/chat-vault/types";
import { DecisionVerdict } from "../../../lib/chat-vault/types";
import { parseAgentResponse } from "../../../lib/chat-vault/parser";
import { validateClaimsWithTimeout } from "../../../lib/chat-vault/validator";
import { evaluateDecision } from "../../../lib/chat-vault/decision";
import { LocalFsAuditLogger, createAuditEntry } from "../../../lib/chat-vault/audit-logger";
import { loadPolicy } from "../../../lib/chat-vault/allowlist";

/**
 * POST /api/chat-vault-interceptor
 * Intercepts, parses, and validates agent responses before they reach the user.
 */
export async function POST(req: Request) {
  const totalStartMs = performance.now();
  let parseEndMs = 0;
  let validationEndMs = 0;
  let decisionEndMs = 0;

  try {
    const requestBody = (await req.json()) as InterceptorRequest;
    
    // Basic structural validation of the interceptor request itself
    if (!requestBody.tenant_id || !requestBody.agent_id || !requestBody.session_id || !requestBody.raw_response) {
      return NextResponse.json(
        { error: "Invalid interceptor request body" },
        { status: 400 }
      );
    }

    const policy = loadPolicy();

    // 1. Parse
    const parseStart = performance.now();
    const parseOutcome = parseAgentResponse(requestBody.raw_response);
    parseEndMs = performance.now() - parseStart;

    if (!parseOutcome.ok) {
      const fallbackResponse: InterceptorResponse = {
        decision: DecisionVerdict.STRUCTURE_FAILURE,
        display_response: null,
        verification_footer: "❌ Blocked by Chat Vault: Agent failed to produce valid vault_auth structure.",
        claims: [],
        blocked_reasons: [parseOutcome.reason],
        audit_id: "pending"
      };
      
      const auditEndMs = performance.now();
      const logger = new LocalFsAuditLogger();
      const auditEntry = createAuditEntry(requestBody.raw_response, null, {
        tenant_id: requestBody.tenant_id,
        agent_id: requestBody.agent_id,
        session_id: requestBody.session_id,
        response_id: crypto.randomUUID(), // Failed structure might not have a response_id inside it
        timestamp: new Date().toISOString(),
        parsed_vault_auth: null,
        claim_validation_outcomes: [],
        timing_breakdown: {
          parse_ms: Math.round(parseEndMs),
          validation_ms: 0,
          decision_ms: 0,
          audit_write_ms: Math.round(auditEndMs - performance.now()),
          total_ms: Math.round(performance.now() - totalStartMs)
        },
        final_decision: DecisionVerdict.STRUCTURE_FAILURE,
        blocked_reasons: fallbackResponse.blocked_reasons,
        mode: requestBody.mode
      });
      
      fallbackResponse.audit_id = auditEntry.audit_id;
      await logger.log(auditEntry);
      
      return NextResponse.json(fallbackResponse);
    }

    const { parsed } = parseOutcome;
    const responseId = parsed.vault_auth.response_id;

    // 2. Validate
    const validationStart = performance.now();
    const claims = parsed.vault_auth.claims_made || [];
    const { outcomes, timedOut } = await validateClaimsWithTimeout(
      claims,
      requestBody,
      policy.latency_budget_ms
    );
    validationEndMs = performance.now() - validationStart;

    // 3. Decision
    const decisionStart = performance.now();
    const decision = evaluateDecision(parsed, outcomes, timedOut, requestBody);
    decisionEndMs = performance.now() - decisionStart;

    // 4. Audit
    const auditStart = performance.now();
    const logger = new LocalFsAuditLogger();
    
    const finalResponse: InterceptorResponse = {
      decision: decision.verdict,
      display_response: decision.display_response,
      verification_footer: decision.verification_footer,
      claims: outcomes,
      blocked_reasons: decision.blocked_reasons,
      audit_id: "pending"
    };

    const auditEntry = createAuditEntry(requestBody.raw_response, decision.display_response, {
      tenant_id: requestBody.tenant_id,
      agent_id: requestBody.agent_id,
      session_id: requestBody.session_id,
      response_id: responseId,
      timestamp: parsed.vault_auth.timestamp,
      parsed_vault_auth: parsed.vault_auth,
      claim_validation_outcomes: outcomes,
      timing_breakdown: {
        parse_ms: Math.round(parseEndMs),
        validation_ms: Math.round(validationEndMs),
        decision_ms: Math.round(decisionEndMs),
        audit_write_ms: 0, // Set after write
        total_ms: 0 // Set after write
      },
      final_decision: decision.verdict,
      blocked_reasons: decision.blocked_reasons,
      mode: requestBody.mode
    });

    finalResponse.audit_id = auditEntry.audit_id;
    
    const auditEndMs = performance.now() - auditStart;
    auditEntry.timing_breakdown.audit_write_ms = Math.round(auditEndMs);
    auditEntry.timing_breakdown.total_ms = Math.round(performance.now() - totalStartMs);
    
    await logger.log(auditEntry);

    // 5. Respond
    return NextResponse.json(finalResponse);

  } catch (error: unknown) {
    const errObj = error instanceof Error ? error : new Error(String(error));
    return NextResponse.json(
      { error: "Internal Server Error in Chat Vault Interceptor", details: errObj.message },
      { status: 500 }
    );
  }
}
