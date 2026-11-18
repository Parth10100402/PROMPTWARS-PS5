'use client';

import React, { useState } from 'react';
import {
  FileSpreadsheet,
  Upload,
  Download,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  Boxes,
  ShoppingBag,
  Receipt,
  TrendingUp,
} from 'lucide-react';
import {
  parseInventoryCsv,
  parseOrdersCsv,
  parseInvoicesCsv,
  parseSalesCsv,
} from '@/lib/data/csv-parser';
import { downloadCsvTemplate } from '@/lib/data/csv-templates';
import { InventoryItem, OrderItem, InvoiceItem, SaleRecord } from '@/types';

interface DataIngestionProps {
  onUpdateInventory: (data: InventoryItem[]) => void;
  onUpdateOrders: (data: OrderItem[]) => void;
  onUpdateInvoices: (data: InvoiceItem[]) => void;
  onUpdateSales: (data: SaleRecord[]) => void;
  onResetDemoData: () => void;
}

type DatasetType = 'inventory' | 'orders' | 'invoices' | 'sales';

export const DataIngestionModal: React.FC<DataIngestionProps> = ({
  onUpdateInventory,
  onUpdateOrders,
  onUpdateInvoices,
  onUpdateSales,
  onResetDemoData,
}) => {
  const [activeTab, setActiveTab] = useState<DatasetType>('inventory');
  const [errorList, setErrorList] = useState<string[]>([]);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [previewRows, setPreviewRows] = useState<any[]>([]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setErrorList([]);
    setSuccessMsg(null);
    setPreviewRows([]);

    if (file.size > 2 * 1024 * 1024) {
      setErrorList(['File size exceeds 2 MB limit.']);
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (!text) return;

      if (activeTab === 'inventory') {
        const res = parseInventoryCsv(text, file.size);
        if (!res.success) {
          setErrorList(res.errors);
        } else {
          onUpdateInventory(res.data);
          setSuccessMsg(`Successfully imported ${res.data.length} inventory products.`);
          setPreviewRows(res.data.slice(0, 5));
        }
      } else if (activeTab === 'orders') {
        const res = parseOrdersCsv(text, file.size);
        if (!res.success) {
          setErrorList(res.errors);
        } else {
          onUpdateOrders(res.data);
          setSuccessMsg(`Successfully imported ${res.data.length} customer orders.`);
          setPreviewRows(res.data.slice(0, 5));
        }
      } else if (activeTab === 'invoices') {
        const res = parseInvoicesCsv(text, file.size);
        if (!res.success) {
          setErrorList(res.errors);
        } else {
          onUpdateInvoices(res.data);
          setSuccessMsg(`Successfully imported ${res.data.length} invoices.`);
          setPreviewRows(res.data.slice(0, 5));
        }
      } else if (activeTab === 'sales') {
        const res = parseSalesCsv(text, file.size);
        if (!res.success) {
          setErrorList(res.errors);
        } else {
          onUpdateSales(res.data);
          setSuccessMsg(`Successfully imported ${res.data.length} sales records.`);
          setPreviewRows(res.data.slice(0, 5));
        }
      }
    };
    reader.readAsText(file);
    // Reset input
    e.target.value = '';
  };

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-2xl bg-slate-900 border border-slate-800">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <FileSpreadsheet className="w-5 h-5 text-cyan-400" />
            <h2 className="text-xl font-bold text-white tracking-tight">Business Data Ingestion</h2>
          </div>
          <p className="text-xs text-slate-400">
            Upload custom CSV files to test your own business operations or restore the synthetic retail dataset.
          </p>
        </div>

        <button
          onClick={onResetDemoData}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors shrink-0"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Restore Default Demo Business</span>
        </button>
      </div>

      {/* Dataset Selection Tabs */}
      <div className="flex items-center gap-2 p-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs">
        <button
          onClick={() => {
            setActiveTab('inventory');
            setErrorList([]);
            setSuccessMsg(null);
            setPreviewRows([]);
          }}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg font-semibold transition-colors ${
            activeTab === 'inventory'
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Boxes className="w-4 h-4" />
          <span>Inventory CSV</span>
        </button>

        <button
          onClick={() => {
            setActiveTab('orders');
            setErrorList([]);
            setSuccessMsg(null);
            setPreviewRows([]);
          }}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg font-semibold transition-colors ${
            activeTab === 'orders'
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <ShoppingBag className="w-4 h-4" />
          <span>Orders CSV</span>
        </button>

        <button
          onClick={() => {
            setActiveTab('invoices');
            setErrorList([]);
            setSuccessMsg(null);
            setPreviewRows([]);
          }}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg font-semibold transition-colors ${
            activeTab === 'invoices'
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Receipt className="w-4 h-4" />
          <span>Invoices CSV</span>
        </button>

        <button
          onClick={() => {
            setActiveTab('sales');
            setErrorList([]);
            setSuccessMsg(null);
            setPreviewRows([]);
          }}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg font-semibold transition-colors ${
            activeTab === 'sales'
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          <span>Sales CSV</span>
        </button>
      </div>

      {/* Upload Zone & Download Template */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Upload Box (2 columns) */}
        <div className="md:col-span-2 p-8 rounded-2xl bg-slate-900/80 border-2 border-dashed border-slate-700 hover:border-cyan-500/50 transition-colors flex flex-col items-center justify-center text-center group">
          <div className="w-12 h-12 rounded-xl bg-slate-800 flex items-center justify-center mb-4 group-hover:bg-cyan-500/20 transition-colors">
            <Upload className="w-6 h-6 text-cyan-400" />
          </div>
          <h3 className="text-sm font-bold text-white">Upload {activeTab.toUpperCase()} CSV File</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-sm">
            Drag and drop your file here or click below. Maximum file size: 2 MB (up to 20,000 rows).
          </p>

          <label className="mt-5 px-5 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs cursor-pointer shadow-lg shadow-cyan-500/20 transition-colors">
            <span>Select CSV File</span>
            <input type="file" accept=".csv" onChange={handleFileUpload} className="hidden" />
          </label>
        </div>

        {/* Template & Schema Rules Card */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4 text-xs">
          <div>
            <h4 className="font-bold text-white uppercase tracking-wider text-[11px]">
              Expected CSV Schema: {activeTab.toUpperCase()}
            </h4>
            <p className="text-[11px] text-slate-400 mt-1">
              Ensure all required headers are present. Missing fields or duplicate keys will be safely rejected.
            </p>
          </div>

          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 font-mono text-[11px] text-cyan-300 space-y-1">
            {activeTab === 'inventory' && (
              <div>sku, productName, category, stockOnHand, avgDailySales, leadTimeDays, safetyStockDays, targetCoverDays, incomingStock, unitCost, supplierName</div>
            )}
            {activeTab === 'orders' && (
              <div>orderId, customerName, orderDate, promisedDate, status, amount</div>
            )}
            {activeTab === 'invoices' && (
              <div>invoiceId, customerName, issueDate, dueDate, amount, status</div>
            )}
            {activeTab === 'sales' && (
              <div>date, sku, units, revenue</div>
            )}
          </div>

          <button
            onClick={() => downloadCsvTemplate(activeTab)}
            className="w-full flex items-center justify-center gap-2 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-cyan-400" />
            <span>Download Sample CSV Template</span>
          </button>
        </div>
      </div>

      {/* Success Notification */}
      {successMsg && (
        <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-800/60 text-xs text-emerald-300 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Validation Error Logs */}
      {errorList.length > 0 && (
        <div className="p-4 rounded-xl bg-red-950/40 border border-red-800/60 text-xs text-red-300 space-y-2">
          <div className="flex items-center gap-2 font-bold text-red-400">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>CSV Ingestion Rejected with {errorList.length} Validation Errors:</span>
          </div>
          <ul className="list-disc pl-5 space-y-1 max-h-40 overflow-y-auto font-mono text-[11px] text-red-300/90">
            {errorList.map((err, i) => (
              <li key={i}>{err}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Data Preview */}
      {previewRows.length > 0 && (
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
          <h4 className="text-xs font-bold text-white uppercase tracking-wider">
            Imported Data Preview (First 5 Rows)
          </h4>
          <div className="overflow-x-auto">
            <pre className="p-3 rounded-lg bg-slate-950 border border-slate-800 text-[11px] font-mono text-slate-300">
              {JSON.stringify(previewRows, null, 2)}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
};
