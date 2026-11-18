import { describe, it, expect } from 'vitest';
import { runOperationsAnalysis } from '@/lib/agent/engine';
import { BusinessState } from '@/types';
import { DEMO_INVENTORY, DEMO_SALES, DEMO_ORDERS, DEMO_INVOICES } from '@/lib/data/demo-data';

describe('OpsPilot Agent Engine Pipeline', () => {
  const sampleState: BusinessState = {
    inventory: DEMO_INVENTORY,
    sales: DEMO_SALES,
    orders: DEMO_ORDERS,
    invoices: DEMO_INVOICES,
    exceptions: [],
    draftActions: [],
    auditLog: [],
    healthScore: null,
    lastAnalysisTimestamp: null,
    isAiEnabled: false,
    aiMode: 'DETERMINISTIC_RULES',
  };

  // Test 12: Recommendation generation
  it('generates prioritized recommendations and draft actions from exceptions', async () => {
    const result = await runOperationsAnalysis(sampleState, { referenceDate: '2026-11-18' });

    expect(result.exceptions.length).toBeGreaterThan(0);
    expect(result.draftActions.length).toBeGreaterThan(0);

    // Verify draft PO created for critical inventory
    const poAction = result.draftActions.find((a) => a.type === 'PURCHASE_ORDER');
    expect(poAction).toBeDefined();
    expect(poAction?.payload.items?.length).toBeGreaterThan(0);
    expect(poAction?.approvalStatus).toBe('PENDING');

    // Verify customer follow-up created for delayed order
    const msgAction = result.draftActions.find((a) => a.type === 'CUSTOMER_MESSAGE');
    expect(msgAction).toBeDefined();
    expect(msgAction?.payload.recipientName).toBeDefined();

    // Verify payment reminder created for overdue invoice
    const remAction = result.draftActions.find((a) => a.type === 'PAYMENT_REMINDER');
    expect(remAction).toBeDefined();
    expect(remAction?.payload.totalAmount).toBeGreaterThan(0);
  });

  // Test 14: Audit log generation
  it('generates comprehensive audit events for analysis steps, detections, and drafted actions', async () => {
    const result = await runOperationsAnalysis(sampleState, { referenceDate: '2026-11-18' });

    expect(result.auditEvents.length).toBeGreaterThan(0);

    const eventTypes = result.auditEvents.map((e) => e.type);
    expect(eventTypes).toContain('ANALYSIS_STARTED');
    expect(eventTypes).toContain('EXCEPTION_DETECTED');
    expect(eventTypes).toContain('ACTION_DRAFTED');
    expect(eventTypes).toContain('APPROVAL_REQUESTED');

    // Verify all audit events have valid timestamps and actors
    result.auditEvents.forEach((evt) => {
      expect(evt.timestamp).toBeDefined();
      expect(['AGENT', 'HUMAN']).toContain(evt.actor);
    });
  });

  it('computes realistic business health score and breakdown', async () => {
    const result = await runOperationsAnalysis(sampleState, { referenceDate: '2026-11-18' });

    expect(result.healthScore.overallScore).toBeGreaterThanOrEqual(0);
    expect(result.healthScore.overallScore).toBeLessThanOrEqual(100);
    expect(['EXCELLENT', 'GOOD', 'NEEDS_ATTENTION', 'CRITICAL']).toContain(
      result.healthScore.healthTier
    );
  });
});
