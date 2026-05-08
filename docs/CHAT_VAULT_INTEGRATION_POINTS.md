# Chat Vault V0.1 — Integration Points

> **STATUS: INTEGRATION_PENDING_WITH_EXACT_FILES**

This document outlines the required integration points for the Chat Vault V0.1 interceptor within the `agent-brain-os-website` repository.

Currently, the Chat Vault route (`app/api/chat-vault-interceptor/route.ts`) is fully built and tested, but it is **not yet wired into the existing agent response flows**. This is a deliberate, safe stopping point to ensure the interceptor works correctly before potentially disrupting live agent communications.

## Where Middleware/Interceptors Belong

To activate Chat Vault, the following architectural locations must be updated to route raw agent output through `POST /api/chat-vault-interceptor` before sending the final `display_response` to the client.

### 1. `app/api/v1/chat/route.ts` (or equivalent chat handler)
- **Current state:** Likely streams or returns raw LLM output directly to the UI.
- **Required change:** Instead of returning the raw LLM output, the handler must `POST` the raw string to the interceptor, passing the `tenant_id`, `agent_id`, `session_id`, and appropriate `mode` (e.g., `general_chat` or `protected_action`). The handler should then return the interceptor's `display_response` and `verification_footer` to the client.

### 2. `lib/agents/` (Core Agent Definitions)
- **Current state:** Agents may have system prompts that do not enforce the `vault_auth` structure.
- **Required change:** All protected agents must have their system prompts updated to mandate the exact `vault_auth` JSON schema defined in `CHAT_VAULT_SPEC.md`. If an agent fails to output this shape, the interceptor will flag it as `STRUCTURE_FAILURE`.

### 3. `lib/message-bus/` or `lib/librarian/` (Internal Message Passing)
- **Current state:** Agent-to-Agent (A2A) communications may happen directly.
- **Required change:** High-stakes A2A communications, especially those involving `production_data_write` or `founder_command`, should ideally pass through the interceptor to ensure claims passed between agents are verified against shared state.

### 4. UI Components (`app/page.tsx` or similar chat UI)
- **Current state:** Displays standard chat bubbles.
- **Required change:** The UI must be updated to explicitly display the `verification_footer` provided by the interceptor. If a message is `PARTIALLY_VERIFIED` or triggers a fail-open warning, the UI must display this prominently (e.g., with a warning color or icon) so the user is aware the response contains unverified claims.

## Next Steps

1. Review these integration points.
2. Update the base Agent system prompt to enforce the `vault_auth` JSON schema.
3. Wire a single, non-critical test agent through the interceptor.
4. Verify end-to-end functionality in a staging environment before rolling out to protected actions or founder commands.
