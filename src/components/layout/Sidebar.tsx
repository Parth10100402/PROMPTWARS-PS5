'use client';

import React from 'react';
import {
  LayoutDashboard,
  Boxes,
  ShoppingBag,
  Receipt,
  Bot,
  CheckSquare,
  History,
  FileSpreadsheet,
  Cpu,
  RefreshCw,
  Sparkles,
} from 'lucide-react';

export type NavTab =
  | 'dashboard'
  | 'inventory'
  | 'orders'
  | 'receivables'
  | 'agent'
  | 'chat'
  | 'approvals'
  | 'activity'
  | 'data';

interface SidebarProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  pendingApprovalsCount: number;
  criticalExceptionsCount: number;
  aiMode: 'GEMINI_ASSISTED' | 'DETERMINISTIC_RULES';
  onResetDemoData: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  pendingApprovalsCount,
  criticalExceptionsCount,
  aiMode,
  onResetDemoData,
}) => {
  const navItems = [
    { id: 'dashboard' as NavTab, label: 'Overview', icon: LayoutDashboard },
    { id: 'inventory' as NavTab, label: 'Inventory', icon: Boxes },
    { id: 'orders' as NavTab, label: 'Orders', icon: ShoppingBag },
    { id: 'receivables' as NavTab, label: 'Receivables', icon: Receipt },
    {
      id: 'agent' as NavTab,
      label: 'AI Agent Center',
      icon: Cpu,
      badge: criticalExceptionsCount > 0 ? `${criticalExceptionsCount} alert` : undefined,
      badgeColor: 'bg-red-500/20 text-red-400 border border-red-500/30',
    },
    { id: 'chat' as NavTab, label: 'Ask OpsPilot', icon: Bot, isSpecial: true },
    {
      id: 'approvals' as NavTab,
      label: 'Approvals',
      icon: CheckSquare,
      badge: pendingApprovalsCount > 0 ? `${pendingApprovalsCount}` : undefined,
      badgeColor: 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30',
    },
    { id: 'activity' as NavTab, label: 'Audit Trail', icon: History },
    { id: 'data' as NavTab, label: 'Data Ingestion', icon: FileSpreadsheet },
  ];

  return (
    <aside className="w-64 bg-[#0c1220] border-r border-slate-800 flex flex-col justify-between shrink-0 select-none min-h-screen">
      {/* Brand Header */}
      <div>
        <div className="p-6 border-b border-slate-800/80">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
              <Bot className="w-5 h-5 text-slate-950 font-bold" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-base tracking-tight text-white">OpsPilot AI</span>
                <span className="text-[10px] uppercase font-semibold px-1.5 py-0.5 rounded bg-cyan-950 text-cyan-400 border border-cyan-800/50">
                  PS05
                </span>
              </div>
              <p className="text-[11px] text-slate-400">Operations Control Tower</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="p-3 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSelectTab(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${
                  isActive
                    ? 'bg-slate-800/90 text-cyan-400 shadow-sm border border-slate-700/60'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    className={`w-4 h-4 ${
                      isActive ? 'text-cyan-400' : item.isSpecial ? 'text-cyan-400' : 'text-slate-400'
                    }`}
                  />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${item.badgeColor}`}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* System Status & Business Card */}
      <div className="p-4 border-t border-slate-800/80 bg-[#080d18]/50">
        <div className="p-3 rounded-lg bg-slate-900/80 border border-slate-800 text-xs">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-slate-400 font-medium">Business Target:</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded font-mono bg-slate-800 text-cyan-300">
              Retail/Distributor
            </span>
          </div>
          <p className="font-semibold text-slate-200 text-xs truncate mb-2">Northstar Retail & Dist.</p>

          <div className="flex items-center justify-between pt-2 border-t border-slate-800 text-[11px]">
            <span className="text-slate-400">Agent Mode:</span>
            <span
              className={`font-semibold flex items-center gap-1 ${
                aiMode === 'GEMINI_ASSISTED' ? 'text-emerald-400' : 'text-cyan-400'
              }`}
            >
              <Sparkles className="w-3 h-3" />
              {aiMode === 'GEMINI_ASSISTED' ? 'Gemini 2.5' : 'Deterministic'}
            </span>
          </div>
        </div>

        <button
          onClick={onResetDemoData}
          className="w-full mt-3 flex items-center justify-center gap-2 py-1.5 px-3 rounded-md text-xs font-medium text-slate-400 hover:text-slate-200 bg-slate-900 hover:bg-slate-800 border border-slate-800 transition-colors"
        >
          <RefreshCw className="w-3 h-3" />
          Reset Demo Dataset
        </button>
      </div>
    </aside>
  );
};
