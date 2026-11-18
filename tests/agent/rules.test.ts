import { describe, it, expect } from 'vitest';
import {
  calculateDaysOfCover,
  calculateReorderQuantity,
  classifyInventoryRisk,
  evaluateInventoryRules,
  evaluateOrderRules,
  evaluateInvoiceRules,
  evaluateSalesAnomalies,
  calculateBusinessHealthScore,
} from '@/lib/agent/rules';
import { InventoryItem, OrderItem, InvoiceItem, SaleRecord } from '@/types';

describe('OpsPilot Deterministic Business Rules', () => {
  // Test 1: Low stock detection
  it('detects critically low stock when days of cover is below supplier lead time', () => {
    const item: InventoryItem = {
      sku: 'SKU-TEST-01',
      productName: 'Low Stock Widget',
      category: 'Electronics',
      stockOnHand: 8,
      avgDailySales: 12, // 8 / 12 = 0.67 days of cover
      leadTimeDays: 4,
      safetyStockDays: 3,
      targetCoverDays: 14,
      incomingStock: 0,
      unitCost: 50,
      supplierName: 'Acme Supplies',
    };

    const { enrichedItems, exceptions } = evaluateInventoryRules([item], '2026-11-18T00:00:00Z');
    expect(enrichedItems[0].riskLevel).toBe('CRITICAL');
    expect(exceptions.length).toBe(1);
    expect(exceptions[0].severity).toBe('CRITICAL');
    expect(exceptions[0].relatedRecordId).toBe('SKU-TEST-01');
  });

  // Test 2: Healthy inventory detection
  it('marks inventory as healthy when stock on hand exceeds target coverage', () => {
    const item: InventoryItem = {
      sku: 'SKU-HEALTHY-01',
      productName: 'Well Stocked Widget',
      category: 'Hardware',
      stockOnHand: 300,
      avgDailySales: 10, // 300 / 10 = 30 days cover
      leadTimeDays: 4,
      safetyStockDays: 3,
      targetCoverDays: 20,
      incomingStock: 0,
      unitCost: 10,
      supplierName: 'Acme Supplies',
    };

    const { enrichedItems, exceptions } = evaluateInventoryRules([item], '2026-11-18T00:00:00Z');
    expect(enrichedItems[0].riskLevel).toBe('HEALTHY');
    expect(exceptions.length).toBe(0);
  });

  // Test 3: Inventory coverage calculation formula: daysOfCover = stockOnHand / avgDailySales
  it('calculates daysOfCover correctly according to the formula', () => {
    expect(calculateDaysOfCover(100, 20)).toBe(5);
    expect(calculateDaysOfCover(8, 12)).toBe(0.67);
    expect(calculateDaysOfCover(0, 10)).toBe(0);
    expect(calculateDaysOfCover(50, 0)).toBe(999); // Safe zero divisor protection
  });

  // Test 4: Reorder quantity calculation formula: max(0, targetStock - stockOnHand - incomingStock)
  it('calculates reorder quantity using target cover, stock on hand, and incoming stock', () => {
    // targetStock = 14 days * 12 units/day = 168
    // shortfall = 168 - 8 (stock) - 0 (incoming) = 160
    const reorder1 = calculateReorderQuantity(8, 0, 12, 14);
    expect(reorder1).toBe(160);

    // With incoming stock of 50: 168 - 8 - 50 = 110
    const reorder2 = calculateReorderQuantity(8, 50, 12, 14);
    expect(reorder2).toBe(110);

    // When already sufficient: 100 stockOnHand, target 50 -> max(0, negative) = 0
    const reorder3 = calculateReorderQuantity(100, 0, 5, 10);
    expect(reorder3).toBe(0);
  });

  // Test 5: Delayed order detection
  it('detects orders past promised delivery date that are not delivered or cancelled', () => {
    const orders: OrderItem[] = [
      {
        orderId: 'ORD-DELAYED-1',
        customerName: 'Acme Corp',
        orderDate: '2026-11-01',
        promisedDate: '2026-11-10',
        status: 'processing',
        amount: 2500,
      },
      {
        orderId: 'ORD-ONTIME-1',
        customerName: 'Beta LLC',
        orderDate: '2026-11-15',
        promisedDate: '2026-11-25',
        status: 'pending',
        amount: 1200,
      },
      {
        orderId: 'ORD-DELIVERED-PAST',
        customerName: 'Gamma Inc',
        orderDate: '2026-11-01',
        promisedDate: '2026-11-05',
        status: 'delivered', // Delivered should not be flagged as delayed
        amount: 3000,
      },
    ];

    const { enrichedOrders, exceptions } = evaluateOrderRules(orders, '2026-11-18', '2026-11-18T00:00:00Z');
    expect(enrichedOrders[0].isDelayed).toBe(true);
    expect(enrichedOrders[0].delayDays).toBe(8);
    expect(enrichedOrders[1].isDelayed).toBe(false);
    expect(enrichedOrders[2].isDelayed).toBe(false);
    expect(exceptions.length).toBe(1);
    expect(exceptions[0].relatedRecordId).toBe('ORD-DELAYED-1');
  });

  // Test 6: Paid invoice exclusion
  it('excludes paid invoices past due date from overdue exceptions', () => {
    const invoices: InvoiceItem[] = [
      {
        invoiceId: 'INV-PAID-OLD',
        customerName: 'Delta Systems',
        issueDate: '2026-10-01',
        dueDate: '2026-10-31',
        amount: 4500,
        status: 'paid', // Must NOT trigger exception
      },
    ];

    const { enrichedInvoices, exceptions } = evaluateInvoiceRules(invoices, '2026-11-18', '2026-11-18T00:00:00Z');
    expect(enrichedInvoices[0].isOverdue).toBe(false);
    expect(exceptions.length).toBe(0);
  });

  // Test 7: Overdue payment detection
  it('detects unpaid invoices past due date and categorizes urgency', () => {
    const invoices: InvoiceItem[] = [
      {
        invoiceId: 'INV-OVERDUE-1',
        customerName: 'Epsilon Tech',
        issueDate: '2026-10-15',
        dueDate: '2026-11-01',
        amount: 8000,
        status: 'unpaid',
      },
    ];

    const { enrichedInvoices, exceptions } = evaluateInvoiceRules(invoices, '2026-11-18', '2026-11-18T00:00:00Z');
    expect(enrichedInvoices[0].isOverdue).toBe(true);
    expect(enrichedInvoices[0].overdueDays).toBe(17);
    expect(exceptions.length).toBe(1);
    expect(exceptions[0].severity).toBe('CRITICAL');
  });

  // Test 8: Sales anomaly detection
  it('detects demand surges exceeding 1.8x baseline', () => {
    const inventory: InventoryItem[] = [
      {
        sku: 'SKU-ANOMALY-1',
        productName: 'Surging Widget',
        category: 'Electronics',
        stockOnHand: 100,
        avgDailySales: 10,
        leadTimeDays: 4,
        safetyStockDays: 3,
        targetCoverDays: 14,
        incomingStock: 0,
        unitCost: 20,
        supplierName: 'Acme',
      },
    ];

    // Historical 10 units/day for 10 days, then recent 3 days surge to 30 units/day
    const sales: SaleRecord[] = [];
    for (let i = 1; i <= 14; i++) {
      const d = `2026-11-${String(i).padStart(2, '0')}`;
      sales.push({
        date: d,
        sku: 'SKU-ANOMALY-1',
        units: i >= 12 ? 30 : 10, // days 12, 13, 14 are recent 3 dates
        revenue: i >= 12 ? 600 : 200,
      });
    }

    const exceptions = evaluateSalesAnomalies(sales, inventory, '2026-11-18T00:00:00Z');
    expect(exceptions.length).toBe(1);
    expect(exceptions[0].id).toContain('EXC-SALE-SURGE-SKU-ANOMALY-1');
  });

  // Test 9: Edge case - Zero stock and zero sales safety
  it('safely handles zero stock and zero average daily sales without throwing', () => {
    expect(calculateDaysOfCover(0, 0)).toBe(0);
    expect(calculateDaysOfCover(100, 0)).toBe(999);
    expect(calculateReorderQuantity(0, 0, 0, 14)).toBe(0);
  });

  // Test 10: Boundary test - Orders on exact promised date are not flagged as delayed
  it('does not flag orders as delayed when current date equals promised date', () => {
    const orders: OrderItem[] = [
      {
        orderId: 'ORD-EXACT-DATE',
        customerName: 'Punctual Retailer',
        orderDate: '2026-11-10',
        promisedDate: '2026-11-18', // Today is 2026-11-18
        status: 'processing',
        amount: 1200,
      },
    ];

    const { enrichedOrders, exceptions } = evaluateOrderRules(orders, '2026-11-18', '2026-11-18T00:00:00Z');
    expect(enrichedOrders[0].isDelayed).toBe(false);
    expect(exceptions.length).toBe(0);
  });

  // Test 11: Boundary test - Invoices on exact due date are not flagged as overdue
  it('does not flag invoices as overdue when current date equals due date', () => {
    const invoices: InvoiceItem[] = [
      {
        invoiceId: 'INV-EXACT-DATE',
        customerName: 'Punctual Payer',
        issueDate: '2026-10-18',
        dueDate: '2026-11-18', // Due today
        amount: 3500,
        status: 'unpaid',
      },
    ];

    const { enrichedInvoices, exceptions } = evaluateInvoiceRules(invoices, '2026-11-18', '2026-11-18T00:00:00Z');
    expect(enrichedInvoices[0].isOverdue).toBe(false);
    expect(exceptions.length).toBe(0);
  });

  // Test 12: Business Health Score bounds and tier transitions
  it('accurately transitions health tiers based on cumulative operational exceptions', () => {
    const criticalCatalog: InventoryItem[] = [
      {
        sku: 'SKU-CRIT-1',
        productName: 'Empty Stock Part',
        category: 'Parts',
        stockOnHand: 1,
        avgDailySales: 10,
        leadTimeDays: 7,
        safetyStockDays: 4,
        targetCoverDays: 20,
        incomingStock: 0,
        unitCost: 100,
        supplierName: 'Acme',
        riskLevel: 'CRITICAL',
      },
    ];

    const delayedOrders: OrderItem[] = [
      {
        orderId: 'ORD-LATE-1',
        customerName: 'Customer A',
        orderDate: '2026-11-01',
        promisedDate: '2026-11-05',
        status: 'processing',
        amount: 10000,
        isDelayed: true,
        delayDays: 13,
      },
    ];

    const overdueInvoices: InvoiceItem[] = [
      {
        invoiceId: 'INV-LATE-1',
        customerName: 'Customer A',
        issueDate: '2026-10-01',
        dueDate: '2026-10-25',
        amount: 20000,
        status: 'unpaid',
        isOverdue: true,
        overdueDays: 24,
      },
    ];

    const score = calculateBusinessHealthScore(criticalCatalog, delayedOrders, overdueInvoices, [
      {
        id: 'EXC-1',
        category: 'INVENTORY',
        severity: 'CRITICAL',
        title: 'Critical Stockout',
        description: 'Test',
        dataEvidence: 'Test',
        businessImpact: 'Test',
        recommendedAction: 'Test',
        confidenceLevel: 0.99,
        detectedAt: '2026-11-18T00:00:00Z',
        relatedRecordId: 'SKU-CRIT-1',
        status: 'PENDING_REVIEW',
      },
    ]);

    expect(score.overallScore).toBeLessThan(50);
    expect(score.healthTier).toBe('CRITICAL');
    expect(score.summary).toContain('1 critical');
  });
});
