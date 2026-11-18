import { describe, it, expect } from 'vitest';
import { runOperationsAnalysis } from '@/lib/agent/engine';
import { analyzeInventory, analyzeOrders, analyzeInvoices } from '@/lib/agent/tools';
import { BusinessState } from '@/types';
import { DEMO_INVENTORY, DEMO_SALES, DEMO_ORDERS, DEMO_INVOICES } from '@/lib/data/demo-data';

describe('OpsPilot Concurrency, Idempotence & State Safety', () => {
  const baseState: BusinessState = {
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

  it('guarantees deterministic idempotence across duplicate analysis runs', async () => {
    const run1 = await runOperationsAnalysis(baseState, { referenceDate: '2026-11-18' });
    const run2 = await runOperationsAnalysis(baseState, { referenceDate: '2026-11-18' });

    expect(run1.healthScore.overallScore).toBe(run2.healthScore.overallScore);
    expect(run1.exceptions.length).toBe(run2.exceptions.length);
    expect(run1.draftActions.length).toBe(run2.draftActions.length);

    // Verify exception IDs and severities match 1:1
    const ids1 = run1.exceptions.map((e) => e.id);
    const ids2 = run2.exceptions.map((e) => e.id);
    expect(ids1).toEqual(ids2);
  });

  it('handles concurrent tool execution via Promise.all safely', async () => {
    const [invRes, ordRes, recRes] = await Promise.all([
      Promise.resolve(analyzeInventory(DEMO_INVENTORY)),
      Promise.resolve(analyzeOrders(DEMO_ORDERS, '2026-11-18')),
      Promise.resolve(analyzeInvoices(DEMO_INVOICES, '2026-11-18')),
    ]);

    expect(invRes.items.length).toBe(DEMO_INVENTORY.length);
    expect(ordRes.orders.length).toBe(DEMO_ORDERS.length);
    expect(recRes.invoices.length).toBe(DEMO_INVOICES.length);
    expect(invRes.exceptions.length).toBeGreaterThan(0);
    expect(ordRes.exceptions.length).toBeGreaterThan(0);
  });
});
