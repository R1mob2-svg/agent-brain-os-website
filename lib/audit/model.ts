export interface AuditEvent {
  audit_id: string;
  tenant_id: string;
  actor_id: string;
  action: string;
  target_type: string;
  target_id: string;
  timestamp: string;
  summary: string;
  metadata: Record<string, unknown>;
  historical: true;
}

export interface CreateAuditEventInput {
  tenant_id: string;
  actor_id: string;
  action: string;
  target_type: string;
  target_id: string;
  summary: string;
  metadata?: Record<string, unknown>;
}
