import {
  InventoryItem,
  SaleRecord,
  OrderItem,
  InvoiceItem,
  OperationalException,
  DraftAction,
  BusinessHealthScore,
} from '@/types';
import {
  evaluateInventoryRules,
  evaluateOrderRules,
  evaluateInvoiceRules,
  evaluateSalesAnomalies,
  calculateBusinessHealthScore,
} from '../rules';
import { prioritizeExceptions as prioritizeExceptionsFn } from '../priority';
import { generateDraftActions } from '../recommendations';

// Tool 1: analyzeInventory
export function analyzeInventory(
  inventory: InventoryItem[],
  timestamp = new Date().toISOString()
): { items: InventoryItem[]; exceptions: OperationalException[] } {
  if (!Array.isArray(inventory)) {
    throw new Error('Invalid arguments: inventory must be an array');
  }
  const { enrichedItems, exceptions } = evaluateInventoryRules(inventory, timestamp);
  return { items: enrichedItems, exceptions };
}

// Tool 2: analyzeOrders
export function analyzeOrders(
  orders: OrderItem[],
  referenceDate: string,
  timestamp = new Date().toISOString()
): { orders: OrderItem[]; exceptions: OperationalException[] } {
  if (!Array.isArray(orders) || !referenceDate) {
    throw new Error('Invalid arguments: orders array and referenceDate are required');
  }
  const { enrichedOrders, exceptions } = evaluateOrderRules(orders, referenceDate, timestamp);
  return { orders: enrichedOrders, exceptions };
}

// Tool 3: analyzeInvoices
export function analyzeInvoices(
  invoices: InvoiceItem[],
  referenceDate: string,
  timestamp = new Date().toISOString()
): { invoices: InvoiceItem[]; exceptions: OperationalException[] } {
  if (!Array.isArray(invoices) || !referenceDate) {
    throw new Error('Invalid arguments: invoices array and referenceDate are required');
  }
  const { enrichedInvoices, exceptions } = evaluateInvoiceRules(invoices, referenceDate, timestamp);
  return { invoices: enrichedInvoices, exceptions };
}

// Tool 4: analyzeSales
export function analyzeSales(
  sales: SaleRecord[],
  inventory: InventoryItem[],
  timestamp = new Date().toISOString()
): OperationalException[] {
  if (!Array.isArray(sales) || !Array.isArray(inventory)) {
    throw new Error('Invalid arguments: sales and inventory arrays are required');
  }
  return evaluateSalesAnomalies(sales, inventory, timestamp);
}

// Tool 5: calculateBusinessHealth
export function calculateBusinessHealth(
  inventory: InventoryItem[],
  orders: OrderItem[],
  invoices: InvoiceItem[],
  exceptions: OperationalException[]
): BusinessHealthScore {
  return calculateBusinessHealthScore(inventory, orders, invoices, exceptions);
}

// Tool 6: prioritizeExceptions
export function prioritizeExceptions(exceptions: OperationalException[]): OperationalException[] {
  if (!Array.isArray(exceptions)) {
    throw new Error('Invalid arguments: exceptions must be an array');
  }
  return prioritizeExceptionsFn(exceptions);
}

// Tool 7: generateRecommendations
export function generateRecommendations(
  exceptions: OperationalException[],
  inventory: InventoryItem[],
  orders: OrderItem[],
  invoices: InvoiceItem[],
  timestamp = new Date().toISOString()
): DraftAction[] {
  return generateDraftActions(exceptions, inventory, orders, invoices, timestamp);
}

// Tool 8: createPurchaseOrderDraft
export function createPurchaseOrderDraft(
  item: InventoryItem,
  timestamp = new Date().toISOString()
): DraftAction {
  const reorderQty = item.reorderQuantity || Math.ceil(item.avgDailySales * item.targetCoverDays);
  const totalAmount = Number((reorderQty * item.unitCost).toFixed(2));
  return {
    id: `ACT-PO-${item.sku}-${Date.now()}`,
    type: 'PURCHASE_ORDER',
    title: `Purchase Order: ${item.productName} (${reorderQty} units)`,
    relatedRecordId: item.sku,
    priority: item.riskLevel === 'CRITICAL' ? 'CRITICAL' : 'HIGH',
    reason: `Target inventory cover shortfall: ${item.daysOfCover || 0} days remaining vs target ${item.targetCoverDays} days.`,
    expectedOutcome: `Replenishes stock with ${reorderQty} units before safety buffer exhaustion.`,
    payload: {
      supplierName: item.supplierName,
      items: [
        {
          sku: item.sku,
          name: item.productName,
          quantity: reorderQty,
          unitCost: item.unitCost,
          totalCost: totalAmount,
        },
      ],
      totalAmount,
    },
    approvalStatus: 'PENDING',
    createdAt: timestamp,
  };
}

// Tool 9: createCustomerMessageDraft
export function createCustomerMessageDraft(
  order: OrderItem,
  timestamp = new Date().toISOString()
): DraftAction {
  return {
    id: `ACT-MSG-${order.orderId}-${Date.now()}`,
    type: 'CUSTOMER_MESSAGE',
    title: `Customer Delay Notification: Order ${order.orderId}`,
    relatedRecordId: order.orderId,
    priority: order.delayDays && order.delayDays >= 5 ? 'CRITICAL' : 'HIGH',
    reason: `Order delayed past promised delivery date (${order.promisedDate}).`,
    expectedOutcome: `Proactive communication to reassure customer and provide escalated tracking.`,
    payload: {
      recipientName: order.customerName,
      subject: `Order ${order.orderId} Delivery Status Update`,
      messageBody: `Dear ${order.customerName},\n\nWe apologize for the delay regarding order ${order.orderId}. It is currently expedited for immediate dispatch.\n\nThank you for your patience,\nOperations Team`,
      totalAmount: order.amount,
    },
    approvalStatus: 'PENDING',
    createdAt: timestamp,
  };
}

// Tool 10: createPaymentReminderDraft
export function createPaymentReminderDraft(
  invoice: InvoiceItem,
  timestamp = new Date().toISOString()
): DraftAction {
  return {
    id: `ACT-REM-${invoice.invoiceId}-${Date.now()}`,
    type: 'PAYMENT_REMINDER',
    title: `Payment Reminder: Invoice ${invoice.invoiceId}`,
    relatedRecordId: invoice.invoiceId,
    priority: invoice.overdueDays && invoice.overdueDays >= 14 ? 'CRITICAL' : 'HIGH',
    reason: `Invoice has passed due date (${invoice.dueDate}) without confirmed receipt.`,
    expectedOutcome: `Secures prompt settlement of outstanding accounts receivable.`,
    payload: {
      recipientName: invoice.customerName,
      invoiceId: invoice.invoiceId,
      dueDate: invoice.dueDate,
      totalAmount: invoice.amount,
      subject: `Reminder: Invoice ${invoice.invoiceId} Payment Due`,
      messageBody: `Dear Accounts Payable at ${invoice.customerName},\n\nPlease be advised invoice ${invoice.invoiceId} ($${invoice.amount}) was due on ${invoice.dueDate}. Kindly remit payment at your earliest convenience.\n\nThank you,\nFinance Department`,
    },
    approvalStatus: 'PENDING',
    createdAt: timestamp,
  };
}

/**
 * Explicit Agent Tool Registry & Security Allowlist.
 * Only functions explicitly registered herein can be invoked by the operations agent.
 * Any dynamic or unmapped function call is rejected with an authorization exception.
 */
export const ALLOWED_AGENT_TOOLS = {
  analyzeInventory,
  analyzeOrders,
  analyzeInvoices,
  analyzeSales,
  calculateBusinessHealth,
  prioritizeExceptions,
  generateRecommendations,
  createPurchaseOrderDraft,
  createCustomerMessageDraft,
  createPaymentReminderDraft,
} as const;

export type AllowedToolName = keyof typeof ALLOWED_AGENT_TOOLS;

/**
 * Type-safe dispatcher that enforces strict allowlist confinement for agent operations.
 *
 * @param toolName - Identifier of the allowed operational tool.
 * @param args - Strongly typed arguments corresponding to the tool signature.
 * @returns Strongly typed result of the tool invocation.
 * @throws Error if an unrecognized tool name is supplied.
 */
export function executeAllowedTool<T extends AllowedToolName>(
  toolName: T,
  ...args: Parameters<(typeof ALLOWED_AGENT_TOOLS)[T]>
): ReturnType<(typeof ALLOWED_AGENT_TOOLS)[T]> {
  if (!(toolName in ALLOWED_AGENT_TOOLS)) {
    throw new Error(`Unauthorized tool execution attempt: ${String(toolName)}`);
  }
  const toolFn = (ALLOWED_AGENT_TOOLS[toolName] as unknown) as (
    ...a: Parameters<(typeof ALLOWED_AGENT_TOOLS)[T]>
  ) => ReturnType<(typeof ALLOWED_AGENT_TOOLS)[T]>;
  return toolFn(...args);
}
