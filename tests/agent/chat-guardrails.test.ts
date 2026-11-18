import { describe, it, expect } from 'vitest';
import { askOpsPilotAgent } from '@/lib/agent/llm';
import { BusinessState } from '@/types';
import { DEMO_INVENTORY, DEMO_SALES, DEMO_ORDERS, DEMO_INVOICES } from '@/lib/data/demo-data';

describe('OpsPilot Conversational AI Guardrails & Grounding Suite', () => {
  const verifiedState: BusinessState = {
    inventory: DEMO_INVENTORY,
    sales: DEMO_SALES,
    orders: DEMO_ORDERS,
    invoices: DEMO_INVOICES,
    exceptions: [],
    draftActions: [],
    auditLog: [],
    healthScore: {
      overallScore: 82,
      inventoryScore: 78,
      fulfillmentScore: 85,
      receivablesScore: 84,
      healthTier: 'GOOD',
      summary: 'Operations running within target parameters.',
    },
    lastAnalysisTimestamp: null,
    isAiEnabled: false,
    aiMode: 'DETERMINISTIC_RULES',
  };

  it('truthfully reports SKU not found instead of hallucinating fictitious products', async () => {
    const res = await askOpsPilotAgent('Why is SKU-999 critical?', verifiedState);
    expect(res.answer).toContain('not found');
    expect(res.answer).not.toContain('Stock on hand is');
  });

  it('accurately quotes verified operational metrics for known critical items', async () => {
    const res = await askOpsPilotAgent('Why is SKU-101 critical?', verifiedState);
    expect(res.answer).toContain('SKU-101');
    expect(res.answer).toContain('Ergonomic Desk Pro');
    expect(res.answer).toContain('8 units');
    expect(res.answer).toContain('4 days');
    expect(res.referencedIds).toContain('SKU-101');
  });

  it('provides grounded delayed orders summary matching actual business records', async () => {
    const res = await askOpsPilotAgent('Which orders are delayed?', verifiedState);
    expect(res.answer).toContain('delayed');
    expect(res.referencedIds.length).toBeGreaterThan(0);
  });

  it('provides grounded accounts receivable summary matching actual overdue invoices', async () => {
    const res = await askOpsPilotAgent('Show overdue payments', verifiedState);
    expect(res.answer).toContain('overdue');
    expect(res.referencedIds.length).toBeGreaterThan(0);
  });
});
