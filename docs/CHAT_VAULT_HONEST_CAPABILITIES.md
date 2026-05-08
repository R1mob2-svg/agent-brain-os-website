# Chat Vault V0.1 — Honest Capabilities

The Chat Vault is a runtime interception layer designed to reduce unsupported or fabricated factual claims made by autonomous agents during chat interactions. It acts as a structural and verifiable gate before agent output reaches the user.

## What Chat Vault DOES

1. **Reduces Unsupported Claims:** It requires agents to provide a machine-readable `vault_auth` payload alongside their natural language response. If a factual claim is made, it must cite a specific, allowlisted receipt (e.g., an existing file path, API response, or specific session memory retrieval) and an `expected_match` string that the Vault can verify independently.
2. **Blocks Fabrication (Hallucination) at the Source:** If an agent cites a file that doesn't exist, a file that it recently modified (self-referential proof), or provides an `expected_match` string not found in the cited source, the response is rejected or flagged depending on the interaction mode.
3. **Forces Structured Uncertainty:** It requires agents to explicitly acknowledge `claims_not_made` and `uncertainty_acknowledged`, forcing the model to explicitly state what it does not know.
4. **Maintains an Immutable Audit Log:** Every decision, including structural failures and rejected claims, is logged to the filesystem with hashing to ensure the raw response cannot be retroactively altered or deleted without detection.

## What Chat Vault DOES NOT DO (Honest Limits)

1. **It does not guarantee absolute truth.** It only verifies that a claim made by the agent aligns with an allowed source document. If the source document itself contains incorrect information, the Chat Vault will still verify it as "correct" against that source.
2. **It cannot prove claims that no allowed source can verify.** If an agent needs to state a novel fact that isn't in an allowlisted document, it cannot do so as a `FACTUAL` claim without failing validation. The agent must use `REASONING` or `SUBJECTIVE` claim types, which the user is warned about.
3. **It can be bypassed if not strictly integrated.** The Chat Vault relies entirely on honest routing. If agents are allowed to bypass the interceptor and write directly to a UI surface, the Vault provides zero protection.
4. **It should always be paired with ASIOD V4.** Chat Vault handles *chat responses*. It does not govern code generation, PR creation, or automated system changes. ASIOD V4 is the required static gate for code changes; Chat Vault is the required runtime gate for chat.
5. **It is not perfect (Catch Range).** Expected practical catch range of subtle hallucinations is not 99%. While structural verification catches blatant lies and fake citations, it may miss nuanced misinterpretations of valid `expected_match` strings. High-stakes outputs still require human review.

## Conclusion

Chat Vault provides a verifiable "scoreboard" outside the agent's control, actively combatting the phenomenon of agents faking test passes or modifying their own measurement systems. However, it is a tool for *containment* and *verification*, not an absolute guarantee of factual correctness.
