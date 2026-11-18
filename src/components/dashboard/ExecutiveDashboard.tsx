'use client';

import React from 'react';
import {
  TrendingUp,
  AlertOctagon,
  Clock,
  DollarSign,
  Package,
  ShieldAlert,
  ArrowUpRight,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Boxes,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';
import {
  BusinessState,
  OperationalException,
  DraftAction,
  BusinessHealthScore,
} from '@/types';
import { NavTab } from '../layout/Sidebar';

interface DashboardProps {
  state: BusinessState;
  onNavigate: (tab: NavTab) => void;
  onRunAnalysis: () => void;
  isAnalyzing: boolean;
}

export const ExecutiveDashboard: React.FC<DashboardProps> = ({
  state,
  onNavigate,
  onRunAnalysis,
  isAnalyzing,
}) => {
  // 1. Calculate actual derived metrics from loaded data
  const totalRevenue = state.sales.reduce((sum, s) => sum + s.revenue, 0);
  const totalOrdersCount = state.orders.length;
  const delayedOrders = state.orders.filter((o) => o.isDelayed);
  const delayedOrdersCount = delayedOrders.length;
  const delayedOrdersValue = delayedOrders.reduce((sum, o) => sum + o.amount, 0);

  const overdueInvoices = state.invoices.filter((i) => i.isOverdue);
  const overdueInvoicesCount = overdueInvoices.length;
  const overdueInvoicesValue = overdueInvoices.reduce((sum, i) => sum + i.amount, 0);

  const criticalInventoryCount = state.inventory.filter((i) => i.riskLevel === 'CRITICAL').length;
  const highRiskInventoryCount = state.inventory.filter((i) => i.riskLevel === 'HIGH').length;
  const productsAtRiskCount = criticalInventoryCount + highRiskInventoryCount;

  const pendingApprovalsCount = state.draftActions.filter((a) => a.approvalStatus === 'PENDING').length;
  const healthScore = state.healthScore?.overallScore ?? 100;
  const healthTier = state.healthScore?.healthTier ?? 'GOOD';

  // 2. Prepare charts data from actual sales dataset
  // Aggregate sales by date (last 14 dates)
  const salesByDateMap: Record<string, number> = {};
  state.sales.forEach((s) => {
    salesByDateMap[s.date] = (salesByDateMap[s.date] || 0) + s.revenue;
  });
  const salesTrendData = Object.entries(salesByDateMap)
    .sort(([d1], [d2]) => d1.localeCompare(d2))
    .slice(-14)
    .map(([date, revenue]) => ({
      date: date.substring(5), // MM-DD
      revenue: Math.round(revenue),
    }));

  // Exception Severity Distribution
  const criticalExcs = state.exceptions.filter((e) => e.severity === 'CRITICAL').length;
  const highExcs = state.exceptions.filter((e) => e.severity === 'HIGH').length;
  const mediumExcs = state.exceptions.filter((e) => e.severity === 'MEDIUM').length;

  const exceptionData = [
    { name: 'Critical', count: criticalExcs, color: '#ef4444' },
    { name: 'High', count: highExcs, color: '#f97316' },
    { name: 'Medium', count: mediumExcs, color: '#eab308' },
  ];

  // Inventory Health Distribution
  const healthyCount = state.inventory.filter((i) => i.riskLevel === 'HEALTHY' || !i.riskLevel).length;
  const mediumInvCount = state.inventory.filter((i) => i.riskLevel === 'MEDIUM').length;

  const inventoryDistribution = [
    { name: 'Healthy', value: healthyCount, color: '#10b981' },
    { name: 'Medium', value: mediumInvCount, color: '#eab308' },
    { name: 'High Risk', value: highRiskInventoryCount, color: '#f97316' },
    { name: 'Critical', value: criticalInventoryCount, color: '#ef4444' },
  ];

  // Top 4 critical/urgent exceptions for dashboard alert feed
  const topPriorityExceptions = state.exceptions.slice(0, 4);

  return (
    <div className="space-y-6 pb-12">
      {/* Executive Welcome & Operations Pulse */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900 to-[#0b172a] border border-slate-800 shadow-xl">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs uppercase font-bold tracking-wider text-cyan-400">
              Operations Control Tower
            </span>
            <span className="text-slate-600">•</span>
            <span className="text-xs text-slate-400">Retail & Wholesale Distribution</span>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Executive Dashboard</h1>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl">
            Live operational intelligence actively monitoring inventory depletion, fulfillment SLAs,
            customer delivery promises, and accounts receivable cash flow.
          </p>
        </div>

        {/* Business Health Score Card */}
        <div className="flex items-center gap-4 p-4 rounded-xl bg-slate-950/70 border border-slate-800 shrink-0">
          <div className="relative w-16 h-16 flex items-center justify-center">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
              <path
                className="text-slate-800"
                strokeWidth="3.5"
                stroke="currentColor"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
              <path
                className={
                  healthScore >= 80
                    ? 'text-emerald-400'
                    : healthScore >= 65
                    ? 'text-yellow-400'
                    : 'text-red-500'
                }
                strokeDasharray={`${healthScore}, 100`}
                strokeWidth="3.5"
                strokeLinecap="round"
                stroke="currentColor"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
            </svg>
            <div className="absolute flex flex-col items-center">
              <span className="text-base font-extrabold text-white">{healthScore}</span>
            </div>
          </div>
          <div>
            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Health Score
            </div>
            <div
              className={`text-sm font-bold ${
                healthTier === 'EXCELLENT'
                  ? 'text-emerald-400'
                  : healthTier === 'GOOD'
                  ? 'text-cyan-400'
                  : healthTier === 'NEEDS_ATTENTION'
                  ? 'text-yellow-400'
                  : 'text-red-400'
              }`}
            >
              {healthTier.replace('_', ' ')}
            </div>
            <div className="text-[10px] text-slate-400">
              {state.healthScore ? 'Based on live rules' : 'Baseline evaluation'}
            </div>
          </div>
        </div>
      </div>

      {/* Primary KPI Grid (8 Cards) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Total Revenue */}
        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800/80 hover:border-slate-700 transition-colors">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-slate-400 font-medium">35-Day Revenue</span>
            <DollarSign className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-xl font-bold text-white tracking-tight">
            ${Math.round(totalRevenue).toLocaleString()}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Across 35 days recorded sales</div>
        </div>

        {/* Products at Risk */}
        <div
          onClick={() => onNavigate('inventory')}
          className="p-4 rounded-xl bg-slate-900/80 border border-slate-800/80 hover:border-cyan-500/40 transition-colors cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-slate-400 font-medium group-hover:text-cyan-300 transition-colors">
              Products At Risk
            </span>
            <Boxes className="w-4 h-4 text-red-400" />
          </div>
          <div className="text-xl font-bold text-white tracking-tight flex items-baseline gap-2">
            <span>{productsAtRiskCount}</span>
            <span className="text-xs text-red-400 font-normal">({criticalInventoryCount} critical)</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-1 group-hover:text-cyan-400">
            <span>Review inventory</span>
            <ArrowRight className="w-3 h-3" />
          </div>
        </div>

        {/* Delayed Orders */}
        <div
          onClick={() => onNavigate('orders')}
          className="p-4 rounded-xl bg-slate-900/80 border border-slate-800/80 hover:border-cyan-500/40 transition-colors cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-slate-400 font-medium group-hover:text-cyan-300 transition-colors">
              Delayed Orders
            </span>
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-xl font-bold text-white tracking-tight flex items-baseline gap-2">
            <span>{delayedOrdersCount}</span>
            <span className="text-xs text-slate-400 font-normal">/ {totalOrdersCount}</span>
          </div>
          <div className="text-[11px] text-amber-400/90 mt-1">
            ${Math.round(delayedOrdersValue).toLocaleString()} in transit risk
          </div>
        </div>

        {/* Overdue Receivables */}
        <div
          onClick={() => onNavigate('receivables')}
          className="p-4 rounded-xl bg-slate-900/80 border border-slate-800/80 hover:border-cyan-500/40 transition-colors cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-slate-400 font-medium group-hover:text-cyan-300 transition-colors">
              Overdue Receivables
            </span>
            <AlertOctagon className="w-4 h-4 text-red-400" />
          </div>
          <div className="text-xl font-bold text-white tracking-tight">
            ${Math.round(overdueInvoicesValue).toLocaleString()}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            {overdueInvoicesCount} invoices past due terms
          </div>
        </div>

        {/* Pending Approvals */}
        <div
          onClick={() => onNavigate('approvals')}
          className="p-4 rounded-xl bg-slate-900/80 border border-slate-800/80 hover:border-cyan-500/40 transition-colors cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-slate-400 font-medium group-hover:text-cyan-300 transition-colors">
              Pending Approvals
            </span>
            <ShieldAlert className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-xl font-bold text-cyan-400 tracking-tight">
            {pendingApprovalsCount}
          </div>
          <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-1 group-hover:text-cyan-400">
            <span>Action Queue</span>
            <ArrowRight className="w-3 h-3" />
          </div>
        </div>

        {/* Inventory Coverage Health */}
        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800/80">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-slate-400 font-medium">Inventory Health</span>
            <Package className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-xl font-bold text-white tracking-tight">
            {state.healthScore?.inventoryScore ?? 85}%
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            {state.inventory.length} active SKUs tracked
          </div>
        </div>

        {/* Fulfillment Rate */}
        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800/80">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-slate-400 font-medium">Fulfillment Rate</span>
            <CheckCircle2 className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-xl font-bold text-white tracking-tight">
            {state.healthScore?.fulfillmentScore ?? 90}%
          </div>
          <div className="text-[11px] text-slate-500 mt-1">On-time promise compliance</div>
        </div>

        {/* Collections Health */}
        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800/80">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-slate-400 font-medium">Collection Index</span>
            <TrendingUp className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-xl font-bold text-white tracking-tight">
            {state.healthScore?.receivablesScore ?? 88}%
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Current vs overdue cash terms</div>
        </div>
      </div>

      {/* Main Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Velocity Trend (2 columns) */}
        <div className="lg:col-span-2 p-5 rounded-2xl bg-slate-900/70 border border-slate-800 shadow-md">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-white">Daily Sales & Revenue Trend</h2>
              <p className="text-[11px] text-slate-400">14-day aggregated store sales velocity</p>
            </div>
            <span className="text-xs font-mono text-cyan-400 bg-cyan-950/60 border border-cyan-800/50 px-2 py-0.5 rounded">
              USD ($)
            </span>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={salesTrendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#00f0ff" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#00f0ff" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="date" stroke="#64748b" fontSize={11} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={11} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderColor: '#334155',
                    borderRadius: '8px',
                    color: '#f8fafc',
                    fontSize: '12px',
                  }}
                  formatter={(val: any) => [`$${Number(val).toLocaleString()}`, 'Daily Revenue']}
                />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="#00f0ff"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#revenueGrad)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Inventory Stock Risk Distribution */}
        <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800 shadow-md">
          <div className="mb-4">
            <h2 className="text-sm font-bold text-white">Inventory Risk Profile</h2>
            <p className="text-[11px] text-slate-400">Catalog coverage vs replenishment buffers</p>
          </div>
          <div className="h-44 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={inventoryDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={75}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {inventoryDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderColor: '#334155',
                    borderRadius: '8px',
                    fontSize: '12px',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-2 gap-2 mt-2 pt-2 border-t border-slate-800 text-[11px]">
            {inventoryDistribution.map((item) => (
              <div key={item.name} className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                <span className="text-slate-400">{item.name}:</span>
                <span className="font-bold text-slate-200">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Operational Priority Feed & Agent Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Exception Feed (2 columns) */}
        <div className="lg:col-span-2 p-5 rounded-2xl bg-slate-900/70 border border-slate-800 shadow-md">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              <h2 className="text-sm font-bold text-white">Priority Operational Exceptions</h2>
            </div>
            <button
              onClick={() => onNavigate('agent')}
              className="text-xs text-cyan-400 hover:text-cyan-300 font-medium flex items-center gap-1"
            >
              <span>View all ({state.exceptions.length})</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {topPriorityExceptions.length === 0 ? (
            <div className="p-8 text-center rounded-xl bg-slate-950/40 border border-slate-800/60">
              <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2 opacity-80" />
              <p className="text-sm text-slate-300 font-medium">No unresolved exceptions detected.</p>
              <p className="text-xs text-slate-500 mt-1">
                Run AI Operations Analysis to examine latest inventory and sales thresholds.
              </p>
              <button
                onClick={onRunAnalysis}
                disabled={isAnalyzing}
                className="mt-4 px-3 py-1.5 text-xs font-semibold rounded bg-cyan-500 hover:bg-cyan-400 text-slate-950 transition-colors"
              >
                Run Analysis Now
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {topPriorityExceptions.map((exc) => (
                <div
                  key={exc.id}
                  className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 hover:border-slate-700 transition-colors"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${
                            exc.severity === 'CRITICAL'
                              ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                              : exc.severity === 'HIGH'
                              ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30'
                              : 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                          }`}
                        >
                          {exc.severity}
                        </span>
                        <span className="text-[10px] text-slate-500 font-mono">
                          [{exc.category}]
                        </span>
                      </div>
                      <h4 className="text-xs font-bold text-slate-200 mt-1">{exc.title}</h4>
                      <p className="text-[11px] text-slate-400 mt-1 line-clamp-2">{exc.description}</p>
                    </div>
                    <span className="text-[11px] font-mono text-cyan-400 shrink-0">
                      {Math.round(exc.confidenceLevel * 100)}% conf
                    </span>
                  </div>
                  <div className="mt-2.5 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px]">
                    <span className="text-slate-400">
                      Impact:{' '}
                      <strong className="text-slate-300 font-normal">{exc.businessImpact}</strong>
                    </span>
                    <button
                      onClick={() => onNavigate('approvals')}
                      className="text-cyan-400 hover:underline shrink-0 ml-2"
                    >
                      Inspect action →
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Agent Insights & Quick Actions */}
        <div className="space-y-6">
          {/* Quick Actions Card */}
          <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800 shadow-md">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-3">
              Operator Quick Actions
            </h3>
            <div className="space-y-2">
              <button
                onClick={() => onNavigate('chat')}
                className="w-full flex items-center justify-between p-3 rounded-xl bg-slate-950/70 hover:bg-slate-800/60 border border-slate-800 text-left transition-colors group"
              >
                <div className="flex items-center gap-2.5">
                  <Sparkles className="w-4 h-4 text-cyan-400" />
                  <div>
                    <div className="text-xs font-semibold text-slate-200 group-hover:text-cyan-300">
                      Ask OpsPilot Assistant
                    </div>
                    <div className="text-[10px] text-slate-400">Instant answers from business data</div>
                  </div>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-cyan-400" />
              </button>

              <button
                onClick={() => onNavigate('approvals')}
                className="w-full flex items-center justify-between p-3 rounded-xl bg-slate-950/70 hover:bg-slate-800/60 border border-slate-800 text-left transition-colors group"
              >
                <div className="flex items-center gap-2.5">
                  <ShieldAlert className="w-4 h-4 text-emerald-400" />
                  <div>
                    <div className="text-xs font-semibold text-slate-200 group-hover:text-emerald-300">
                      Action Approval Queue
                    </div>
                    <div className="text-[10px] text-slate-400">
                      {pendingApprovalsCount} draft POs & messages pending review
                    </div>
                  </div>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-emerald-400" />
              </button>

              <button
                onClick={() => onNavigate('data')}
                className="w-full flex items-center justify-between p-3 rounded-xl bg-slate-950/70 hover:bg-slate-800/60 border border-slate-800 text-left transition-colors group"
              >
                <div className="flex items-center gap-2.5">
                  <Package className="w-4 h-4 text-purple-400" />
                  <div>
                    <div className="text-xs font-semibold text-slate-200 group-hover:text-purple-300">
                      Import Custom CSV Data
                    </div>
                    <div className="text-[10px] text-slate-400">Upload Inventory, Orders, Invoices</div>
                  </div>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-purple-400" />
              </button>
            </div>
          </div>

          {/* Agent Operations Overview */}
          <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-900 to-[#0e1a2f] border border-cyan-900/40 shadow-md">
            <div className="flex items-center gap-2 mb-2 text-cyan-400">
              <Sparkles className="w-4 h-4" />
              <span className="text-xs font-bold uppercase tracking-wider">
                Autonomous Ops Summary
              </span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              {state.healthScore?.summary ||
                'OpsPilot is continuously correlating inventory depletion rates with incoming supplier shipments and accounts receivable to prevent cash and supply shocks.'}
            </p>
            <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
              <span>Human-in-the-Loop:</span>
              <span className="text-emerald-400 font-semibold">Active & Enforced</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
