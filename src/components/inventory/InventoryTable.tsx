'use client';

import React, { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  Boxes,
  AlertTriangle,
  ArrowUpDown,
  Download,
  PlusCircle,
  Truck,
  CheckCircle,
} from 'lucide-react';
import { InventoryItem, RiskLevel } from '@/types';
import { calculateDaysOfCover, calculateReorderQuantity, classifyInventoryRisk } from '@/lib/agent/rules';

interface InventoryTableProps {
  inventory: InventoryItem[];
  onRequestReorder?: (item: InventoryItem) => void;
}

export const InventoryTable: React.FC<InventoryTableProps> = ({ inventory, onRequestReorder }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedRisk, setSelectedRisk] = useState<string>('ALL');
  const [sortField, setSortField] = useState<keyof InventoryItem>('daysOfCover');
  const [sortAsc, setSortAsc] = useState(true);

  // Compute enriched inventory items
  const enriched = useMemo(() => {
    return inventory.map((item) => {
      const daysOfCover = item.daysOfCover ?? calculateDaysOfCover(item.stockOnHand, item.avgDailySales);
      const reorderQty =
        item.reorderQuantity ??
        calculateReorderQuantity(
          item.stockOnHand,
          item.incomingStock,
          item.avgDailySales,
          item.targetCoverDays
        );
      const riskLevel =
        item.riskLevel ??
        classifyInventoryRisk(
          daysOfCover,
          item.leadTimeDays,
          item.safetyStockDays,
          item.targetCoverDays
        );

      return {
        ...item,
        daysOfCover,
        reorderQuantity: reorderQty,
        riskLevel,
      };
    });
  }, [inventory]);

  // Categories list
  const categories = useMemo(() => {
    const set = new Set(inventory.map((i) => i.category));
    return ['ALL', ...Array.from(set)];
  }, [inventory]);

  // Filtering and Sorting
  const filteredItems = useMemo(() => {
    return enriched
      .filter((item) => {
        const matchesSearch =
          item.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.supplierName.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesCategory = selectedCategory === 'ALL' || item.category === selectedCategory;
        const matchesRisk = selectedRisk === 'ALL' || item.riskLevel === selectedRisk;

        return matchesSearch && matchesCategory && matchesRisk;
      })
      .sort((a, b) => {
        const valA = a[sortField] ?? 0;
        const valB = b[sortField] ?? 0;
        if (typeof valA === 'number' && typeof valB === 'number') {
          return sortAsc ? valA - valB : valB - valA;
        }
        return sortAsc
          ? String(valA).localeCompare(String(valB))
          : String(valB).localeCompare(String(valA));
      });
  }, [enriched, searchTerm, selectedCategory, selectedRisk, sortField, sortAsc]);

  // Statistics
  const criticalCount = enriched.filter((i) => i.riskLevel === 'CRITICAL').length;
  const highRiskCount = enriched.filter((i) => i.riskLevel === 'HIGH').length;
  const totalStockValue = enriched.reduce((sum, i) => sum + i.stockOnHand * i.unitCost, 0);

  const handleSort = (field: keyof InventoryItem) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(true);
    }
  };

  const getRiskBadge = (risk: RiskLevel = 'HEALTHY') => {
    switch (risk) {
      case 'CRITICAL':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-500/20 text-red-400 border border-red-500/30">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping"></span>
            Critical Stockout
          </span>
        );
      case 'HIGH':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-orange-500/20 text-orange-400 border border-orange-500/30">
            High Risk
          </span>
        );
      case 'MEDIUM':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-yellow-500/20 text-yellow-400 border border-yellow-500/30">
            Medium Cover
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
            Healthy
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Metrics */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-2xl bg-slate-900 border border-slate-800">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Boxes className="w-5 h-5 text-cyan-400" />
            <h2 className="text-xl font-bold text-white tracking-tight">Inventory Intelligence</h2>
          </div>
          <p className="text-xs text-slate-400">
            Real-time replenishment analysis: Days of cover, lead time buffers, and automated reorder calculations.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="px-3.5 py-2 rounded-xl bg-slate-950/70 border border-slate-800 text-right">
            <div className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">
              Stock Valuation
            </div>
            <div className="text-sm font-bold text-white">
              ${Math.round(totalStockValue).toLocaleString()}
            </div>
          </div>

          <div className="px-3.5 py-2 rounded-xl bg-red-950/40 border border-red-900/60 text-right">
            <div className="text-[10px] text-red-400 uppercase tracking-wider font-semibold">
              Stockout Alerts
            </div>
            <div className="text-sm font-bold text-red-300">
              {criticalCount} Critical / {highRiskCount} High
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
              placeholder="Search by SKU, product name, or supplier..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
            />
          </div>

          {/* Category Filter */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-300 focus:outline-none focus:border-cyan-500"
          >
            {categories.map((c) => (
              <option key={c} value={c}>
                {c === 'ALL' ? 'All Categories' : c}
              </option>
            ))}
          </select>

          {/* Risk Level Filter */}
          <select
            value={selectedRisk}
            onChange={(e) => setSelectedRisk(e.target.value)}
            className="px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-300 focus:outline-none focus:border-cyan-500"
          >
            <option value="ALL">All Risk Levels</option>
            <option value="CRITICAL">Critical Risk</option>
            <option value="HIGH">High Risk</option>
            <option value="MEDIUM">Medium Risk</option>
            <option value="HEALTHY">Healthy</option>
          </select>
        </div>

        <div className="text-xs text-slate-400">
          Showing <strong className="text-slate-200">{filteredItems.length}</strong> of {inventory.length} products
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950/70">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="border-b border-slate-800 bg-slate-900/80 text-slate-400 font-semibold uppercase tracking-wider text-[11px]">
              <th
                onClick={() => handleSort('sku')}
                className="py-3 px-4 cursor-pointer hover:text-slate-200"
              >
                <div className="flex items-center gap-1.5">
                  <span>SKU / Product</span>
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th className="py-3 px-3">Category</th>
              <th
                onClick={() => handleSort('stockOnHand')}
                className="py-3 px-3 cursor-pointer hover:text-slate-200 text-right"
              >
                <div className="flex items-center justify-end gap-1">
                  <span>Stock on Hand</span>
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th className="py-3 px-3 text-right">Avg Daily</th>
              <th
                onClick={() => handleSort('daysOfCover')}
                className="py-3 px-3 cursor-pointer hover:text-cyan-400 text-right"
              >
                <div className="flex items-center justify-end gap-1">
                  <span className="text-cyan-400 font-bold">Days Cover</span>
                  <ArrowUpDown className="w-3 h-3 text-cyan-400" />
                </div>
              </th>
              <th className="py-3 px-3 text-right">Lead / Safety</th>
              <th className="py-3 px-3 text-right">Incoming</th>
              <th className="py-3 px-3">Supplier</th>
              <th className="py-3 px-3">Risk Status</th>
              <th className="py-3 px-4 text-right">Suggested Reorder</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {filteredItems.length === 0 ? (
              <tr>
                <td colSpan={10} className="py-12 text-center text-slate-500">
                  No inventory products matching filters.
                </td>
              </tr>
            ) : (
              filteredItems.map((item) => {
                const isCritical = item.riskLevel === 'CRITICAL';
                return (
                  <tr
                    key={item.sku}
                    className={`hover:bg-slate-900/60 transition-colors ${
                      isCritical ? 'bg-red-950/10' : ''
                    }`}
                  >
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-200 font-mono">{item.sku}</div>
                      <div className="text-[11px] text-slate-400 truncate max-w-[200px]">
                        {item.productName}
                      </div>
                    </td>
                    <td className="py-3 px-3 text-slate-400">{item.category}</td>
                    <td className="py-3 px-3 text-right font-mono font-semibold text-slate-200">
                      {item.stockOnHand}
                    </td>
                    <td className="py-3 px-3 text-right font-mono text-slate-400">
                      {item.avgDailySales} /d
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-bold">
                      <span
                        className={
                          (item.daysOfCover || 0) < item.leadTimeDays
                            ? 'text-red-400'
                            : (item.daysOfCover || 0) < item.leadTimeDays + item.safetyStockDays
                            ? 'text-orange-400'
                            : 'text-emerald-400'
                        }
                      >
                        {item.daysOfCover}d
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right text-slate-400 font-mono">
                      {item.leadTimeDays}d / {item.safetyStockDays}d
                    </td>
                    <td className="py-3 px-3 text-right font-mono text-slate-400">
                      {item.incomingStock > 0 ? (
                        <span className="text-cyan-400">+{item.incomingStock}</span>
                      ) : (
                        '-'
                      )}
                    </td>
                    <td className="py-3 px-3 text-slate-400 text-[11px] truncate max-w-[140px]">
                      {item.supplierName}
                    </td>
                    <td className="py-3 px-3">{getRiskBadge(item.riskLevel)}</td>
                    <td className="py-3 px-4 text-right font-mono">
                      {item.reorderQuantity && item.reorderQuantity > 0 ? (
                        <div className="inline-flex items-center gap-1.5 font-bold text-cyan-400">
                          <span>{item.reorderQuantity} units</span>
                          <span className="text-[10px] text-slate-500 font-normal">
                            (${Math.round(item.reorderQuantity * item.unitCost).toLocaleString()})
                          </span>
                        </div>
                      ) : (
                        <span className="text-slate-600 font-normal">Sufficient</span>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
