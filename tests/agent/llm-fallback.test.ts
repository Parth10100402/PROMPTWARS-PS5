import { describe, it, expect, vi, beforeEach } from 'vitest';
import { generateGeminiExplanations, askOpsPilotAgent } from '@/lib/agent/llm';
import { BusinessState, OperationalException, BusinessHealthScore } from '@/types';
import { DEMO_INVENTORY, DEMO_ORDERS, DEMO_INVOICES, DEMO_SALES } from '@/lib/data/demo-data';

describe('Deterministic Agent Mode & LLM Fallback Suite', () => {
  beforeEach(() => {
    delete process.env.GEMINI_API_KEY;
  });

  // Test 15: LLM unavailable fallback
  it('generates rich deterministic explanations when GEMINI_API_KEY is not configured', async () => {
    const mockExceptions: OperationalException[] = [
      {
        id: 'EXC-INV-SKU-101',
        category: 'INVENTORY',
        severity: 'CRITICAL',
        title: 'Critical Stockout Risk: SKU-101',
        description: 'Stock coverage down to 0.67 days',
        dataEvidence: 'Stock: 8, AvgSales: 12',
        businessImpact: 'Lost revenue',
        recommendedAction: 'Reorder immediately',
        confidenceLevel: 0.98,
        detectedAt: new Date().toISOString(),
        relatedRecordId: 'SKU-101',
        status: 'PENDING_REVIEW',
      },
    ];

    const mockHealth: BusinessHealthScore = {
      overallScore: 68,
      inventoryScore: 60,
      fulfillmentScore: 75,
      receivablesScore: 70,
      healthTier: 'NEEDS_ATTENTION',
      summary: 'Operations need attention',
    };

    const res = await generateGeminiExplanations(mockExceptions, mockHealth);
    expect(res.isGeminiActive).toBe(false);
    expect(res.summary).toContain('68/100');
    expect(res.explanations['EXC-INV-SKU-101']).toBeDefined();
    expect(res.explanations['EXC-INV-SKU-101'].length).toBeGreaterThan(10);
  });

  it('answers "Ask OpsPilot" questions accurately using deterministic business rules when LLM is unavailable', async () => {
    const mockState: BusinessState = {
      inventory: DEMO_INVENTORY,
      sales: DEMO_SALES,
      orders: DEMO_ORDERS,
      invoices: DEMO_INVOICES,
      exceptions: [],
      draftActions: [],
      auditLog: [],
      healthScore: {
        overallScore: 72,
        inventoryScore: 65,
        fulfillmentScore: 75,
        receivablesScore: 76,
        healthTier: 'GOOD',
        summary: 'Operations stable',
      },
      lastAnalysisTimestamp: null,
      isAiEnabled: false,
      aiMode: 'DETERMINISTIC_RULES',
    };

    // Question 1: Attention / priority
    const resAttention = await askOpsPilotAgent('What needs my attention today?', mockState);
    expect(resAttention.isAiGenerated).toBe(false);
    expect(resAttention.mode).toBe('DETERMINISTIC_RULES');
    expect(resAttention.answer).toContain('operational priority rundown');

    // Question 2: Specific SKU inquiry
    const resSku = await askOpsPilotAgent('Why is SKU-101 critical?', mockState);
    expect(resSku.answer).toContain('SKU-101');
    expect(resSku.answer).toContain('Critical');
    expect(resSku.referencedIds).toContain('SKU-101');

    // Question 3: Health summary
    const resHealth = await askOpsPilotAgent('Summarize my business health', mockState);
    expect(resHealth.answer).toContain('72/100');
  });
});
