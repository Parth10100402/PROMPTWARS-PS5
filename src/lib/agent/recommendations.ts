import {
  OperationalException,
  DraftAction,
  InventoryItem,
  OrderItem,
  InvoiceItem,
  ActionPriority,
} from '@/types';

/**
 * Transforms detected operational exceptions into actionable, pre-populated workflow drafts.
 * Every generated draft requires human review and explicit affirmative sign-off before execution.
 *
 * Performance guarantee:
 * Indexes relational entity arrays into O(1) Map lookups upfront, avoiding O(E * N) quadratic scans.
 *
 * @param exceptions - Prioritized operational exceptions from the detection engine.
 * @param inventory - Active catalog inventory state.
 * @param orders - Customer purchase orders.
 * @param invoices - Accounts receivable invoices.
 * @param timestamp - ISO 8601 execution timestamp.
 * @returns Array of deduplicated DraftAction records queued in PENDING status.
 *
 * @complexity Time: O(E + N + M + K) linear pass | Space: O(E) for output and lookup maps.
 */
export function generateDraftActions(
  exceptions: OperationalException[],
  inventory: InventoryItem[],
  orders: OrderItem[],
  invoices: InvoiceItem[],
  timestamp: string
): DraftAction[] {
  const actions: DraftAction[] = [];
  const processedRecords = new Set<string>();

  // Index catalog datasets into O(1) HashMaps for efficient record resolution
  const inventoryMap = new Map<string, InventoryItem>(inventory.map((i) => [i.sku, i]));
  const ordersMap = new Map<string, OrderItem>(orders.map((o) => [o.orderId, o]));
  const invoicesMap = new Map<string, InvoiceItem>(invoices.map((i) => [i.invoiceId, i]));

  for (const exc of exceptions) {
    if (processedRecords.has(exc.relatedRecordId)) {
      continue;
    }

    // 1. Inventory Stockout Replenishment (PO Draft)
    if (exc.category === 'INVENTORY' && (exc.severity === 'CRITICAL' || exc.severity === 'HIGH')) {
      const item = inventoryMap.get(exc.relatedRecordId);
      if (item) {
        processedRecords.add(item.sku);
        const reorderQty = item.reorderQuantity || Math.ceil(item.avgDailySales * item.targetCoverDays);
        const totalAmount = Number((reorderQty * item.unitCost).toFixed(2));
        const priority: ActionPriority = exc.severity === 'CRITICAL' ? 'CRITICAL' : 'HIGH';

        actions.push({
          id: `ACT-PO-${item.sku}`,
          type: 'PURCHASE_ORDER',
          title: `Draft PO: Replenish ${item.productName} (${reorderQty} units)`,
          relatedRecordId: item.sku,
          priority,
          reason: `Stock coverage down to ${item.daysOfCover || 0} days against a supplier lead time of ${item.leadTimeDays} days. Immediate order required to prevent stockout.`,
          expectedOutcome: `Restores inventory coverage to ${item.targetCoverDays} days (${reorderQty} units received) within ${item.leadTimeDays} business days.`,
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
            notes: `Standard delivery terms requested. Target delivery within ${item.leadTimeDays} days from issuance.`,
          },
          approvalStatus: 'PENDING',
          createdAt: timestamp,
        });
      }
    } 
    // 2. Delayed Customer Order Mitigation (Expedited Follow-up Draft)
    else if (exc.category === 'ORDER') {
      const order = ordersMap.get(exc.relatedRecordId);
      if (order && order.isDelayed) {
        processedRecords.add(order.orderId);
        const priority: ActionPriority =
          exc.severity === 'CRITICAL' ? 'CRITICAL' : exc.severity === 'HIGH' ? 'HIGH' : 'MEDIUM';

        actions.push({
          id: `ACT-MSG-${order.orderId}`,
          type: 'CUSTOMER_MESSAGE',
          title: `Customer Follow-up: Dispatch Delay on ${order.orderId}`,
          relatedRecordId: order.orderId,
          priority,
          reason: `Order is ${order.delayDays} day(s) past promised delivery date (${order.promisedDate}). Proactive communication required to preserve customer goodwill.`,
          expectedOutcome: `Informs customer of expedited shipping status, provides priority tracking, and mitigates cancellation risk for $${order.amount.toLocaleString()}.`,
          payload: {
            recipientName: order.customerName,
            subject: `Update regarding your order ${order.orderId} - OpsPilot Delivery Dispatch`,
            messageBody: `Dear ${order.customerName},\n\nWe are writing to provide a transparent update regarding order ${order.orderId} placed on ${order.orderDate}.\n\nDue to temporary warehouse transit processing, delivery was delayed past the original date of ${order.promisedDate}. Our logistics team has escalated your shipment to priority express dispatch.\n\nWe sincerely apologize for this delay and are monitoring its journey to ensure arrival as quickly as possible.\n\nBest regards,\nOperations Fulfillment Team`,
            totalAmount: order.amount,
          },
          approvalStatus: 'PENDING',
          createdAt: timestamp,
        });
      }
    } 
    // 3. Delinquent Accounts Receivable (Payment Reminder Notice)
    else if (exc.category === 'RECEIVABLE') {
      const inv = invoicesMap.get(exc.relatedRecordId);
      if (inv && inv.isOverdue) {
        processedRecords.add(inv.invoiceId);
        const priority: ActionPriority =
          exc.severity === 'CRITICAL' ? 'CRITICAL' : exc.severity === 'HIGH' ? 'HIGH' : 'MEDIUM';

        actions.push({
          id: `ACT-REM-${inv.invoiceId}`,
          type: 'PAYMENT_REMINDER',
          title: `Payment Reminder: Invoice ${inv.invoiceId} ($${inv.amount.toLocaleString()})`,
          relatedRecordId: inv.invoiceId,
          priority,
          reason: `Invoice has exceeded payment terms by ${inv.overdueDays} days (due date: ${inv.dueDate}). Uncollected cash impact: $${inv.amount.toLocaleString()}.`,
          expectedOutcome: `Accelerates accounts receivable collection, secures outstanding payment confirmation, and prevents bad debt write-off.`,
          payload: {
            recipientName: inv.customerName,
            invoiceId: inv.invoiceId,
            dueDate: inv.dueDate,
            totalAmount: inv.amount,
            subject: `Payment Reminder: Invoice ${inv.invoiceId} is ${inv.overdueDays} days past due`,
            messageBody: `Dear Accounts Payable Team at ${inv.customerName},\n\nThis is a friendly reminder that invoice ${inv.invoiceId} in the amount of $${inv.amount.toLocaleString()} was due on ${inv.dueDate}.\n\nPlease review your records and confirm if this payment has been scheduled for remittance. For your convenience, electronic settlement details are attached.\n\nIf payment has already been sent, please disregard this notice with our thanks.\n\nSincerely,\nFinance & Operations`,
          },
          approvalStatus: 'PENDING',
          createdAt: timestamp,
        });
      }
    } 
    // 4. Sales Surge Anomalies (ERP Safety Buffer Adjustment Task)
    else if (exc.category === 'SALES' && exc.severity === 'HIGH') {
      processedRecords.add(exc.relatedRecordId);
      actions.push({
        id: `ACT-TASK-${exc.relatedRecordId}`,
        type: 'OPERATIONAL_TASK',
        title: `Inventory Buffer Adjustment: ${exc.relatedRecordId}`,
        relatedRecordId: exc.relatedRecordId,
        priority: 'HIGH',
        reason: `Sales volume surged significantly beyond the 30-day baseline, necessitating a dynamic safety stock recalibration.`,
        expectedOutcome: `Increases reorder safety buffer by 50% to prevent future stockouts during sustained demand spikes.`,
        payload: {
          notes: `Task assigned to Inventory Controller: Audit sales channels for ${exc.relatedRecordId} and raise safetyStockDays in ERP catalog from current setting.`,
        },
        approvalStatus: 'PENDING',
        createdAt: timestamp,
      });
    }
  }

  return actions;
}
