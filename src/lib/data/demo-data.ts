import { InventoryItem, SaleRecord, OrderItem, InvoiceItem } from '@/types';

// Anchor date for realistic deterministic calculations: 2026-11-18
export const DEMO_ANCHOR_DATE = '2026-11-18';

export const DEMO_INVENTORY: InventoryItem[] = [
  // 1. Critical stockout risk: 8 units, 12/day, lead time 4 days -> 0.67 days of cover
  {
    sku: 'SKU-101',
    productName: 'Ergonomic Desk Pro',
    category: 'Office Furniture',
    stockOnHand: 8,
    avgDailySales: 12,
    leadTimeDays: 4,
    safetyStockDays: 3,
    targetCoverDays: 14,
    incomingStock: 0,
    unitCost: 145.0,
    supplierName: 'Apex Industrial Supplies',
  },
  // 2. Critical stockout risk: 14 units, 18/day, lead time 5 days -> 0.78 days cover
  {
    sku: 'SKU-102',
    productName: 'USB-C Ultra Dock 12-in-1',
    category: 'Electronics',
    stockOnHand: 14,
    avgDailySales: 18,
    leadTimeDays: 5,
    safetyStockDays: 4,
    targetCoverDays: 20,
    incomingStock: 10,
    unitCost: 62.5,
    supplierName: 'Vanguard Electronics',
  },
  // 3. High risk: 42 units, 15/day -> 2.8 days cover, below lead time (3) + safety stock (3) = 6
  {
    sku: 'SKU-103',
    productName: 'Mechanical Backlit Keyboard',
    category: 'Electronics',
    stockOnHand: 42,
    avgDailySales: 15,
    leadTimeDays: 3,
    safetyStockDays: 3,
    targetCoverDays: 14,
    incomingStock: 0,
    unitCost: 38.0,
    supplierName: 'Vanguard Electronics',
  },
  // 4. High risk: 35 units, 10/day -> 3.5 days cover, lead time 4 + safety 3 = 7
  {
    sku: 'SKU-104',
    productName: 'A4 Multi-Purpose Copy Paper (Carton)',
    category: 'Office Supplies',
    stockOnHand: 35,
    avgDailySales: 10,
    leadTimeDays: 4,
    safetyStockDays: 3,
    targetCoverDays: 21,
    incomingStock: 15,
    unitCost: 28.0,
    supplierName: 'Pacific Rim Logistics',
  },
  // 5. Medium risk: 75 units, 8/day -> 9.38 days cover, target 18 days
  {
    sku: 'SKU-105',
    productName: 'Thermal Receipt Rolls (50-pack)',
    category: 'Packaging & Retail',
    stockOnHand: 75,
    avgDailySales: 8,
    leadTimeDays: 5,
    safetyStockDays: 4,
    targetCoverDays: 18,
    incomingStock: 0,
    unitCost: 19.5,
    supplierName: 'Horizon Packaging Ltd',
  },
  // 6. Medium risk: 120 units, 12/day -> 10 days cover, target 21 days
  {
    sku: 'SKU-106',
    productName: 'Heavy-Duty Packing Tape (36 rolls)',
    category: 'Packaging & Retail',
    stockOnHand: 120,
    avgDailySales: 12,
    leadTimeDays: 6,
    safetyStockDays: 5,
    targetCoverDays: 21,
    incomingStock: 40,
    unitCost: 32.0,
    supplierName: 'Horizon Packaging Ltd',
  },
  // 7. Healthy
  {
    sku: 'SKU-107',
    productName: 'Wireless Bluetooth Mouse M2',
    category: 'Electronics',
    stockOnHand: 280,
    avgDailySales: 9,
    leadTimeDays: 4,
    safetyStockDays: 4,
    targetCoverDays: 25,
    incomingStock: 50,
    unitCost: 18.0,
    supplierName: 'Vanguard Electronics',
  },
  // 8. Healthy
  {
    sku: 'SKU-108',
    productName: 'Adjustable Monitor Arm Dual',
    category: 'Office Furniture',
    stockOnHand: 150,
    avgDailySales: 5,
    leadTimeDays: 7,
    safetyStockDays: 5,
    targetCoverDays: 28,
    incomingStock: 0,
    unitCost: 48.0,
    supplierName: 'Apex Industrial Supplies',
  },
  // 9. Healthy
  {
    sku: 'SKU-109',
    productName: 'Corrugated Shipping Boxes (Medium 25pk)',
    category: 'Packaging & Retail',
    stockOnHand: 450,
    avgDailySales: 15,
    leadTimeDays: 3,
    safetyStockDays: 3,
    targetCoverDays: 25,
    incomingStock: 100,
    unitCost: 22.0,
    supplierName: 'Horizon Packaging Ltd',
  },
  // 10. Healthy
  {
    sku: 'SKU-110',
    productName: 'High-Lumen LED Desk Lamp',
    category: 'Office Supplies',
    stockOnHand: 190,
    avgDailySales: 6,
    leadTimeDays: 5,
    safetyStockDays: 4,
    targetCoverDays: 24,
    incomingStock: 0,
    unitCost: 24.5,
    supplierName: 'Midwest Wholesale Co',
  },
  // 11. Critical: 5 units, 8/day, lead time 4
  {
    sku: 'SKU-111',
    productName: 'Direct Thermal Barcode Labels (4x6)',
    category: 'Packaging & Retail',
    stockOnHand: 5,
    avgDailySales: 8,
    leadTimeDays: 4,
    safetyStockDays: 3,
    targetCoverDays: 20,
    incomingStock: 0,
    unitCost: 16.0,
    supplierName: 'Horizon Packaging Ltd',
  },
  // 12. Healthy
  {
    sku: 'SKU-112',
    productName: 'CAT6 Ethernet Cable (1000ft Spool)',
    category: 'Electronics',
    stockOnHand: 90,
    avgDailySales: 3,
    leadTimeDays: 5,
    safetyStockDays: 4,
    targetCoverDays: 30,
    incomingStock: 20,
    unitCost: 85.0,
    supplierName: 'Vanguard Electronics',
  },
  // 13. Healthy
  {
    sku: 'SKU-113',
    productName: 'Gel Comfort Anti-Fatigue Floor Mat',
    category: 'Office Furniture',
    stockOnHand: 85,
    avgDailySales: 3,
    leadTimeDays: 6,
    safetyStockDays: 4,
    targetCoverDays: 28,
    incomingStock: 0,
    unitCost: 34.0,
    supplierName: 'Apex Industrial Supplies',
  },
  // 14. High risk: 22 units, 7/day -> 3.14 days cover, lead time 4 + safety 3 = 7
  {
    sku: 'SKU-114',
    productName: 'Laser Jet Black Toner Cartridge',
    category: 'Office Supplies',
    stockOnHand: 22,
    avgDailySales: 7,
    leadTimeDays: 4,
    safetyStockDays: 3,
    targetCoverDays: 21,
    incomingStock: 0,
    unitCost: 55.0,
    supplierName: 'Midwest Wholesale Co',
  },
  // 15. Healthy
  {
    sku: 'SKU-115',
    productName: 'Stapler Heavy-Duty 100-Sheet Capacity',
    category: 'Office Supplies',
    stockOnHand: 140,
    avgDailySales: 4,
    leadTimeDays: 4,
    safetyStockDays: 3,
    targetCoverDays: 30,
    incomingStock: 0,
    unitCost: 15.0,
    supplierName: 'Pacific Rim Logistics',
  },
  // 16. Healthy
  {
    sku: 'SKU-116',
    productName: 'Bubble Cushioning Wrap (24in x 250ft)',
    category: 'Packaging & Retail',
    stockOnHand: 210,
    avgDailySales: 7,
    leadTimeDays: 4,
    safetyStockDays: 4,
    targetCoverDays: 25,
    incomingStock: 50,
    unitCost: 26.0,
    supplierName: 'Horizon Packaging Ltd',
  },
  // 17. Healthy
  {
    sku: 'SKU-117',
    productName: 'USB Noise-Cancelling Office Headset',
    category: 'Electronics',
    stockOnHand: 175,
    avgDailySales: 6,
    leadTimeDays: 5,
    safetyStockDays: 4,
    targetCoverDays: 24,
    incomingStock: 0,
    unitCost: 35.0,
    supplierName: 'Vanguard Electronics',
  },
  // 18. Healthy
  {
    sku: 'SKU-118',
    productName: 'Heavy Steel File Cabinet 3-Drawer',
    category: 'Office Furniture',
    stockOnHand: 48,
    avgDailySales: 2,
    leadTimeDays: 8,
    safetyStockDays: 5,
    targetCoverDays: 30,
    incomingStock: 10,
    unitCost: 165.0,
    supplierName: 'Apex Industrial Supplies',
  },
  // 19. Healthy
  {
    sku: 'SKU-119',
    productName: 'Whiteboard Magnetic 48x36 Porcelain',
    category: 'Office Supplies',
    stockOnHand: 65,
    avgDailySales: 2,
    leadTimeDays: 6,
    safetyStockDays: 4,
    targetCoverDays: 28,
    incomingStock: 0,
    unitCost: 72.0,
    supplierName: 'Midwest Wholesale Co',
  },
  // 20. Healthy
  {
    sku: 'SKU-120',
    productName: 'Heavy Duty Plastic Pallets (Stackable)',
    category: 'Packaging & Retail',
    stockOnHand: 130,
    avgDailySales: 4,
    leadTimeDays: 7,
    safetyStockDays: 5,
    targetCoverDays: 30,
    incomingStock: 25,
    unitCost: 45.0,
    supplierName: 'Pacific Rim Logistics',
  },
  // 21. Healthy
  {
    sku: 'SKU-121',
    productName: 'Industrial Hand Truck 600lb Capacity',
    category: 'Packaging & Retail',
    stockOnHand: 40,
    avgDailySales: 1,
    leadTimeDays: 7,
    safetyStockDays: 4,
    targetCoverDays: 35,
    incomingStock: 0,
    unitCost: 95.0,
    supplierName: 'Apex Industrial Supplies',
  },
];

// Generate 30+ days of sales records ending on DEMO_ANCHOR_DATE
export const DEMO_SALES: SaleRecord[] = (() => {
  const records: SaleRecord[] = [];
  const skus = DEMO_INVENTORY.map((i) => i.sku);

  // Generate for past 35 days (from 2026-10-14 to 2026-11-17)
  const baseDate = new Date('2026-11-18');
  for (let i = 35; i >= 1; i--) {
    const curDate = new Date(baseDate);
    curDate.setDate(baseDate.getDate() - i);
    const dateStr = curDate.toISOString().split('T')[0];

    skus.forEach((sku, sIdx) => {
      const invItem = DEMO_INVENTORY.find((it) => it.sku === sku)!;
      let units = Math.max(1, Math.round(invItem.avgDailySales + (Math.sin(i + sIdx) * 2)));

      // Intentional anomaly: Spike on SKU-101 in recent 3 days (demand surge causing stockout)
      if (sku === 'SKU-101' && i <= 3) {
        units = 28; // massive surge compared to 12 avg
      }
      // Intentional anomaly: Sudden drop to 0 on SKU-107 in last 4 days
      if (sku === 'SKU-107' && i <= 4) {
        units = 0;
      }

      const revenue = Number((units * invItem.unitCost * 1.45).toFixed(2));
      records.push({
        date: dateStr,
        sku,
        units,
        revenue,
      });
    });
  }
  return records;
})();

export const DEMO_ORDERS: OrderItem[] = [
  // DELAYED ORDER 1: promised 2026-11-12, today is 2026-11-18 (6 days delayed)
  {
    orderId: 'ORD-8921',
    customerName: 'Meridian Logistics Corp',
    orderDate: '2026-11-05',
    promisedDate: '2026-11-12',
    status: 'processing',
    amount: 4320.0,
  },
  // DELAYED ORDER 2: promised 2026-11-14, 4 days delayed
  {
    orderId: 'ORD-8925',
    customerName: 'BlueSky Healthcare Supplies',
    orderDate: '2026-11-06',
    promisedDate: '2026-11-14',
    status: 'shipped',
    amount: 1850.5,
  },
  // DELAYED ORDER 3: promised 2026-11-16, 2 days delayed
  {
    orderId: 'ORD-8930',
    customerName: 'Summit Construction Group',
    orderDate: '2026-11-08',
    promisedDate: '2026-11-16',
    status: 'pending',
    amount: 6780.0,
  },
  // DELAYED ORDER 4: promised 2026-11-15, 3 days delayed
  {
    orderId: 'ORD-8933',
    customerName: 'Apex Educational Academy',
    orderDate: '2026-11-07',
    promisedDate: '2026-11-15',
    status: 'processing',
    amount: 940.0,
  },
  // Normal on-time or upcoming orders
  {
    orderId: 'ORD-8940',
    customerName: 'Omni Retail Partners',
    orderDate: '2026-11-14',
    promisedDate: '2026-11-20',
    status: 'processing',
    amount: 5200.0,
  },
  {
    orderId: 'ORD-8941',
    customerName: 'Nexus Tech Innovations',
    orderDate: '2026-11-15',
    promisedDate: '2026-11-21',
    status: 'pending',
    amount: 3450.0,
  },
  {
    orderId: 'ORD-8942',
    customerName: 'Prairie Commercial Foods',
    orderDate: '2026-11-16',
    promisedDate: '2026-11-22',
    status: 'processing',
    amount: 2100.0,
  },
  {
    orderId: 'ORD-8943',
    customerName: 'Silverline Manufacturing',
    orderDate: '2026-11-16',
    promisedDate: '2026-11-24',
    status: 'pending',
    amount: 8900.0,
  },
  {
    orderId: 'ORD-8944',
    customerName: 'Cascade Office Depot',
    orderDate: '2026-11-17',
    promisedDate: '2026-11-25',
    status: 'pending',
    amount: 1420.0,
  },
  {
    orderId: 'ORD-8910',
    customerName: 'Pinnacle Distribution',
    orderDate: '2026-11-01',
    promisedDate: '2026-11-08',
    status: 'delivered',
    amount: 7200.0,
  },
  {
    orderId: 'ORD-8912',
    customerName: 'Highland Hospitality',
    orderDate: '2026-11-02',
    promisedDate: '2026-11-09',
    status: 'delivered',
    amount: 3100.0,
  },
  {
    orderId: 'ORD-8915',
    customerName: 'Metro Urban Grocers',
    orderDate: '2026-11-03',
    promisedDate: '2026-11-10',
    status: 'delivered',
    amount: 4890.0,
  },
  {
    orderId: 'ORD-8918',
    customerName: 'Beacon Legal Services',
    orderDate: '2026-11-04',
    promisedDate: '2026-11-11',
    status: 'delivered',
    amount: 1250.0,
  },
  {
    orderId: 'ORD-8902',
    customerName: 'Vanguard Retail Chain',
    orderDate: '2026-10-25',
    promisedDate: '2026-11-02',
    status: 'cancelled',
    amount: 5400.0,
  },
  {
    orderId: 'ORD-8945',
    customerName: 'Greenfield Botanical Co',
    orderDate: '2026-11-17',
    promisedDate: '2026-11-23',
    status: 'processing',
    amount: 1980.0,
  },
  {
    orderId: 'ORD-8946',
    customerName: 'Zenith Logistics East',
    orderDate: '2026-11-17',
    promisedDate: '2026-11-26',
    status: 'pending',
    amount: 6240.0,
  },
];

export const DEMO_INVOICES: InvoiceItem[] = [
  // OVERDUE INVOICE 1: due 2026-11-02 (16 days overdue)
  {
    invoiceId: 'INV-4401',
    customerName: 'Meridian Logistics Corp',
    issueDate: '2026-10-02',
    dueDate: '2026-11-02',
    amount: 12450.0,
    status: 'unpaid',
  },
  // OVERDUE INVOICE 2: due 2026-11-08 (10 days overdue)
  {
    invoiceId: 'INV-4405',
    customerName: 'Summit Construction Group',
    issueDate: '2026-10-08',
    dueDate: '2026-11-08',
    amount: 8720.0,
    status: 'overdue',
  },
  // OVERDUE INVOICE 3: due 2026-11-14 (4 days overdue)
  {
    invoiceId: 'INV-4410',
    customerName: 'Omni Retail Partners',
    issueDate: '2026-10-15',
    dueDate: '2026-11-14',
    amount: 5400.0,
    status: 'unpaid',
  },
  // OVERDUE INVOICE 4: disputed & overdue
  {
    invoiceId: 'INV-4412',
    customerName: 'Beacon Legal Services',
    issueDate: '2026-10-10',
    dueDate: '2026-11-10',
    amount: 1850.0,
    status: 'disputed',
  },
  // Paid on time
  {
    invoiceId: 'INV-4390',
    customerName: 'Pinnacle Distribution',
    issueDate: '2026-09-25',
    dueDate: '2026-10-25',
    amount: 9800.0,
    status: 'paid',
  },
  {
    invoiceId: 'INV-4395',
    customerName: 'Highland Hospitality',
    issueDate: '2026-10-01',
    dueDate: '2026-10-31',
    amount: 4500.0,
    status: 'paid',
  },
  {
    invoiceId: 'INV-4398',
    customerName: 'Metro Urban Grocers',
    issueDate: '2026-10-05',
    dueDate: '2026-11-04',
    amount: 6300.0,
    status: 'paid',
  },
  // Upcoming due dates (healthy)
  {
    invoiceId: 'INV-4418',
    customerName: 'Prairie Commercial Foods',
    issueDate: '2026-10-25',
    dueDate: '2026-11-25',
    amount: 4100.0,
    status: 'unpaid',
  },
  {
    invoiceId: 'INV-4420',
    customerName: 'Nexus Tech Innovations',
    issueDate: '2026-10-28',
    dueDate: '2026-11-28',
    amount: 7200.0,
    status: 'unpaid',
  },
  {
    invoiceId: 'INV-4425',
    customerName: 'Silverline Manufacturing',
    issueDate: '2026-11-01',
    dueDate: '2026-12-01',
    amount: 11500.0,
    status: 'unpaid',
  },
  {
    invoiceId: 'INV-4430',
    customerName: 'Greenfield Botanical Co',
    issueDate: '2026-11-05',
    dueDate: '2026-12-05',
    amount: 3200.0,
    status: 'unpaid',
  },
];
