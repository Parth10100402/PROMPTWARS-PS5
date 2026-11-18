import { GoogleGenAI } from '@google/genai';
import { OperationalException, BusinessHealthScore, BusinessState } from '@/types';
import {
  SYSTEM_OPERATIONS_PROMPT,
  buildExplanationPrompt,
  buildChatQueryPrompt,
} from './prompts';

export interface ExplanationResponse {
  isGeminiActive: boolean;
  summary: string;
  explanations: Record<string, string>;
}

export interface ChatResponse {
  answer: string;
  isAiGenerated: boolean;
  mode: 'GEMINI_ASSISTED' | 'DETERMINISTIC_RULES';
  referencedIds: string[];
}

/**
 * Generate AI-assisted or deterministic contextual explanations
 */
export async function generateGeminiExplanations(
  exceptions: OperationalException[],
  healthScore: BusinessHealthScore
): Promise<ExplanationResponse> {
  const apiKey = process.env.GEMINI_API_KEY?.trim();

  // Deterministic Fallback generator
  const fallbackExplanations: Record<string, string> = {};
  exceptions.forEach((exc) => {
    if (exc.category === 'INVENTORY') {
      fallbackExplanations[exc.id] =
        `Replenishment run-rate alert: Stock coverage has breached safe operational buffer. Expedite supplier purchase order immediately to avoid revenue loss.`;
    } else if (exc.category === 'ORDER') {
      fallbackExplanations[exc.id] =
        `Fulfillment delay notice: Dispatch bottleneck identified past customer SLA. Proactive notification required to mitigate churn risk.`;
    } else if (exc.category === 'RECEIVABLE') {
      fallbackExplanations[exc.id] =
        `Credit control flag: Unsettled receivables impacting net working capital. Issue formal ledger statement and follow-up sequence.`;
    } else {
      fallbackExplanations[exc.id] =
        `Demand volatility signal: Significant deviation against 30-day baseline. Re-evaluate safety stock parameters.`;
    }
  });

  const fallbackSummary = `Business operations health is rated at ${healthScore.overallScore}/100 (${healthScore.healthTier}). Found ${exceptions.filter((e) => e.severity === 'CRITICAL').length} critical bottlenecks and ${exceptions.filter((e) => e.severity === 'HIGH').length} priority warnings requiring human review.`;

  if (!apiKey) {
    return {
      isGeminiActive: false,
      summary: fallbackSummary,
      explanations: fallbackExplanations,
    };
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    const model = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
    const prompt = buildExplanationPrompt(exceptions, healthScore);

    const response = await ai.models.generateContent({
      model,
      contents: [
        { role: 'user', parts: [{ text: `${SYSTEM_OPERATIONS_PROMPT}\n\n${prompt}` }] },
      ],
      config: {
        responseMimeType: 'application/json',
      },
    });

    const text = response.text?.trim();
    if (!text) {
      return { isGeminiActive: false, summary: fallbackSummary, explanations: fallbackExplanations };
    }

    const parsed = JSON.parse(text);
    return {
      isGeminiActive: true,
      summary: parsed.summary || fallbackSummary,
      explanations: { ...fallbackExplanations, ...(parsed.explanations || {}) },
    };
  } catch (err) {
    console.warn('Gemini explanation call failed, using deterministic fallback:', err);
    return {
      isGeminiActive: false,
      summary: fallbackSummary,
      explanations: fallbackExplanations,
    };
  }
}

/**
 * Conversational Ask OpsPilot Agent
 */
export async function askOpsPilotAgent(
  question: string,
  state: BusinessState
): Promise<ChatResponse> {
  const normalizedQ = question.toLowerCase().trim();
  const apiKey = process.env.GEMINI_API_KEY?.trim();

  // Compute facts from state
  const criticalItems = state.inventory.filter((i) => i.riskLevel === 'CRITICAL');
  const delayedOrders = state.orders.filter((o) => o.isDelayed);
  const overdueInvoices = state.invoices.filter((i) => i.isOverdue);
  const criticalCount = state.exceptions.filter((e) => e.severity === 'CRITICAL').length;
  const highCount = state.exceptions.filter((e) => e.severity === 'HIGH').length;

  const businessFacts = {
    healthScore: state.healthScore?.overallScore ?? 100,
    healthTier: state.healthScore?.healthTier ?? 'GOOD',
    criticalExceptionsCount: criticalCount,
    highExceptionsCount: highCount,
    criticalInventoryItems: criticalItems.map(
      (i) => `${i.productName} (${i.sku}): ${i.stockOnHand} left, ${i.daysOfCover || 0}d cover`
    ),
    delayedOrders: delayedOrders.map((o) => ({
      id: o.orderId,
      delayDays: o.delayDays || 0,
      amount: o.amount,
    })),
    overdueInvoices: overdueInvoices.map((i) => ({
      id: i.invoiceId,
      overdueDays: i.overdueDays || 0,
      amount: i.amount,
    })),
  };

  // 1. Check if Gemini can be called
  if (apiKey) {
    try {
      const ai = new GoogleGenAI({ apiKey });
      const model = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
      const prompt = buildChatQueryPrompt(question, businessFacts);

      const response = await ai.models.generateContent({
        model,
        contents: [
          { role: 'user', parts: [{ text: `${SYSTEM_OPERATIONS_PROMPT}\n\n${prompt}` }] },
        ],
      });

      const reply = response.text?.trim();
      if (reply) {
        return {
          answer: reply,
          isAiGenerated: true,
          mode: 'GEMINI_ASSISTED',
          referencedIds: [
            ...criticalItems.map((i) => i.sku),
            ...delayedOrders.map((o) => o.orderId),
            ...overdueInvoices.map((i) => i.invoiceId),
          ],
        };
      }
    } catch (err) {
      console.warn('Gemini chat failed, switching to deterministic fallback answer:', err);
    }
  }

  // 2. Deterministic Rule-Based Fallback QA Engine
  let answer = '';
  const referencedIds: string[] = [];

  if (normalizedQ.includes('attention') || normalizedQ.includes('prioritize') || normalizedQ.includes('today')) {
    answer = `Here is your operational priority rundown for today:\n\n` +
      `1. **Inventory Stockouts**: ${criticalItems.length} product(s) at critical risk of running out before supplier shipments arrive (${criticalItems.map((i) => i.sku).join(', ') || 'None'}).\n` +
      `2. **Delayed Customer Shipments**: ${delayedOrders.length} order(s) past promised delivery dates totaling $${delayedOrders.reduce((s, o) => s + o.amount, 0).toLocaleString()}.\n` +
      `3. **Overdue Receivables**: ${overdueInvoices.length} outstanding invoice(s) past payment terms totaling $${overdueInvoices.reduce((s, i) => s + i.amount, 0).toLocaleString()}.\n\n` +
      `Recommended Next Step: Review and approve the generated draft Purchase Orders and Customer Follow-up notifications in the Action Approval Center.`;
    referencedIds.push(
      ...criticalItems.map((i) => i.sku),
      ...delayedOrders.map((o) => o.orderId),
      ...overdueInvoices.map((i) => i.invoiceId)
    );
  } else if (normalizedQ.includes('product') || normalizedQ.includes('inventory') || normalizedQ.includes('stock')) {
    if (criticalItems.length > 0) {
      answer = `There are ${criticalItems.length} products with critical stockout risk:\n\n` +
        criticalItems
          .map(
            (i) =>
              `• **${i.productName} (${i.sku})**: Stock on hand is ${i.stockOnHand} units. At ${i.avgDailySales} units/day, coverage is ${i.daysOfCover} days vs lead time of ${i.leadTimeDays} days. Recommended reorder: ${i.reorderQuantity} units.`
          )
          .join('\n') +
        `\n\nPO drafts have been placed in the approval queue.`;
      referencedIds.push(...criticalItems.map((i) => i.sku));
    } else {
      answer = `All catalog inventory items currently meet or exceed safety replenishment thresholds. No stockouts imminent.`;
    }
  } else if (normalizedQ.includes('order') || normalizedQ.includes('delayed') || normalizedQ.includes('delivery')) {
    if (delayedOrders.length > 0) {
      answer = `Currently ${delayedOrders.length} order(s) are delayed past promised delivery dates:\n\n` +
        delayedOrders
          .map(
            (o) =>
              `• **Order ${o.orderId}** (${o.customerName}): Promised ${o.promisedDate} (${o.delayDays} days late). Amount: $${o.amount.toLocaleString()}. Status: ${o.status}.`
          )
          .join('\n') +
        `\n\nCustomer follow-up drafts have been prepared for human approval.`;
      referencedIds.push(...delayedOrders.map((o) => o.orderId));
    } else {
      answer = `All current active customer orders are on schedule for delivery within promised windows.`;
    }
  } else if (normalizedQ.includes('invoice') || normalizedQ.includes('payment') || normalizedQ.includes('overdue')) {
    if (overdueInvoices.length > 0) {
      const totalOverdue = overdueInvoices.reduce((sum, i) => sum + i.amount, 0);
      answer = `There are ${overdueInvoices.length} overdue invoices totaling $${totalOverdue.toLocaleString()}:\n\n` +
        overdueInvoices
          .map(
            (i) =>
              `• **Invoice ${i.invoiceId}** (${i.customerName}): Due ${i.dueDate} (${i.overdueDays} days past due). Amount: $${i.amount.toLocaleString()}. Status: ${i.status}.`
          )
          .join('\n') +
        `\n\nPayment reminder drafts have been queued for your review.`;
      referencedIds.push(...overdueInvoices.map((i) => i.invoiceId));
    } else {
      answer = `No overdue receivables detected. Accounts receivable collections are currently up to date.`;
    }
  } else if (normalizedQ.includes('health') || normalizedQ.includes('score') || normalizedQ.includes('summary')) {
    answer = `**Business Operations Health Summary**:\n\n` +
      `• **Overall Score**: ${businessFacts.healthScore}/100 (${businessFacts.healthTier})\n` +
      `• **Inventory Health**: ${state.healthScore?.inventoryScore ?? 100}%\n` +
      `• **Fulfillment Rate**: ${state.healthScore?.fulfillmentScore ?? 100}%\n` +
      `• **Receivables Collection**: ${state.healthScore?.receivablesScore ?? 100}%\n\n` +
      `${state.healthScore?.summary || 'Operations within standard parameters.'}`;
  } else if (normalizedQ.includes('sku-101')) {
    const sku101 = state.inventory.find((i) => i.sku === 'SKU-101');
    if (sku101) {
      answer = `**Analysis for SKU-101 (${sku101.productName})**:\n\n` +
        `• Current Stock: ${sku101.stockOnHand} units\n` +
        `• Average Daily Sales: ${sku101.avgDailySales} units/day\n` +
        `• Days of Coverage: ${sku101.daysOfCover} days\n` +
        `• Lead Time from ${sku101.supplierName}: ${sku101.leadTimeDays} days\n` +
        `• Target Coverage: ${sku101.targetCoverDays} days\n\n` +
        `**Risk Assessment**: Critical. Since coverage (${sku101.daysOfCover}d) is significantly lower than supplier lead time (${sku101.leadTimeDays}d), the warehouse will exhaust stock before a newly placed order can arrive. Immediate approval of the suggested ${sku101.reorderQuantity}-unit reorder is strongly advised.`;
      referencedIds.push('SKU-101');
    } else {
      answer = `SKU-101 was not found in the currently loaded inventory dataset.`;
    }
  } else {
    answer = `OpsPilot operational status: Operations score is ${businessFacts.healthScore}/100 (${businessFacts.healthTier}). ` +
      `Currently tracking ${state.inventory.length} inventory lines, ${state.orders.length} orders, and ${state.invoices.length} invoices. ` +
      `You can ask me about at-risk products, delayed orders, overdue payments, or specific SKUs like SKU-101.`;
  }

  return {
    answer,
    isAiGenerated: false,
    mode: 'DETERMINISTIC_RULES',
    referencedIds,
  };
}
