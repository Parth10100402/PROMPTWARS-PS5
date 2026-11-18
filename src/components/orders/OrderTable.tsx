'use client';

import React, { useState, useMemo } from 'react';
import {
  ShoppingBag,
  Search,
  Clock,
  AlertTriangle,
  CheckCircle,
  XCircle,
  FileText,
  Mail,
  ArrowUpDown,
} from 'lucide-react';
import { OrderItem } from '@/types';
import { evaluateOrderRules } from '@/lib/agent/rules';

interface OrderTableProps {
  orders: OrderItem[];
  referenceDate?: string;
  onPrepareCustomerMessage?: (order: OrderItem) => void;
}

export const OrderTable: React.FC<OrderTableProps> = ({
  orders,
  referenceDate = '2026-11-18',
  onPrepareCustomerMessage,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [selectedOrderForModal, setSelectedOrderForModal] = useState<OrderItem | null>(null);

  // Compute enriched orders with delay detection
  const enrichedOrders = useMemo(() => {
    const { enrichedOrders } = evaluateOrderRules(orders, referenceDate, new Date().toISOString());
    return enrichedOrders;
  }, [orders, referenceDate]);

  const delayedList = useMemo(() => enrichedOrders.filter((o) => o.isDelayed), [enrichedOrders]);
  const delayedTotalAmount = delayedList.reduce((sum, o) => sum + o.amount, 0);

  const filteredOrders = useMemo(() => {
    return enrichedOrders.filter((order) => {
      const matchesSearch =
        order.orderId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.customerName.toLowerCase().includes(searchTerm.toLowerCase());

      if (statusFilter === 'DELAYED') {
        return matchesSearch && order.isDelayed;
      }
      if (statusFilter !== 'ALL') {
        return matchesSearch && order.status === statusFilter;
      }
      return matchesSearch;
    });
  }, [enrichedOrders, searchTerm, statusFilter]);

  const getStatusBadge = (status: OrderItem['status'], isDelayed?: boolean) => {
    if (isDelayed) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-500/20 text-red-400 border border-red-500/30">
          <Clock className="w-3 h-3 text-red-400" />
          Delayed
        </span>
      );
    }
    switch (status) {
      case 'delivered':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
            Delivered
          </span>
        );
      case 'shipped':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-500/20 text-blue-400 border border-blue-500/30">
            Shipped
          </span>
        );
      case 'processing':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
            Processing
          </span>
        );
      case 'cancelled':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-800 text-slate-400 border border-slate-700">
            Cancelled
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-yellow-500/20 text-yellow-400 border border-yellow-500/30">
            Pending
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-2xl bg-slate-900 border border-slate-800">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <ShoppingBag className="w-5 h-5 text-cyan-400" />
            <h2 className="text-xl font-bold text-white tracking-tight">Customer Order Fulfillment</h2>
          </div>
          <p className="text-xs text-slate-400">
            Tracking promised delivery SLAs, identifying shipping bottlenecks, and drafting proactive customer updates.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="px-3.5 py-2 rounded-xl bg-slate-950/70 border border-slate-800 text-right">
            <div className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">
              Total Order Volume
            </div>
            <div className="text-sm font-bold text-white">
              ${Math.round(enrichedOrders.reduce((sum, o) => sum + o.amount, 0)).toLocaleString()}
            </div>
          </div>

          <div className="px-3.5 py-2 rounded-xl bg-amber-950/40 border border-amber-900/60 text-right">
            <div className="text-[10px] text-amber-400 uppercase tracking-wider font-semibold">
              Delayed Orders
            </div>
            <div className="text-sm font-bold text-amber-300">
              {delayedList.length} orders (${Math.round(delayedTotalAmount).toLocaleString()})
            </div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-xl bg-slate-900/60 border border-slate-800">
        <div className="flex items-center gap-3 flex-1 min-w-[280px]">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by order ID or customer name..."
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
            <option value="DELAYED">⚠️ Delayed Only ({delayedList.length})</option>
            <option value="pending">Pending</option>
            <option value="processing">Processing</option>
            <option value="shipped">Shipped</option>
            <option value="delivered">Delivered</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>

        <div className="text-xs text-slate-400">
          Showing <strong className="text-slate-200">{filteredOrders.length}</strong> of {orders.length} orders
        </div>
      </div>

      {/* Orders Table */}
      <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950/70">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="border-b border-slate-800 bg-slate-900/80 text-slate-400 font-semibold uppercase tracking-wider text-[11px]">
              <th className="py-3 px-4">Order ID</th>
              <th className="py-3 px-4">Customer Name</th>
              <th className="py-3 px-3">Order Date</th>
              <th className="py-3 px-3">Promised Delivery</th>
              <th className="py-3 px-3">Status</th>
              <th className="py-3 px-3 text-right">Order Amount</th>
              <th className="py-3 px-3 text-center">Delay Status</th>
              <th className="py-3 px-4 text-right">Action Draft</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {filteredOrders.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-12 text-center text-slate-500">
                  No orders match current filter.
                </td>
              </tr>
            ) : (
              filteredOrders.map((order) => {
                const isDelayed = order.isDelayed;
                return (
                  <tr
                    key={order.orderId}
                    className={`hover:bg-slate-900/60 transition-colors ${
                      isDelayed ? 'bg-amber-950/10' : ''
                    }`}
                  >
                    <td className="py-3 px-4 font-mono font-bold text-slate-200">{order.orderId}</td>
                    <td className="py-3 px-4 font-medium text-slate-300">{order.customerName}</td>
                    <td className="py-3 px-3 text-slate-400 font-mono">{order.orderDate}</td>
                    <td className="py-3 px-3 font-mono">
                      <span className={isDelayed ? 'text-red-400 font-bold' : 'text-slate-300'}>
                        {order.promisedDate}
                      </span>
                    </td>
                    <td className="py-3 px-3">{getStatusBadge(order.status, isDelayed)}</td>
                    <td className="py-3 px-3 text-right font-mono font-bold text-slate-200">
                      ${order.amount.toLocaleString()}
                    </td>
                    <td className="py-3 px-3 text-center">
                      {isDelayed ? (
                        <span className="font-mono text-red-400 font-bold bg-red-950/60 px-2 py-0.5 rounded border border-red-900/50">
                          +{order.delayDays}d overdue
                        </span>
                      ) : (
                        <span className="text-emerald-500 text-[11px]">On Schedule</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      {isDelayed ? (
                        <button
                          onClick={() => setSelectedOrderForModal(order)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-cyan-300 text-xs font-medium border border-slate-700 transition-colors"
                        >
                          <Mail className="w-3 h-3 text-cyan-400" />
                          <span>View Message Draft</span>
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

      {/* Customer Message Draft Preview Modal */}
      {selectedOrderForModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-700 rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Mail className="w-5 h-5 text-cyan-400" />
                <h3 className="font-bold text-sm text-white">
                  Customer Follow-up Draft: {selectedOrderForModal.orderId}
                </h3>
              </div>
              <button
                onClick={() => setSelectedOrderForModal(null)}
                className="text-slate-400 hover:text-slate-200 text-sm font-mono"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 space-y-1">
                <div>
                  <span className="text-slate-500 font-medium">To:</span>{' '}
                  <span className="text-slate-200 font-semibold">{selectedOrderForModal.customerName}</span>
                </div>
                <div>
                  <span className="text-slate-500 font-medium">Subject:</span>{' '}
                  <span className="text-cyan-300 font-medium">
                    Update regarding your order {selectedOrderForModal.orderId} - OpsPilot Delivery Dispatch
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 font-medium">Promised Date:</span>{' '}
                  <span className="text-red-400">{selectedOrderForModal.promisedDate} ({selectedOrderForModal.delayDays} days delayed)</span>
                </div>
              </div>

              <div className="p-3.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-300 font-sans leading-relaxed whitespace-pre-wrap">
                {`Dear ${selectedOrderForModal.customerName},\n\nWe are writing to provide a transparent update regarding order ${selectedOrderForModal.orderId} placed on ${selectedOrderForModal.orderDate}.\n\nDue to temporary warehouse transit processing, delivery was delayed past the original date of ${selectedOrderForModal.promisedDate}. Our logistics team has escalated your shipment to priority express dispatch.\n\nWe sincerely apologize for this delay and are monitoring its journey to ensure arrival as quickly as possible.\n\nBest regards,\nOperations Fulfillment Team`}
              </div>

              <div className="p-2.5 rounded bg-cyan-950/30 border border-cyan-800/40 text-[11px] text-cyan-300">
                🔒 <strong>Human-in-the-Loop Safeguard:</strong> This message draft is prepared for your review. Messages are never transmitted to external customers automatically.
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelectedOrderForModal(null)}
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
