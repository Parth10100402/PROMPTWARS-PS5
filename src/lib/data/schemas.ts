import { z } from 'zod';

export const InventoryItemSchema = z.object({
  sku: z.string().min(1, 'SKU is required').trim(),
  productName: z.string().min(1, 'Product name is required').trim(),
  category: z.string().min(1, 'Category is required').trim(),
  stockOnHand: z.coerce.number().min(0, 'Stock on hand must be >= 0'),
  avgDailySales: z.coerce.number().min(0, 'Avg daily sales must be >= 0'),
  leadTimeDays: z.coerce.number().min(0, 'Lead time must be >= 0'),
  safetyStockDays: z.coerce.number().min(0, 'Safety stock must be >= 0'),
  targetCoverDays: z.coerce.number().min(0, 'Target cover must be >= 0'),
  incomingStock: z.coerce.number().min(0, 'Incoming stock must be >= 0'),
  unitCost: z.coerce.number().min(0, 'Unit cost must be >= 0'),
  supplierName: z.string().min(1, 'Supplier name is required').trim(),
});

export const SaleRecordSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
  sku: z.string().min(1, 'SKU is required').trim(),
  units: z.coerce.number().int().min(0, 'Units sold must be >= 0'),
  revenue: z.coerce.number().min(0, 'Revenue must be >= 0'),
});

export const OrderItemSchema = z.object({
  orderId: z.string().min(1, 'Order ID is required').trim(),
  customerName: z.string().min(1, 'Customer name is required').trim(),
  orderDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Order date must be in YYYY-MM-DD format'),
  promisedDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Promised date must be in YYYY-MM-DD format'),
  status: z.enum(['pending', 'processing', 'shipped', 'delivered', 'cancelled'], {
    message: 'Status must be pending, processing, shipped, delivered, or cancelled',
  }),
  amount: z.coerce.number().min(0, 'Order amount must be >= 0'),
});

export const InvoiceItemSchema = z.object({
  invoiceId: z.string().min(1, 'Invoice ID is required').trim(),
  customerName: z.string().min(1, 'Customer name is required').trim(),
  issueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Issue date must be in YYYY-MM-DD format'),
  dueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Due date must be in YYYY-MM-DD format'),
  amount: z.coerce.number().min(0, 'Amount must be >= 0'),
  status: z.enum(['paid', 'unpaid', 'overdue', 'disputed'], {
    message: 'Status must be paid, unpaid, overdue, or disputed',
  }),
});

export const EXPECTED_CSV_HEADERS = {
  inventory: [
    'sku',
    'productName',
    'category',
    'stockOnHand',
    'avgDailySales',
    'leadTimeDays',
    'safetyStockDays',
    'targetCoverDays',
    'incomingStock',
    'unitCost',
    'supplierName',
  ],
  sales: ['date', 'sku', 'units', 'revenue'],
  orders: ['orderId', 'customerName', 'orderDate', 'promisedDate', 'status', 'amount'],
  invoices: ['invoiceId', 'customerName', 'issueDate', 'dueDate', 'amount', 'status'],
} as const;

export const MAX_FILE_SIZE_BYTES = 2 * 1024 * 1024; // 2 MB
export const MAX_ROW_COUNT = 20000;
