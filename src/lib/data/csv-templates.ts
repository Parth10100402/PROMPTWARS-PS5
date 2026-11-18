import Papa from 'papaparse';
import { DEMO_INVENTORY, DEMO_SALES, DEMO_ORDERS, DEMO_INVOICES } from './demo-data';

export const CSV_TEMPLATES = {
  inventory: Papa.unparse(
    DEMO_INVENTORY.slice(0, 5).map(
      ({
        sku,
        productName,
        category,
        stockOnHand,
        avgDailySales,
        leadTimeDays,
        safetyStockDays,
        targetCoverDays,
        incomingStock,
        unitCost,
        supplierName,
      }) => ({
        sku,
        productName,
        category,
        stockOnHand,
        avgDailySales,
        leadTimeDays,
        safetyStockDays,
        targetCoverDays,
        incomingStock,
        unitCost,
        supplierName,
      })
    )
  ),
  sales: Papa.unparse(
    DEMO_SALES.slice(0, 10).map(({ date, sku, units, revenue }) => ({
      date,
      sku,
      units,
      revenue,
    }))
  ),
  orders: Papa.unparse(
    DEMO_ORDERS.slice(0, 5).map(({ orderId, customerName, orderDate, promisedDate, status, amount }) => ({
      orderId,
      customerName,
      orderDate,
      promisedDate,
      status,
      amount,
    }))
  ),
  invoices: Papa.unparse(
    DEMO_INVOICES.slice(0, 5).map(({ invoiceId, customerName, issueDate, dueDate, amount, status }) => ({
      invoiceId,
      customerName,
      issueDate,
      dueDate,
      amount,
      status,
    }))
  ),
};

export function downloadCsvTemplate(category: keyof typeof CSV_TEMPLATES, filename?: string) {
  const content = CSV_TEMPLATES[category];
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename || `opspilot_${category}_template.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
