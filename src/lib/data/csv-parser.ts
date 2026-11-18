import Papa from 'papaparse';
import {
  InventoryItemSchema,
  SaleRecordSchema,
  OrderItemSchema,
  InvoiceItemSchema,
  EXPECTED_CSV_HEADERS,
  MAX_FILE_SIZE_BYTES,
  MAX_ROW_COUNT,
} from './schemas';
import { InventoryItem, SaleRecord, OrderItem, InvoiceItem } from '@/types';

export interface ParseResult<T> {
  success: boolean;
  data: T[];
  errors: string[];
  totalRows: number;
}

export function validateCsvHeaders(actualHeaders: string[], expectedHeaders: readonly string[]): string[] {
  const normalizedActual = actualHeaders.map((h) => h.trim());
  const missing = expectedHeaders.filter((exp) => !normalizedActual.includes(exp));
  if (missing.length > 0) {
    return [`Missing required headers: ${missing.join(', ')}`];
  }
  return [];
}

export function parseInventoryCsv(csvString: string, byteSize = 0): ParseResult<InventoryItem> {
  if (byteSize > MAX_FILE_SIZE_BYTES) {
    return { success: false, data: [], errors: ['File size exceeds 2 MB limit.'], totalRows: 0 };
  }

  const parsed = Papa.parse<Record<string, string>>(csvString.trim(), {
    header: true,
    skipEmptyLines: 'greedy',
  });

  if (parsed.errors.length > 0) {
    return {
      success: false,
      data: [],
      errors: parsed.errors.map((e) => `CSV Parse error at row ${e.row}: ${e.message}`),
      totalRows: 0,
    };
  }

  const actualHeaders = parsed.meta.fields || [];
  const headerErrors = validateCsvHeaders(actualHeaders, EXPECTED_CSV_HEADERS.inventory);
  if (headerErrors.length > 0) {
    return { success: false, data: [], errors: headerErrors, totalRows: parsed.data.length };
  }

  if (parsed.data.length > MAX_ROW_COUNT) {
    return {
      success: false,
      data: [],
      errors: [`Row count (${parsed.data.length}) exceeds maximum allowable 20,000 rows.`],
      totalRows: parsed.data.length,
    };
  }

  const data: InventoryItem[] = [];
  const errors: string[] = [];
  const seenSkus = new Set<string>();

  parsed.data.forEach((row, index) => {
    const rowNum = index + 2; // account for header line
    const validation = InventoryItemSchema.safeParse(row);
    if (!validation.success) {
      const issueMsgs = validation.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ');
      errors.push(`Row ${rowNum}: ${issueMsgs}`);
    } else {
      const item = validation.data;
      if (seenSkus.has(item.sku.toUpperCase())) {
        errors.push(`Row ${rowNum}: Duplicate SKU detected '${item.sku}'`);
      } else {
        seenSkus.add(item.sku.toUpperCase());
        data.push(item);
      }
    }
  });

  return {
    success: errors.length === 0,
    data: errors.length === 0 ? data : [],
    errors,
    totalRows: parsed.data.length,
  };
}

export function parseSalesCsv(csvString: string, byteSize = 0): ParseResult<SaleRecord> {
  if (byteSize > MAX_FILE_SIZE_BYTES) {
    return { success: false, data: [], errors: ['File size exceeds 2 MB limit.'], totalRows: 0 };
  }

  const parsed = Papa.parse<Record<string, string>>(csvString.trim(), {
    header: true,
    skipEmptyLines: 'greedy',
  });

  if (parsed.errors.length > 0) {
    return {
      success: false,
      data: [],
      errors: parsed.errors.map((e) => `CSV Parse error at row ${e.row}: ${e.message}`),
      totalRows: 0,
    };
  }

  const actualHeaders = parsed.meta.fields || [];
  const headerErrors = validateCsvHeaders(actualHeaders, EXPECTED_CSV_HEADERS.sales);
  if (headerErrors.length > 0) {
    return { success: false, data: [], errors: headerErrors, totalRows: parsed.data.length };
  }

  if (parsed.data.length > MAX_ROW_COUNT) {
    return {
      success: false,
      data: [],
      errors: [`Row count (${parsed.data.length}) exceeds maximum allowable 20,000 rows.`],
      totalRows: parsed.data.length,
    };
  }

  const data: SaleRecord[] = [];
  const errors: string[] = [];

  parsed.data.forEach((row, index) => {
    const rowNum = index + 2;
    const validation = SaleRecordSchema.safeParse(row);
    if (!validation.success) {
      const issueMsgs = validation.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ');
      errors.push(`Row ${rowNum}: ${issueMsgs}`);
    } else {
      data.push(validation.data);
    }
  });

  return {
    success: errors.length === 0,
    data: errors.length === 0 ? data : [],
    errors,
    totalRows: parsed.data.length,
  };
}

export function parseOrdersCsv(csvString: string, byteSize = 0): ParseResult<OrderItem> {
  if (byteSize > MAX_FILE_SIZE_BYTES) {
    return { success: false, data: [], errors: ['File size exceeds 2 MB limit.'], totalRows: 0 };
  }

  const parsed = Papa.parse<Record<string, string>>(csvString.trim(), {
    header: true,
    skipEmptyLines: 'greedy',
  });

  if (parsed.errors.length > 0) {
    return {
      success: false,
      data: [],
      errors: parsed.errors.map((e) => `CSV Parse error at row ${e.row}: ${e.message}`),
      totalRows: 0,
    };
  }

  const actualHeaders = parsed.meta.fields || [];
  const headerErrors = validateCsvHeaders(actualHeaders, EXPECTED_CSV_HEADERS.orders);
  if (headerErrors.length > 0) {
    return { success: false, data: [], errors: headerErrors, totalRows: parsed.data.length };
  }

  if (parsed.data.length > MAX_ROW_COUNT) {
    return {
      success: false,
      data: [],
      errors: [`Row count (${parsed.data.length}) exceeds maximum allowable 20,000 rows.`],
      totalRows: parsed.data.length,
    };
  }

  const data: OrderItem[] = [];
  const errors: string[] = [];
  const seenOrderIds = new Set<string>();

  parsed.data.forEach((row, index) => {
    const rowNum = index + 2;
    const validation = OrderItemSchema.safeParse(row);
    if (!validation.success) {
      const issueMsgs = validation.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ');
      errors.push(`Row ${rowNum}: ${issueMsgs}`);
    } else {
      const order = validation.data;
      if (seenOrderIds.has(order.orderId.toUpperCase())) {
        errors.push(`Row ${rowNum}: Duplicate orderId detected '${order.orderId}'`);
      } else {
        seenOrderIds.add(order.orderId.toUpperCase());
        data.push(order);
      }
    }
  });

  return {
    success: errors.length === 0,
    data: errors.length === 0 ? data : [],
    errors,
    totalRows: parsed.data.length,
  };
}

export function parseInvoicesCsv(csvString: string, byteSize = 0): ParseResult<InvoiceItem> {
  if (byteSize > MAX_FILE_SIZE_BYTES) {
    return { success: false, data: [], errors: ['File size exceeds 2 MB limit.'], totalRows: 0 };
  }

  const parsed = Papa.parse<Record<string, string>>(csvString.trim(), {
    header: true,
    skipEmptyLines: 'greedy',
  });

  if (parsed.errors.length > 0) {
    return {
      success: false,
      data: [],
      errors: parsed.errors.map((e) => `CSV Parse error at row ${e.row}: ${e.message}`),
      totalRows: 0,
    };
  }

  const actualHeaders = parsed.meta.fields || [];
  const headerErrors = validateCsvHeaders(actualHeaders, EXPECTED_CSV_HEADERS.invoices);
  if (headerErrors.length > 0) {
    return { success: false, data: [], errors: headerErrors, totalRows: parsed.data.length };
  }

  if (parsed.data.length > MAX_ROW_COUNT) {
    return {
      success: false,
      data: [],
      errors: [`Row count (${parsed.data.length}) exceeds maximum allowable 20,000 rows.`],
      totalRows: parsed.data.length,
    };
  }

  const data: InvoiceItem[] = [];
  const errors: string[] = [];
  const seenInvoiceIds = new Set<string>();

  parsed.data.forEach((row, index) => {
    const rowNum = index + 2;
    const validation = InvoiceItemSchema.safeParse(row);
    if (!validation.success) {
      const issueMsgs = validation.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ');
      errors.push(`Row ${rowNum}: ${issueMsgs}`);
    } else {
      const inv = validation.data;
      if (seenInvoiceIds.has(inv.invoiceId.toUpperCase())) {
        errors.push(`Row ${rowNum}: Duplicate invoiceId detected '${inv.invoiceId}'`);
      } else {
        seenInvoiceIds.add(inv.invoiceId.toUpperCase());
        data.push(inv);
      }
    }
  });

  return {
    success: errors.length === 0,
    data: errors.length === 0 ? data : [],
    errors,
    totalRows: parsed.data.length,
  };
}
