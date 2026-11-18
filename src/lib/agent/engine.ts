import {
  BusinessState,
  AnalysisResult,
  AuditEvent,
  OperationalException,
  DraftAction,
  BusinessHealthScore,
} from '@/types';
import {
  analyzeInventory,
  analyzeOrders,
  analyzeInvoices,
  analyzeSales,
  calculateBusinessHealth,
  prioritizeExceptions,
  generateRecommendations,
} from './tools';
import { generateGeminiExplanations } from './llm';

export interface RunAnalysisOptions {
  referenceDate?: string;
  enableAi?: boolean;
}

export async function runOperationsAnalysis(
  state: BusinessState,
  options: RunAnalysisOptions = {}
): Promise<AnalysisResult> {
  const timestamp = new Date().toISOString();
  // Use specified reference date or latest order/invoice date, or fallback to current
  const referenceDate = options.referenceDate || '2026-11-18';
  const auditEvents: AuditEvent[] = [];

  // Step 1: Start Analysis Event
  auditEvents.push({
    id: `evt-start-${Date.now()}`,
    timestamp,
    type: 'ANALYSIS_STARTED',
    actor: 'AGENT',
    summary: `Operations analysis initiated across ${state.inventory.length} inventory items, ${state.orders.length} orders, and ${state.invoices.length} invoices.`,
    severity: 'INFO',
  });

  // Step 2: Run Tool Allowlist Analysis
  const { items: enrichedInventory, exceptions: invExceptions } = analyzeInventory(
    state.inventory,
    timestamp
  );
  const { orders: enrichedOrders, exceptions: orderExceptions } = analyzeOrders(
    state.orders,
    referenceDate,
    timestamp
  );
  const { invoices: enrichedInvoices, exceptions: invRecExceptions } = analyzeInvoices(
    state.invoices,
    referenceDate,
    timestamp
  );
  const salesExceptions = analyzeSales(state.sales, state.inventory, timestamp);

  // Step 3: Combine and prioritize exceptions
  const rawExceptions: OperationalException[] = [
    ...invExceptions,
    ...orderExceptions,
    ...invRecExceptions,
    ...salesExceptions,
  ];
  const sortedExceptions = prioritizeExceptions(rawExceptions);

  // Step 4: Audit exception detections
  sortedExceptions.forEach((exc) => {
    auditEvents.push({
      id: `evt-exc-${exc.id}-${Date.now()}`,
      timestamp,
      type: 'EXCEPTION_DETECTED',
      actor: 'AGENT',
      summary: `[${exc.severity}] ${exc.title}`,
      severity: exc.severity === 'HEALTHY' ? 'INFO' : exc.severity,
      details: {
        category: exc.category,
        evidence: exc.dataEvidence,
        businessImpact: exc.businessImpact,
      },
    });
  });

  // Step 5: Calculate Business Health Score
  const healthScore = calculateBusinessHealth(
    enrichedInventory,
    enrichedOrders,
    enrichedInvoices,
    sortedExceptions
  );

  // Step 6: Generate Recommendations and Draft Actions
  const draftActions = generateRecommendations(
    sortedExceptions,
    enrichedInventory,
    enrichedOrders,
    enrichedInvoices,
    timestamp
  );

  draftActions.forEach((act) => {
    auditEvents.push({
      id: `evt-act-${act.id}-${Date.now()}`,
      timestamp,
      type: 'ACTION_DRAFTED',
      actor: 'AGENT',
      actionId: act.id,
      summary: `Drafted ${act.type}: ${act.title}`,
      severity: act.priority === 'CRITICAL' ? 'CRITICAL' : 'HIGH',
      details: {
        reason: act.reason,
        expectedOutcome: act.expectedOutcome,
      },
    });
    auditEvents.push({
      id: `evt-req-${act.id}-${Date.now()}`,
      timestamp,
      type: 'APPROVAL_REQUESTED',
      actor: 'AGENT',
      actionId: act.id,
      summary: `Human approval requested for action ${act.id}`,
      severity: 'INFO',
    });
  });

  // Step 7: AI Explanation Layer (Gemini if key exists, else deterministic explanation generator)
  let aiExplanations: Record<string, string> | undefined = undefined;
  let mode: 'GEMINI_ASSISTED' | 'DETERMINISTIC_RULES' = 'DETERMINISTIC_RULES';

  try {
    const aiResult = await generateGeminiExplanations(sortedExceptions, healthScore);
    if (aiResult.isGeminiActive) {
      aiExplanations = aiResult.explanations;
      mode = 'GEMINI_ASSISTED';
    }
  } catch (err) {
    console.warn('Gemini explanation layer bypassed, falling back to deterministic mode:', err);
    mode = 'DETERMINISTIC_RULES';
  }

  return {
    timestamp,
    healthScore,
    exceptions: sortedExceptions,
    draftActions,
    auditEvents,
    aiExplanations,
    mode,
  };
}
