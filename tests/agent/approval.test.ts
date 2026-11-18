import { describe, it, expect } from 'vitest';
import { DraftAction, AuditEvent } from '@/types';

function approveDraftAction(
  action: DraftAction,
  actor: 'HUMAN' = 'HUMAN',
  timestamp = new Date().toISOString()
): { updatedAction: DraftAction; auditEvent: AuditEvent } {
  const updatedAction: DraftAction = {
    ...action,
    approvalStatus: 'APPROVED',
    approvedAt: timestamp,
  };

  const auditEvent: AuditEvent = {
    id: `evt-appr-${action.id}-${Date.now()}`,
    timestamp,
    type: 'ACTION_APPROVED',
    actor,
    actionId: action.id,
    summary: `Approved — Demo Mode: ${action.title}`,
    severity: 'INFO',
    details: {
      priorStatus: action.approvalStatus,
      newStatus: 'APPROVED',
      actionType: action.type,
      totalAmount: action.payload.totalAmount,
    },
  };

  return { updatedAction, auditEvent };
}

function rejectDraftAction(
  action: DraftAction,
  reason: string,
  actor: 'HUMAN' = 'HUMAN',
  timestamp = new Date().toISOString()
): { updatedAction: DraftAction; auditEvent: AuditEvent } {
  const updatedAction: DraftAction = {
    ...action,
    approvalStatus: 'REJECTED',
    rejectedAt: timestamp,
    rejectionReason: reason,
  };

  const auditEvent: AuditEvent = {
    id: `evt-rej-${action.id}-${Date.now()}`,
    timestamp,
    type: 'ACTION_REJECTED',
    actor,
    actionId: action.id,
    summary: `Action Rejected: ${action.title} (Reason: ${reason})`,
    severity: 'MEDIUM',
    details: {
      priorStatus: action.approvalStatus,
      newStatus: 'REJECTED',
      rejectionReason: reason,
    },
  };

  return { updatedAction, auditEvent };
}

describe('Human-in-the-Loop Approval Queue State Transitions', () => {
  const mockAction: DraftAction = {
    id: 'ACT-PO-SKU-101',
    type: 'PURCHASE_ORDER',
    title: 'Draft PO: Replenish Ergonomic Desk Pro',
    relatedRecordId: 'SKU-101',
    priority: 'CRITICAL',
    reason: 'Stock coverage is critically low',
    expectedOutcome: 'Replenishes stock before stockout occurs',
    payload: {
      supplierName: 'Apex Industrial Supplies',
      totalAmount: 23200,
    },
    approvalStatus: 'PENDING',
    createdAt: '2026-11-18T00:00:00Z',
  };

  // Test 13: Approval and rejection state transitions
  it('transitions state to APPROVED and marks as Approved — Demo Mode with audit event', () => {
    const { updatedAction, auditEvent } = approveDraftAction(mockAction);

    expect(updatedAction.approvalStatus).toBe('APPROVED');
    expect(updatedAction.approvedAt).toBeDefined();
    expect(auditEvent.type).toBe('ACTION_APPROVED');
    expect(auditEvent.summary).toContain('Approved — Demo Mode');
    expect(auditEvent.actor).toBe('HUMAN');
  });

  it('transitions state to REJECTED with rejection reason recorded and audit logged', () => {
    const rejectionReason = 'Current supplier lead time is too high; negotiating alternative logistics.';
    const { updatedAction, auditEvent } = rejectDraftAction(mockAction, rejectionReason);

    expect(updatedAction.approvalStatus).toBe('REJECTED');
    expect(updatedAction.rejectedAt).toBeDefined();
    expect(updatedAction.rejectionReason).toBe(rejectionReason);
    expect(auditEvent.type).toBe('ACTION_REJECTED');
    expect(auditEvent.details?.rejectionReason).toBe(rejectionReason);
  });
});
