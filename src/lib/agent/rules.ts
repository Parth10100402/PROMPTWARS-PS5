import {
  InventoryItem,
  OrderItem,
  InvoiceItem,
  SaleRecord,
  OperationalException,
  RiskLevel,
  BusinessHealthScore,
} from '@/types';

// Helper to compute day difference
export function getDaysDiff(dateString1: string, dateString2: string): number {
  const d1 = new Date(dateString1);
  const d2 = new Date(dateString2);
  const diffTime = d1.getTime() - d2.getTime();
  return Math.floor(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Inventory Rule 1: Days of cover calculation
 * daysOfCover = stockOnHand / avgDailySales
 */
export function calculateDaysOfCover(stockOnHand: number, avgDailySales: number): number {
  if (avgDailySales <= 0) {
    return stockOnHand > 0 ? 999 : 0;
  }
  return Number((stockOnHand / avgDailySales).toFixed(2));
}

/**
 * Inventory Rule 2: Recommended reorder quantity
 * max(0, targetStock - stockOnHand - incomingStock)
 * targetStock = targetCoverDays * avgDailySales
 */
export function calculateReorderQuantity(
  stockOnHand: number,
  incomingStock: number,
  avgDailySales: number,
  targetCoverDays: number
): number {
  const targetStock = Math.ceil(targetCoverDays * avgDailySales);
  const shortfall = targetStock - stockOnHand - incomingStock;
  return Math.max(0, shortfall);
}

/**
 * Classify inventory risk level
 */
export function classifyInventoryRisk(
  daysOfCover: number,
  leadTimeDays: number,
  safetyStockDays: number,
  targetCoverDays: number
): RiskLevel {
  // If days of cover is less than or equal to lead time, product will stock out before reorder arrives!
  if (daysOfCover < leadTimeDays) {
    return 'CRITICAL';
  }
  // If days of cover breaches safety stock threshold
  if (daysOfCover < leadTimeDays + safetyStockDays) {
    return 'HIGH';
  }
  // If below target coverage
  if (daysOfCover < targetCoverDays) {
    return 'MEDIUM';
  }
  return 'HEALTHY';
}

/**
 * Evaluate all inventory items and return enriched items + exceptions
 */
export function evaluateInventoryRules(
  items: InventoryItem[],
  timestamp: string
): { enrichedItems: InventoryItem[]; exceptions: OperationalException[] } {
  const enrichedItems: InventoryItem[] = [];
  const exceptions: OperationalException[] = [];

  for (const item of items) {
    const daysOfCover = calculateDaysOfCover(item.stockOnHand, item.avgDailySales);
    const reorderQty = calculateReorderQuantity(
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
      reorderQuantity: reorderQty,
      riskLevel,
    });

    if (riskLevel === 'CRITICAL' || riskLevel === 'HIGH' || riskLevel === 'MEDIUM') {
      const estimatedStockoutDays = Math.max(0, daysOfCover);
      const isUrgent = riskLevel === 'CRITICAL';
      const potentialLostSales = Number(
        (item.avgDailySales * item.unitCost * 1.5 * Math.max(1, item.leadTimeDays)).toFixed(2)
      );

      exceptions.push({
        id: `EXC-INV-${item.sku}`,
        category: 'INVENTORY',
        severity: riskLevel,
        title: `${riskLevel === 'CRITICAL' ? 'Critical Stockout Risk' : riskLevel === 'HIGH' ? 'Low Stock Warning' : 'Reorder Threshold Approaching'}: ${item.productName} (${item.sku})`,
        description: `Current stock on hand (${item.stockOnHand} units) provides only ${daysOfCover} days of coverage at an average sales rate of ${item.avgDailySales} units/day. Lead time from ${item.supplierName} is ${item.leadTimeDays} days with ${item.safetyStockDays} days safety stock required.`,
        dataEvidence: `StockOnHand: ${item.stockOnHand}, AvgDailySales: ${item.avgDailySales}, IncomingStock: ${item.incomingStock}, DaysOfCover: ${daysOfCover}d, LeadTime: ${item.leadTimeDays}d, SafetyThreshold: ${item.leadTimeDays + item.safetyStockDays}d`,
        businessImpact:
          daysOfCover < item.leadTimeDays
            ? `Estimated potential lost sales of $${potentialLostSales.toLocaleString()} during lead time replenishment gap.`
            : `Risk of stock depletion below ${item.safetyStockDays} days buffer stock within ${daysOfCover} days.`,
        recommendedAction: `Prepare purchase order for ${reorderQty} units from ${item.supplierName} (Est. cost: $${(reorderQty * item.unitCost).toLocaleString()}).`,
        confidenceLevel: isUrgent ? 0.98 : 0.92,
        detectedAt: timestamp,
        relatedRecordId: item.sku,
        status: 'PENDING_REVIEW',
      });
    }
  }

  return { enrichedItems, exceptions };
}

/**
 * Order Rule: Detect delayed orders
 * promisedDate < referenceDate && status !== 'delivered' && status !== 'cancelled'
 */
export function evaluateOrderRules(
  orders: OrderItem[],
  referenceDate: string,
  timestamp: string
): { enrichedOrders: OrderItem[]; exceptions: OperationalException[] } {
  const enrichedOrders: OrderItem[] = [];
  const exceptions: OperationalException[] = [];

  for (const order of orders) {
    const isPastPromised = order.promisedDate < referenceDate;
    const isNotComplete = order.status !== 'delivered' && order.status !== 'cancelled';
    const isDelayed = isPastPromised && isNotComplete;
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
        detectedAt: timestamp,
        relatedRecordId: order.orderId,
        status: 'PENDING_REVIEW',
      });
    }
  }

  return { enrichedOrders, exceptions };
}

/**
 * Invoice Rule: Detect overdue unpaid invoices
 * dueDate < referenceDate && status !== 'paid'
 */
export function evaluateInvoiceRules(
  invoices: InvoiceItem[],
  referenceDate: string,
  timestamp: string
): { enrichedInvoices: InvoiceItem[]; exceptions: OperationalException[] } {
  const enrichedInvoices: InvoiceItem[] = [];
  const exceptions: OperationalException[] = [];

  for (const inv of invoices) {
    const isPastDue = inv.dueDate < referenceDate;
    const isUnpaid = inv.status === 'unpaid' || inv.status === 'overdue' || inv.status === 'disputed';
    const isOverdue = isPastDue && isUnpaid;
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
        detectedAt: timestamp,
        relatedRecordId: inv.invoiceId,
        status: 'PENDING_REVIEW',
      });
    }
  }

  return { enrichedInvoices, exceptions };
}

/**
 * Sales Rule: Detect abnormal sales volume surges or drops
 */
export function evaluateSalesAnomalies(
  sales: SaleRecord[],
  inventory: InventoryItem[],
  timestamp: string
): OperationalException[] {
  const exceptions: OperationalException[] = [];
  if (sales.length === 0) return exceptions;

  // Group sales by SKU
  const salesBySku: Record<string, { totalUnits: number; count: number; recentUnits: number; recentCount: number }> =
    {};

  // Sort dates descending
  const sortedDates = Array.from(new Set(sales.map((s) => s.date))).sort().reverse();
  const recent3Dates = new Set(sortedDates.slice(0, 3));

  sales.forEach((s) => {
    if (!salesBySku[s.sku]) {
      salesBySku[s.sku] = { totalUnits: 0, count: 0, recentUnits: 0, recentCount: 0 };
    }
    salesBySku[s.sku].totalUnits += s.units;
    salesBySku[s.sku].count += 1;
    if (recent3Dates.has(s.date)) {
      salesBySku[s.sku].recentUnits += s.units;
      salesBySku[s.sku].recentCount += 1;
    }
  });

  Object.entries(salesBySku).forEach(([sku, stat]) => {
    if (stat.count >= 7 && stat.recentCount > 0) {
      const historicalDailyAvg = stat.totalUnits / stat.count;
      const recentDailyAvg = stat.recentUnits / stat.recentCount;
      const product = inventory.find((i) => i.sku === sku);
      const productName = product ? product.productName : sku;

      // Surge anomaly: > 1.8x historical daily average
      if (recentDailyAvg > historicalDailyAvg * 1.8 && historicalDailyAvg >= 5) {
        exceptions.push({
          id: `EXC-SALE-SURGE-${sku}`,
          category: 'SALES',
          severity: 'HIGH',
          title: `Sales Velocity Surge: ${productName} (${sku})`,
          description: `Sales over the last 3 days averaged ${recentDailyAvg.toFixed(1)} units/day, representing a ${Math.round((recentDailyAvg / historicalDailyAvg - 1) * 100)}% increase over normal run-rate (${historicalDailyAvg.toFixed(1)} units/day).`,
          dataEvidence: `SKU: ${sku}, RecentAvg: ${recentDailyAvg.toFixed(1)}/d, HistoricalAvg: ${historicalDailyAvg.toFixed(1)}/d, 3-DayVolume: ${stat.recentUnits} units`,
          businessImpact: `Accelerated inventory depletion. Risk of premature stockout before next scheduled replenishment.`,
          recommendedAction: `Review demand forecast and increase target coverage buffer for ${sku}.`,
          confidenceLevel: 0.88,
          detectedAt: timestamp,
          relatedRecordId: sku,
          status: 'PENDING_REVIEW',
        });
      }

      // Drop anomaly: recentDailyAvg == 0 when historicalDailyAvg >= 5
      if (recentDailyAvg === 0 && historicalDailyAvg >= 5) {
        exceptions.push({
          id: `EXC-SALE-DROP-${sku}`,
          category: 'SALES',
          severity: 'MEDIUM',
          title: `Sales Velocity Stagnation: ${productName} (${sku})`,
          description: `Zero units sold over the last 3 days for ${productName}, compared to a historical baseline of ${historicalDailyAvg.toFixed(1)} units/day.`,
          dataEvidence: `SKU: ${sku}, RecentAvg: 0/d, HistoricalAvg: ${historicalDailyAvg.toFixed(1)}/d`,
          businessImpact: `Potential listing issue, pricing uncompetitiveness, or inventory holding cost accumulation.`,
          recommendedAction: `Inspect listing visibility, channel availability, and pricing compared to market.`,
          confidenceLevel: 0.85,
          detectedAt: timestamp,
          relatedRecordId: sku,
          status: 'PENDING_REVIEW',
        });
      }
    }
  });

  return exceptions;
}

/**
 * Calculate Business Health Score (0 - 100)
 */
export function calculateBusinessHealthScore(
  inventory: InventoryItem[],
  orders: OrderItem[],
  invoices: InvoiceItem[],
  exceptions: OperationalException[]
): BusinessHealthScore {
  if (inventory.length === 0 && orders.length === 0 && invoices.length === 0) {
    return {
      overallScore: 100,
      inventoryScore: 100,
      fulfillmentScore: 100,
      receivablesScore: 100,
      healthTier: 'EXCELLENT',
      summary: 'No operational data loaded yet. Baseline health 100%.',
    };
  }

  // 1. Inventory Score (35% weight)
  let invScore = 100;
  if (inventory.length > 0) {
    const criticalCount = inventory.filter((i) => i.riskLevel === 'CRITICAL').length;
    const highCount = inventory.filter((i) => i.riskLevel === 'HIGH').length;
    const mediumCount = inventory.filter((i) => i.riskLevel === 'MEDIUM').length;
    const penalty = (criticalCount * 25 + highCount * 12 + mediumCount * 4) / inventory.length;
    invScore = Math.max(0, Math.min(100, Math.round(100 - penalty * 2)));
  }

  // 2. Fulfillment Score (35% weight)
  let fulScore = 100;
  if (orders.length > 0) {
    const delayedCount = orders.filter((o) => o.isDelayed).length;
    const delayedRatio = delayedCount / orders.length;
    fulScore = Math.max(0, Math.min(100, Math.round((1 - delayedRatio) * 100)));
  }

  // 3. Receivables Score (30% weight)
  let recScore = 100;
  if (invoices.length > 0) {
    const totalAmount = invoices.reduce((sum, inv) => sum + inv.amount, 0);
    const overdueAmount = invoices
      .filter((inv) => inv.isOverdue)
      .reduce((sum, inv) => sum + inv.amount, 0);
    const overdueRatio = totalAmount > 0 ? overdueAmount / totalAmount : 0;
    recScore = Math.max(0, Math.min(100, Math.round((1 - overdueRatio) * 100)));
  }

  // Aggregate weighted score
  const overallScore = Math.round(invScore * 0.35 + fulScore * 0.35 + recScore * 0.3);

  let healthTier: BusinessHealthScore['healthTier'] = 'EXCELLENT';
  if (overallScore < 50) {
    healthTier = 'CRITICAL';
  } else if (overallScore < 70) {
    healthTier = 'NEEDS_ATTENTION';
  } else if (overallScore < 85) {
    healthTier = 'GOOD';
  }

  const criticalExceptions = exceptions.filter((e) => e.severity === 'CRITICAL').length;
  const highExceptions = exceptions.filter((e) => e.severity === 'HIGH').length;

  const summary =
    criticalExceptions > 0
      ? `Operational alert: ${criticalExceptions} critical and ${highExceptions} high-priority exceptions require immediate managerial intervention.`
      : highExceptions > 0
      ? `Operations stable with ${highExceptions} operational warnings being proactively addressed.`
      : `Operations healthy across inventory replenishment, order dispatch, and receivables collection.`;

  return {
    overallScore,
    inventoryScore: invScore,
    fulfillmentScore: fulScore,
    receivablesScore: recScore,
    healthTier,
    summary,
  };
}
