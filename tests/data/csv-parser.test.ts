import { describe, it, expect } from 'vitest';
import {
  parseInventoryCsv,
  parseOrdersCsv,
  parseInvoicesCsv,
  parseSalesCsv,
  validateCsvHeaders,
} from '@/lib/data/csv-parser';
import { EXPECTED_CSV_HEADERS } from '@/lib/data/schemas';

describe('CSV Parser and Validation Suite', () => {
  // Test 9: Empty dataset handling
  it('handles empty CSV input safely with empty array', () => {
    const res = parseInventoryCsv('');
    expect(res.data).toEqual([]);
    expect(res.success).toBe(false);
    expect(res.errors.length).toBeGreaterThan(0);
  });

  // Test 10: Duplicate record handling
  it('detects and rejects duplicate identifiers in CSV uploads', () => {
    const csvWithDuplicateSku = `sku,productName,category,stockOnHand,avgDailySales,leadTimeDays,safetyStockDays,targetCoverDays,incomingStock,unitCost,supplierName
SKU-999,Widget Alpha,Office,50,5,4,3,14,0,25.0,Supplier A
SKU-999,Widget Duplicate,Office,60,6,4,3,14,0,25.0,Supplier B`;

    const res = parseInventoryCsv(csvWithDuplicateSku);
    expect(res.success).toBe(false);
    expect(res.errors.some((e) => e.includes('Duplicate SKU detected'))).toBe(true);
    expect(res.data).toEqual([]);
  });

  it('detects duplicate order IDs in orders CSV', () => {
    const csvWithDuplicateOrder = `orderId,customerName,orderDate,promisedDate,status,amount
ORD-101,Acme Corp,2026-11-01,2026-11-10,pending,1500
ORD-101,Beta Corp,2026-11-02,2026-11-12,processing,2000`;

    const res = parseOrdersCsv(csvWithDuplicateOrder);
    expect(res.success).toBe(false);
    expect(res.errors.some((e) => e.includes('Duplicate orderId detected'))).toBe(true);
  });

  // Test 11: Invalid CSV rejection
  it('rejects CSV with missing required headers', () => {
    const invalidHeaderCsv = `sku,productName,category
SKU-01,Sample,Tools`;

    const res = parseInventoryCsv(invalidHeaderCsv);
    expect(res.success).toBe(false);
    expect(res.errors.some((e) => e.includes('Missing required headers'))).toBe(true);
  });

  it('rejects CSV rows with invalid data types or negative numbers', () => {
    const invalidDataCsv = `sku,productName,category,stockOnHand,avgDailySales,leadTimeDays,safetyStockDays,targetCoverDays,incomingStock,unitCost,supplierName
SKU-01,Sample,Tools,-10,invalid_number,4,3,14,0,25.0,Supplier A`;

    const res = parseInventoryCsv(invalidDataCsv);
    expect(res.success).toBe(false);
    expect(res.errors.length).toBeGreaterThan(0);
  });

  it('correctly parses valid CSV rows into typed records', () => {
    const validCsv = `sku,productName,category,stockOnHand,avgDailySales,leadTimeDays,safetyStockDays,targetCoverDays,incomingStock,unitCost,supplierName
SKU-001,Premium Keyboard,Electronics,40,8,4,3,14,10,45.0,Logitech`;

    const res = parseInventoryCsv(validCsv);
    expect(res.success).toBe(true);
    expect(res.data.length).toBe(1);
    expect(res.data[0].sku).toBe('SKU-001');
    expect(res.data[0].stockOnHand).toBe(40);
    expect(res.data[0].unitCost).toBe(45);
  });
});
