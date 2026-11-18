'use client';

import React, { useState, useMemo } from 'react';
import {
  Receipt,
  Search,
  AlertOctagon,
  CheckCircle,
  Clock,
  Mail,
  DollarSign,
  ShieldAlert,
} from 'lucide-react';
import { InvoiceItem } from '@/types';
import { evaluateInvoiceRules } from '@/lib/agent/rules';

interface ReceivablesTableProps {
  invoices: InvoiceItem[];
  referenceDate?: string;
}

export const ReceivablesTable: React.FC<ReceivablesTableProps> = ({
  invoices,
  referenceDate = '2026-11-18',
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [selectedInvoiceForModal, setSelectedInvoiceForModal] = useState<InvoiceItem | null>(null);

  // Compute enriched invoices with overdue status
  const enrichedInvoices = useMemo(() => {
    const { enrichedInvoices } = evaluateInvoiceRules(invoices, referenceDate, new Date().toISOString());
    return enrichedInvoices;
  }, [invoices, referenceDate]);

  const overdueList = useMemo(() => enrichedInvoices.filter((i) => i.isOverdue), [enrichedInvoices]);
  const totalReceivables = useMemo(
    () => enrichedInvoices.filter((i) => i.status !== 'paid').reduce((sum, i) => sum + i.amount, 0),
    [enrichedInvoices]
  );
  const overdueAmount = useMemo(
    () => overdueList.reduce((sum, i) => sum + i.amount, 0),
    [overdueList]
  );

  // Aging Buckets
  const agingCurrent = enrichedInvoices
    .filter((i) => !i.isOverdue && i.status !== 'paid')
    .reduce((sum, i) => sum + i.amount, 0);

  const aging1to7 = overdueList
    .filter((i) => (i.overdueDays || 0) <= 7)
    .reduce((sum, i) => sum + i.amount, 0);

  const aging8to14 = overdueList
    .filter((i) => (i.overdueDays || 0) > 7 && (i.overdueDays || 0) <= 14)
    .reduce((sum, i) => sum + i.amount, 0);

  const aging15Plus = overdueList
    .filter((i) => (i.overdueDays || 0) > 14)
    .reduce((sum, i) => sum + i.amount, 0);

  const filteredInvoices = useMemo(() => {
    return enrichedInvoices.filter((inv) => {
      const matchesSearch =
        inv.invoiceId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        inv.customerName.toLowerCase().includes(searchTerm.toLowerCase());

      if (statusFilter === 'OVERDUE') {
        return matchesSearch && inv.isOverdue;
      }
      if (statusFilter !== 'ALL') {
        return matchesSearch && inv.status === statusFilter;
      }
      return matchesSearch;
    });
  }, [enrichedInvoices, searchTerm, statusFilter]);

  const getStatusBadge = (status: InvoiceItem['status'], isOverdue?: boolean) => {
    if (status === 'paid') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
          Paid
        </span>
      );
    }
    if (status === 'disputed') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-500/20 text-purple-400 border border-purple-500/30">
          Disputed
        </span>
      );
    }
    if (isOverdue) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-500/20 text-red-400 border border-red-500/30">
          Overdue
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
        Current / Unpaid
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-2xl bg-slate-900 border border-slate-800">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Receipt className="w-5 h-5 text-cyan-400" />
            <h2 className="text-xl font-bold text-white tracking-tight">Payments & Receivables</h2>
          </div>
          <p className="text-xs text-slate-400">
            Cash flow defense: Invoices aging analysis, overdue alerts, and automated reminder drafting.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="px-3.5 py-2 rounded-xl bg-slate-950/70 border border-slate-800 text-right">
            <div className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">
              Open Receivables
            </div>
            <div className="text-sm font-bold text-white">
              ${Math.round(totalReceivables).toLocaleString()}
            </div>
          </div>

          <div className="px-3.5 py-2 rounded-xl bg-red-950/40 border border-red-900/60 text-right">
            <div className="text-[10px] text-red-400 uppercase tracking-wider font-semibold">
              Overdue Balance
            </div>
            <div className="text-sm font-bold text-red-300">
              ${Math.round(overdueAmount).toLocaleString()} ({overdueList.length} inv)
            </div>
          </div>
        </div>
      </div>

      {/* Receivables Aging Buckets Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800">
          <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">Current (Within Terms)</span>
          <div className="text-base font-bold text-slate-200 mt-1">${Math.round(agingCurrent).toLocaleString()}</div>
        </div>
        <div className="p-3.5 rounded-xl bg-yellow-950/20 border border-yellow-900/40">
          <span className="text-[10px] text-yellow-400 font-medium uppercase tracking-wider">1 - 7 Days Overdue</span>
          <div className="text-base font-bold text-yellow-300 mt-1">${Math.round(aging1to7).toLocaleString()}</div>
        </div>
        <div className="p-3.5 rounded-xl bg-orange-950/20 border border-orange-900/40">
          <span className="text-[10px] text-orange-400 font-medium uppercase tracking-wider">8 - 14 Days Overdue</span>
          <div className="text-base font-bold text-orange-300 mt-1">${Math.round(aging8to14).toLocaleString()}</div>
        </div>
        <div className="p-3.5 rounded-xl bg-red-950/30 border border-red-900/50">
          <span className="text-[10px] text-red-400 font-medium uppercase tracking-wider">15+ Days (Critical)</span>
          <div className="text-base font-bold text-red-400 mt-1">${Math.round(aging15Plus).toLocaleString()}</div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-xl bg-slate-900/60 border border-slate-800">
        <div className="flex items-center gap-3 flex-1 min-w-[280px]">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by invoice ID or customer name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-300 focus:outline-none focus:border-cyan-500"
          >
            <option value="ALL">All Statuses</option>
            <option value="OVERDUE">⚠️ Overdue Only ({overdueList.length})</option>
            <option value="unpaid">Unpaid</option>
            <option value="paid">Paid</option>
            <option value="disputed">Disputed</option>
          </select>
        </div>

        <div className="text-xs text-slate-400">
          Showing <strong className="text-slate-200">{filteredInvoices.length}</strong> of {invoices.length} invoices
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950/70">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="border-b border-slate-800 bg-slate-900/80 text-slate-400 font-semibold uppercase tracking-wider text-[11px]">
              <th className="py-3 px-4">Invoice ID</th>
              <th className="py-3 px-4">Customer Name</th>
              <th className="py-3 px-3">Issue Date</th>
              <th className="py-3 px-3">Due Date</th>
              <th className="py-3 px-3 text-right">Amount</th>
              <th className="py-3 px-3">Status</th>
              <th className="py-3 px-3 text-center">Overdue Duration</th>
              <th className="py-3 px-4 text-right">Reminder Draft</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {filteredInvoices.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-12 text-center text-slate-500">
                  No invoices matching current filter.
                </td>
              </tr>
            ) : (
              filteredInvoices.map((inv) => {
                const isOverdue = inv.isOverdue;
                return (
                  <tr
                    key={inv.invoiceId}
                    className={`hover:bg-slate-900/60 transition-colors ${
                      isOverdue ? 'bg-red-950/10' : ''
                    }`}
                  >
                    <td className="py-3 px-4 font-mono font-bold text-slate-200">{inv.invoiceId}</td>
                    <td className="py-3 px-4 font-medium text-slate-300">{inv.customerName}</td>
                    <td className="py-3 px-3 text-slate-400 font-mono">{inv.issueDate}</td>
                    <td className="py-3 px-3 font-mono">
                      <span className={isOverdue ? 'text-red-400 font-bold' : 'text-slate-300'}>
                        {inv.dueDate}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-bold text-slate-200">
                      ${inv.amount.toLocaleString()}
                    </td>
                    <td className="py-3 px-3">{getStatusBadge(inv.status, isOverdue)}</td>
                    <td className="py-3 px-3 text-center">
                      {isOverdue ? (
                        <span className="font-mono text-red-400 font-bold bg-red-950/60 px-2 py-0.5 rounded border border-red-900/50">
                          +{inv.overdueDays}d late
                        </span>
                      ) : inv.status === 'paid' ? (
                        <span className="text-emerald-500 text-[11px]">Settled</span>
                      ) : (
                        <span className="text-slate-400 text-[11px]">Within Terms</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      {isOverdue ? (
                        <button
                          onClick={() => setSelectedInvoiceForModal(inv)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-cyan-300 text-xs font-medium border border-slate-700 transition-colors"
                        >
                          <Mail className="w-3 h-3 text-cyan-400" />
                          <span>View Reminder Draft</span>
                        </button>
                      ) : (
                        <span className="text-slate-600 text-[11px]">-</span>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Payment Reminder Preview Modal */}
      {selectedInvoiceForModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-700 rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Mail className="w-5 h-5 text-cyan-400" />
                <h3 className="font-bold text-sm text-white">
                  Payment Reminder Draft: {selectedInvoiceForModal.invoiceId}
                </h3>
              </div>
              <button
                onClick={() => setSelectedInvoiceForModal(null)}
                className="text-slate-400 hover:text-slate-200 text-sm font-mono"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 space-y-1">
                <div>
                  <span className="text-slate-500 font-medium">To:</span>{' '}
                  <span className="text-slate-200 font-semibold">{selectedInvoiceForModal.customerName}</span>
                </div>
                <div>
                  <span className="text-slate-500 font-medium">Outstanding Balance:</span>{' '}
                  <span className="text-red-400 font-bold">${selectedInvoiceForModal.amount.toLocaleString()}</span>
                </div>
                <div>
                  <span className="text-slate-500 font-medium">Original Due Date:</span>{' '}
                  <span className="text-slate-300 font-mono">
                    {selectedInvoiceForModal.dueDate} ({selectedInvoiceForModal.overdueDays} days past due)
                  </span>
                </div>
              </div>

              <div className="p-3.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-300 font-sans leading-relaxed whitespace-pre-wrap">
                {`Dear Accounts Payable Team at ${selectedInvoiceForModal.customerName},\n\nThis is a friendly reminder that invoice ${selectedInvoiceForModal.invoiceId} in the amount of $${selectedInvoiceForModal.amount.toLocaleString()} was due on ${selectedInvoiceForModal.dueDate}.\n\nPlease review your records and confirm if this payment has been scheduled for remittance. For your convenience, electronic settlement details are attached.\n\nIf payment has already been sent, please disregard this notice with our thanks.\n\nSincerely,\nFinance & Operations`}
              </div>

              <div className="p-2.5 rounded bg-amber-950/30 border border-amber-800/40 text-[11px] text-amber-300">
                🔒 <strong>Human-in-the-Loop Financial Control:</strong> OpsPilot drafts notifications for managerial oversight and will never execute automatic payment claims or financial transactions.
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelectedInvoiceForModal(null)}
                className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium text-xs transition-colors"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
