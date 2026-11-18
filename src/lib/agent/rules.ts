/**
 * OpsPilot Deterministic Rules Engine
 *
 * Implements mathematical decision models for retail and distribution operations.
 * Evaluates stock depletion rates, order SLA deadlines, accounts receivable aging,
 * and sales velocity spikes without external generative dependencies.
 */

import {
  InventoryItem,
  OrderItem,
  InvoiceItem,
  SaleRecord,
  OperationalException,
  RiskLevel,
  BusinessHealthScore,
} from '@/types';

/**
 * Calculates calendar day delta between two ISO date strings (dateA - dateB).
 *
 * @param dateA - Target date
 * @param dateB - Baseline date
 * @returns Integer day difference
 */
export function getDaysDiff(dateA: string, dateB: string): number {
  const timeA = new Date(dateA).getTime();
  const timeB = new Date(dateB).getTime();
  const millisecondsPerDay = 1000 * 60 * 60 * 24;
  return Math.floor((timeA - timeB) / millisecondsPerDay);
}

/**
 * Calculates days of inventory coverage remaining based on average sales velocity.
 * Formula: stockOnHand / avgDailySales
 *
 * @param stockOnHand - Physical units currently in warehouse
 * @param avgDailySales - 30-day run-rate of units sold per day
 * @returns Days of coverage rounded to 2 decimal places (999 if zero sales)
 */
export function calculateDaysOfCover(stockOnHand: number, avgDailySales: number): number {
  if (avgDailySales <= 0) {
    return stockOnHand > 0 ? 999 : 0;
  }
  return Number((stockOnHand / avgDailySales).toFixed(2));
}

/**
 * Calculates the exact replenishment quantity needed to restore target coverage buffer.
 * Formula: max(0, targetStock - stockOnHand - incomingStock)
 * Where targetStock = targetCoverDays * avgDailySales
 *
 * @param stockOnHand - Units available in warehouse
 * @param incomingStock - Units already in transit on existing purchase orders
 * @param avgDailySales - Units sold per day
 * @param targetCoverDays - Desired inventory coverage buffer in days
 * @returns Non-negative integer reorder quantity
 */
export function calculateReorderQuantity(
  stockOnHand: number,
  incomingStock: number,
  avgDailySales: number,
  targetCoverDays: number
): number {
  const targetStock = Math.ceil(targetCoverDays * avgDailySales);
  const netDeficit = targetStock - stockOnHand - incomingStock;
  return Math.max(0, netDeficit);
}

/**
 * Categorizes operational inventory risk based on lead times and safety thresholds.
 *
 * - CRITICAL: Coverage is less than supplier lead time (stockout inevitable before shipment arrives).
 * - HIGH: Coverage breaches safety stock buffer.
 * - MEDIUM: Coverage is below target operating buffer.
 * - HEALTHY: Coverage meets or exceeds target operating buffer.
 */
export function classifyInventoryRisk(
  daysOfCover: number,
  leadTimeDays: number,
  safetyStockDays: number,
  targetCoverDays: number
): RiskLevel {
  if (daysOfCover < leadTimeDays) {
    return 'CRITICAL';
  }
  if (daysOfCover < leadTimeDays + safetyStockDays) {
    return 'HIGH';
  }
  if (daysOfCover < targetCoverDays) {
    return 'MEDIUM';
  }
  return 'HEALTHY';
}

/**
 * Evaluates full inventory catalog against lead time constraints and generates actionable exceptions.
 * Time Complexity: O(N) linear single-pass.
 */
export function evaluateInventoryRules(
  catalog: InventoryItem[],
  detectionTimestamp: string
): { enrichedItems: InventoryItem[]; exceptions: OperationalException[] } {
  const enrichedItems: InventoryItem[] = [];
  const exceptions: OperationalException[] = [];

  for (const item of catalog) {
    const daysOfCover = calculateDaysOfCover(item.stockOnHand, item.avgDailySales);
    const reorderQuantity = calculateReorderQuantity(
      item.stockOnHand,
      item.incomingStock,
      item.avgDailySales,
      item.targetCoverDays
    );
    const riskLevel = classifyInventoryRisk(
      daysOfCover,
      item.leadTimeDays,
      item.safetyStockDays,
      item.targetCoverDays
    );

    enrichedItems.push({
      ...item,
      daysOfCover,
      reorderQuantity,
      riskLevel,
    });

    if (riskLevel === 'CRITICAL' || riskLevel === 'HIGH' || riskLevel === 'MEDIUM') {
      const isCritical = riskLevel === 'CRITICAL';
      const potentialLostSales = Number(
        (item.avgDailySales * item.unitCost * 1.5 * Math.max(1, item.leadTimeDays)).toFixed(2)
      );

      exceptions.push({
        id: `EXC-INV-${item.sku}`,
        category: 'INVENTORY',
        severity: riskLevel,
        title: `${isCritical ? 'Critical Stockout Risk' : riskLevel === 'HIGH' ? 'Low Stock Warning' : 'Reorder Threshold Approaching'}: ${item.productName} (${item.sku})`,
        description: `Current stock on hand (${item.stockOnHand} units) provides only ${daysOfCover} days of coverage at an average sales rate of ${item.avgDailySales} units/day. Lead time from ${item.supplierName} is ${item.leadTimeDays} days with ${item.safetyStockDays} days safety stock required.`,
        dataEvidence: `StockOnHand: ${item.stockOnHand}, AvgDailySales: ${item.avgDailySales}, IncomingStock: ${item.incomingStock}, DaysOfCover: ${daysOfCover}d, LeadTime: ${item.leadTimeDays}d, SafetyThreshold: ${item.leadTimeDays + item.safetyStockDays}d`,
        businessImpact:
          daysOfCover < item.leadTimeDays
            ? `Estimated potential lost sales of $${potentialLostSales.toLocaleString()} during lead time replenishment gap.`
            : `Risk of stock depletion below ${item.safetyStockDays} days buffer stock within ${daysOfCover} days.`,
        recommendedAction: `Prepare purchase order for ${reorderQuantity} units from ${item.supplierName} (Est. cost: $${(reorderQuantity * item.unitCost).toLocaleString()}).`,
        confidenceLevel: isCritical ? 0.98 : 0.92,
        detectedAt: detectionTimestamp,
        relatedRecordId: item.sku,
        status: 'PENDING_REVIEW',
      });
    }
  }

  return { enrichedItems, exceptions };
}

/**
 * Scans customer orders and identifies SLA delivery breaches.
 * Time Complexity: O(N) linear single-pass.
 */
export function evaluateOrderRules(
  orders: OrderItem[],
  referenceDate: string,
  detectionTimestamp: string
): { enrichedOrders: OrderItem[]; exceptions: OperationalException[] } {
  const enrichedOrders: OrderItem[] = [];
  const exceptions: OperationalException[] = [];

  for (const order of orders) {
    const isPastPromisedDate = order.promisedDate < referenceDate;
    const isUnfulfilled = order.status !== 'delivered' && order.status !== 'cancelled';
    const isDelayed = isPastPromisedDate && isUnfulfilled;
    const delayDays = isDelayed ? Math.max(1, getDaysDiff(referenceDate, order.promisedDate)) : 0;

    enrichedOrders.push({
      ...order,
      isDelayed,
      delayDays,
    });

    if (isDelayed) {
      const severity: RiskLevel = delayDays >= 5 ? 'CRITICAL' : delayDays >= 2 ? 'HIGH' : 'MEDIUM';

      exceptions.push({
        id: `EXC-ORD-${order.orderId}`,
        category: 'ORDER',
        severity,
        title: `Delayed Customer Order: ${order.orderId} (${order.customerName})`,
        description: `Order ${order.orderId} was promised for delivery on ${order.promisedDate} but remains in '${order.status}' status. It is currently ${delayDays} days overdue.`,
        dataEvidence: `OrderId: ${order.orderId}, Status: ${order.status}, OrderDate: ${order.orderDate}, PromisedDate: ${order.promisedDate}, DelayDays: ${delayDays}d, Amount: $${order.amount}`,
        businessImpact: `Customer relationship risk and potential cancellation of order valued at $${order.amount.toLocaleString()}.`,
        recommendedAction: `Send proactive customer follow-up notification and expedite dispatch with logistics team.`,
        confidenceLevel: 0.96,
        detectedAt: detectionTimestamp,
        relatedRecordId: order.orderId,
        status: 'PENDING_REVIEW',
      });
    }
  }

  return { enrichedOrders, exceptions };
}

/**
 * Audits accounts receivable ledger to flag past-due unpaid invoices.
 * Time Complexity: O(N) linear single-pass.
 */
export function evaluateInvoiceRules(
  invoices: InvoiceItem[],
  referenceDate: string,
  detectionTimestamp: string
): { enrichedInvoices: InvoiceItem[]; exceptions: OperationalException[] } {
  const enrichedInvoices: InvoiceItem[] = [];
  const exceptions: OperationalException[] = [];

  for (const inv of invoices) {
    const isPastDueDate = inv.dueDate < referenceDate;
    const isUnsettled = inv.status === 'unpaid' || inv.status === 'overdue' || inv.status === 'disputed';
    const isOverdue = isPastDueDate && isUnsettled;
    const overdueDays = isOverdue ? Math.max(1, getDaysDiff(referenceDate, inv.dueDate)) : 0;

    enrichedInvoices.push({
      ...inv,
      isOverdue,
      overdueDays,
    });

    if (isOverdue) {
      const severity: RiskLevel =
        overdueDays >= 14 || inv.status === 'disputed'
          ? 'CRITICAL'
          : overdueDays >= 7
          ? 'HIGH'
          : 'MEDIUM';

      exceptions.push({
        id: `EXC-INV-${inv.invoiceId}`,
        category: 'RECEIVABLE',
        severity,
        title: `Overdue Receivable: ${inv.invoiceId} (${inv.customerName})`,
        description: `Invoice ${inv.invoiceId} for $${inv.amount.toLocaleString()} was due on ${inv.dueDate} (${overdueDays} days ago). Status is '${inv.status}'.`,
        dataEvidence: `InvoiceId: ${inv.invoiceId}, Customer: ${inv.customerName}, DueDate: ${inv.dueDate}, OverdueDays: ${overdueDays}d, Amount: $${inv.amount}, Status: ${inv.status}`,
        businessImpact: `Cash flow deficit of $${inv.amount.toLocaleString()} tied up past credit payment terms.`,
        recommendedAction: `Send automated payment reminder with outstanding ledger statement and payment link.`,
        confidenceLevel: 0.99,
        detectedAt: detectionTimestamp,
        relatedRecordId: inv.invoiceId,
        status: 'PENDING_REVIEW',
      });
    }
  }

  return { enrichedInvoices, exceptions };
}

/**
 * Detects abnormal sales velocity variations against historical baselines.
 * Uses an efficient O(S) aggregation pass with O(1) indexed catalog lookups.
 */
export function evaluateSalesAnomalies(
  sales: SaleRecord[],
  catalog: InventoryItem[],
  detectionTimestamp: string
): OperationalException[] {
  const exceptions: OperationalException[] = [];
  if (sales.length === 0) return exceptions;

  // Build O(1) catalog lookup table
  const catalogMap = new Map<string, InventoryItem>();
  catalog.forEach((item) => catalogMap.set(item.sku, item));

  // Determine chronological date distribution
  const distinctDates = Array.from(new Set(sales.map((s) => s.date))).sort().reverse();
  const recentWindowDates = new Set(distinctDates.slice(0, 3));

  // Single-pass SKU velocity aggregation
  const velocityMap = new Map<
    string,
    { totalUnits: number; recordCount: number; recentUnits: number; recentCount: number }
  >();

  for (const sale of sales) {
    let stat = velocityMap.get(sale.sku);
    if (!stat) {
      stat = { totalUnits: 0, recordCount: 0, recentUnits: 0, recentCount: 0 };
      velocityMap.set(sale.sku, stat);
    }

    stat.totalUnits += sale.units;
    stat.recordCount += 1;

    if (recentWindowDates.has(sale.date)) {
      stat.recentUnits += sale.units;
      stat.recentCount += 1;
    }
  }

  // Evaluate velocity thresholds
  velocityMap.forEach((stat, sku) => {
    if (stat.recordCount >= 7 && stat.recentCount > 0) {
      const historicalDailyRunRate = stat.totalUnits / stat.recordCount;
      const recentDailyRunRate = stat.recentUnits / stat.recentCount;
      const product = catalogMap.get(sku);
      const productName = product ? product.productName : sku;

      // Demand surge: > 1.8x baseline volume
      if (recentDailyRunRate > historicalDailyRunRate * 1.8 && historicalDailyRunRate >= 5) {
        exceptions.push({
          id: `EXC-SALE-SURGE-${sku}`,
          category: 'SALES',
          severity: 'HIGH',
          title: `Sales Velocity Surge: ${productName} (${sku})`,
          description: `Sales over the last 3 days averaged ${recentDailyRunRate.toFixed(1)} units/day, representing a ${Math.round((recentDailyRunRate / historicalDailyRunRate - 1) * 100)}% increase over normal run-rate (${historicalDailyRunRate.toFixed(1)} units/day).`,
          dataEvidence: `SKU: ${sku}, RecentAvg: ${recentDailyRunRate.toFixed(1)}/d, HistoricalAvg: ${historicalDailyRunRate.toFixed(1)}/d, 3-DayVolume: ${stat.recentUnits} units`,
          businessImpact: `Accelerated inventory depletion. Risk of premature stockout before next scheduled replenishment.`,
          recommendedAction: `Review demand forecast and increase target coverage buffer for ${sku}.`,
          confidenceLevel: 0.88,
          detectedAt: detectionTimestamp,
          relatedRecordId: sku,
          status: 'PENDING_REVIEW',
        });
      }

      // Demand stagnation: zero sales over recent window
      if (recentDailyRunRate === 0 && historicalDailyRunRate >= 5) {
        exceptions.push({
          id: `EXC-SALE-DROP-${sku}`,
          category: 'SALES',
          severity: 'MEDIUM',
          title: `Sales Velocity Stagnation: ${productName} (${sku})`,
          description: `Zero units sold over the last 3 days for ${productName}, compared to a historical baseline of ${historicalDailyRunRate.toFixed(1)} units/day.`,
          dataEvidence: `SKU: ${sku}, RecentAvg: 0/d, HistoricalAvg: ${historicalDailyRunRate.toFixed(1)}/d`,
          businessImpact: `Potential listing issue, pricing uncompetitiveness, or inventory holding cost accumulation.`,
          recommendedAction: `Inspect listing visibility, channel availability, and pricing compared to market.`,
          confidenceLevel: 0.85,
          detectedAt: detectionTimestamp,
          relatedRecordId: sku,
          status: 'PENDING_REVIEW',
        });
      }
    }
  });

  return exceptions;
}

/**
 * Calculates a multi-factor operational health score between 0 and 100.
 *
 * Weight Distribution:
 * - Inventory Coverage Buffer: 35%
 * - Customer Delivery SLA: 35%
 * - Accounts Receivable Quality: 30%
 */
export function calculateBusinessHealthScore(
  catalog: InventoryItem[],
  orders: OrderItem[],
  invoices: InvoiceItem[],
  exceptions: OperationalException[]
): BusinessHealthScore {
  if (catalog.length === 0 && orders.length === 0 && invoices.length === 0) {
    return {
      overallScore: 100,
      inventoryScore: 100,
      fulfillmentScore: 100,
      receivablesScore: 100,
      healthTier: 'EXCELLENT',
      summary: 'No operational data loaded yet. Baseline health 100%.',
    };
  }

  // 1. Inventory Component (35% weight)
  let inventoryScore = 100;
  if (catalog.length > 0) {
    const criticalCount = catalog.filter((i) => i.riskLevel === 'CRITICAL').length;
    const highCount = catalog.filter((i) => i.riskLevel === 'HIGH').length;
    const mediumCount = catalog.filter((i) => i.riskLevel === 'MEDIUM').length;
    const penaltyPerSku = (criticalCount * 25 + highCount * 12 + mediumCount * 4) / catalog.length;
    inventoryScore = Math.max(0, Math.min(100, Math.round(100 - penaltyPerSku * 2)));
  }

  // 2. Fulfillment Component (35% weight)
  let fulfillmentScore = 100;
  if (orders.length > 0) {
    const delayedCount = orders.filter((o) => o.isDelayed).length;
    const delayRatio = delayedCount / orders.length;
    fulfillmentScore = Math.max(0, Math.min(100, Math.round((1 - delayRatio) * 100)));
  }

  // 3. Receivables Component (30% weight)
  let receivablesScore = 100;
  if (invoices.length > 0) {
    const totalAmount = invoices.reduce((sum, inv) => sum + inv.amount, 0);
    const overdueAmount = invoices
      .filter((inv) => inv.isOverdue)
      .reduce((sum, inv) => sum + inv.amount, 0);
    const overdueRatio = totalAmount > 0 ? overdueAmount / totalAmount : 0;
    receivablesScore = Math.max(0, Math.min(100, Math.round((1 - overdueRatio) * 100)));
  }

  const overallScore = Math.round(
    inventoryScore * 0.35 + fulfillmentScore * 0.35 + receivablesScore * 0.3
  );

  let healthTier: BusinessHealthScore['healthTier'] = 'EXCELLENT';
  if (overallScore < 50) {
    healthTier = 'CRITICAL';
  } else if (overallScore < 70) {
    healthTier = 'NEEDS_ATTENTION';
  } else if (overallScore < 85) {
    healthTier = 'GOOD';
  }

  const criticalCount = exceptions.filter((e) => e.severity === 'CRITICAL').length;
  const highCount = exceptions.filter((e) => e.severity === 'HIGH').length;

  const summary =
    criticalCount > 0
      ? `Operational alert: ${criticalCount} critical and ${highCount} high-priority exceptions require immediate managerial intervention.`
      : highCount > 0
      ? `Operations stable with ${highCount} operational warnings being proactively addressed.`
      : `Operations healthy across inventory replenishment, order dispatch, and receivables collection.`;

  return {
    overallScore,
    inventoryScore,
    fulfillmentScore,
    receivablesScore,
    healthTier,
    summary,
  };
}
