'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Sidebar, NavTab } from '@/components/layout/Sidebar';
import { TopBar } from '@/components/layout/TopBar';
import { ExecutiveDashboard } from '@/components/dashboard/ExecutiveDashboard';
import { InventoryTable } from '@/components/inventory/InventoryTable';
import { OrderTable } from '@/components/orders/OrderTable';
import { ReceivablesTable } from '@/components/receivables/ReceivablesTable';
import { AgentCenter } from '@/components/agent/AgentCenter';
import { AskOpsPilotChat } from '@/components/agent/AskOpsPilotChat';
import { ApprovalCenter } from '@/components/approvals/ApprovalCenter';
import { AuditTimeline } from '@/components/activity/AuditTimeline';
import { DataIngestionModal } from '@/components/data/DataIngestionModal';
import {
  loadStoredBusinessState,
  saveStoredBusinessState,
  clearStoredBusinessState,
  getInitialBusinessState,
} from '@/lib/storage/local-storage';
import { runOperationsAnalysis } from '@/lib/agent/engine';
import { BusinessState, InventoryItem, OrderItem, InvoiceItem, SaleRecord, AuditEvent } from '@/types';
import { CheckCircle2, AlertCircle, Info } from 'lucide-react';

export default function OpsPilotApp() {
  const [state, setState] = useState<BusinessState>(getInitialBusinessState());
  const [isHydrated, setIsHydrated] = useState(false);
  const [currentTab, setCurrentTab] = useState<NavTab>('dashboard');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(
    null
  );
  const [targetApprovalRecordId, setTargetApprovalRecordId] = useState<string | null>(null);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 4000);
  };

  const runAnalysisWithState = useCallback(async (currentState: BusinessState) => {
    setIsAnalyzing(true);
    try {
      const res = await fetch('/api/agent/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          inventory: currentState.inventory,
          sales: currentState.sales,
          orders: currentState.orders,
          invoices: currentState.invoices,
          referenceDate: '2026-11-18',
        }),
      });

      if (!res.ok) {
        throw new Error('Analysis request failed');
      }

      const data = await res.json();

      setState((prev) => {
        // Merge new audit events with existing ones
        const mergedAudit = [...data.auditEvents, ...prev.auditLog].slice(0, 100);

        // Retain prior approval/rejection state for existing draft actions
        const existingStatusMap = new Map<string, any>();
        prev.draftActions.forEach((a) => {
          if (a.approvalStatus !== 'PENDING') {
            existingStatusMap.set(a.id, a);
          }
        });

        const mergedDraftActions = data.draftActions.map((act: any) => {
          if (existingStatusMap.has(act.id)) {
            return existingStatusMap.get(act.id);
          }
          return act;
        });

        return {
          ...prev,
          exceptions: data.exceptions,
          draftActions: mergedDraftActions,
          healthScore: data.healthScore,
          lastAnalysisTimestamp: data.timestamp,
          auditLog: mergedAudit,
          aiMode: data.mode,
        };
      });

      showToast(
        `AI operations analysis complete: ${data.exceptions.length} exceptions detected, health score ${data.healthScore.overallScore}/100.`
      );
    } catch (err: any) {
      console.error('Analysis error:', err);
      showToast(`Analysis error: ${err.message || 'Check connection'}`, 'error');
    } finally {
      setIsAnalyzing(false);
    }
  }, []);

  // Hydrate state from localStorage on initial render
  useEffect(() => {
    const loaded = loadStoredBusinessState();
    setState(loaded);
    setIsHydrated(true);

    // If no analysis was ever run yet, run initial analysis automatically
    if (!loaded.lastAnalysisTimestamp && loaded.inventory.length > 0) {
      runAnalysisWithState(loaded);
    }
  }, [runAnalysisWithState]);

  const handleRunAnalysis = () => {
    runAnalysisWithState(state);
  };

  // Approval Handlers
  const handleApproveAction = (actionId: string) => {
    setState((prev) => {
      const target = prev.draftActions.find((a) => a.id === actionId);
      if (!target) return prev;

      const timestamp = new Date().toISOString();
      const updatedDrafts = prev.draftActions.map((a) =>
        a.id === actionId
          ? { ...a, approvalStatus: 'APPROVED' as const, approvedAt: timestamp }
          : a
      );

      const approvalEvent: AuditEvent = {
        id: `evt-appr-${actionId}-${Date.now()}`,
        timestamp,
        type: 'ACTION_APPROVED',
        actor: 'HUMAN',
        actionId,
        summary: `Approved — Demo Mode: ${target.title}`,
        severity: 'INFO',
        details: {
          actionType: target.type,
          recordId: target.relatedRecordId,
          totalAmount: target.payload.totalAmount,
        },
      };

      return {
        ...prev,
        draftActions: updatedDrafts,
        auditLog: [approvalEvent, ...prev.auditLog],
      };
    });

    showToast('Action proposal marked as "Approved — Demo Mode". Recorded in audit trail.');
  };

  const handleRejectAction = (actionId: string, reason: string) => {
    setState((prev) => {
      const target = prev.draftActions.find((a) => a.id === actionId);
      if (!target) return prev;

      const timestamp = new Date().toISOString();
      const updatedDrafts = prev.draftActions.map((a) =>
        a.id === actionId
          ? {
              ...a,
              approvalStatus: 'REJECTED' as const,
              rejectedAt: timestamp,
              rejectionReason: reason,
            }
          : a
      );

      const rejectionEvent: AuditEvent = {
        id: `evt-rej-${actionId}-${Date.now()}`,
        timestamp,
        type: 'ACTION_REJECTED',
        actor: 'HUMAN',
        actionId,
        summary: `Action Rejected: ${target.title} (Reason: ${reason})`,
        severity: 'MEDIUM',
        details: {
          actionType: target.type,
          recordId: target.relatedRecordId,
          reason,
        },
      };

      return {
        ...prev,
        draftActions: updatedDrafts,
        auditLog: [rejectionEvent, ...prev.auditLog],
      };
    });

    showToast('Action rejected. Rationale archived in audit log.', 'info');
  };

  // Reset Demo Data
  const handleResetDemoData = () => {
    const reset = clearStoredBusinessState();
    setState(reset);
    showToast('Demo business "Northstar Retail & Distribution" reset to baseline synthetic state.');
    runAnalysisWithState(reset);
  };

  // Navigation Helper with target record
  const handleNavigateToApprovals = (recordId?: string) => {
    if (recordId) {
      setTargetApprovalRecordId(recordId);
    } else {
      setTargetApprovalRecordId(null);
    }
    setCurrentTab('approvals');
  };

  const pendingApprovalsCount = state.draftActions.filter((a) => a.approvalStatus === 'PENDING').length;
  const criticalExceptionsCount = state.exceptions.filter((e) => e.severity === 'CRITICAL').length;

  return (
    <div className="flex h-screen bg-[#090d16] text-slate-100 overflow-hidden font-sans">
      {/* Left Sidebar */}
      <Sidebar
        currentTab={currentTab}
        onSelectTab={(tab) => {
          setTargetApprovalRecordId(null);
          setCurrentTab(tab);
        }}
        pendingApprovalsCount={pendingApprovalsCount}
        criticalExceptionsCount={criticalExceptionsCount}
        aiMode={state.aiMode}
        onResetDemoData={handleResetDemoData}
      />

      {/* Main Container */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header */}
        <TopBar
          onRunAnalysis={handleRunAnalysis}
          isAnalyzing={isAnalyzing}
          lastAnalysisTimestamp={state.lastAnalysisTimestamp}
          criticalCount={criticalExceptionsCount}
          aiMode={state.aiMode}
        />

        {/* Dynamic Main Workspace */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8">
          <div className="max-w-7xl mx-auto">
            {currentTab === 'dashboard' && (
              <ExecutiveDashboard
                state={state}
                onNavigate={setCurrentTab}
                onRunAnalysis={handleRunAnalysis}
                isAnalyzing={isAnalyzing}
              />
            )}

            {currentTab === 'inventory' && (
              <InventoryTable inventory={state.inventory} />
            )}

            {currentTab === 'orders' && (
              <OrderTable orders={state.orders} referenceDate="2026-11-18" />
            )}

            {currentTab === 'receivables' && (
              <ReceivablesTable invoices={state.invoices} referenceDate="2026-11-18" />
            )}

            {currentTab === 'agent' && (
              <AgentCenter
                exceptions={state.exceptions}
                healthScore={state.healthScore}
                lastAnalysisTimestamp={state.lastAnalysisTimestamp}
                onRunAnalysis={handleRunAnalysis}
                isAnalyzing={isAnalyzing}
                onNavigateToApprovals={handleNavigateToApprovals}
                aiMode={state.aiMode}
              />
            )}

            {currentTab === 'chat' && <AskOpsPilotChat state={state} />}

            {currentTab === 'approvals' && (
              <ApprovalCenter
                draftActions={state.draftActions}
                onApproveAction={handleApproveAction}
                onRejectAction={handleRejectAction}
                targetRecordId={targetApprovalRecordId}
              />
            )}

            {currentTab === 'activity' && <AuditTimeline auditLog={state.auditLog} />}

            {currentTab === 'data' && (
              <DataIngestionModal
                onUpdateInventory={(data) => {
                  setState((prev) => ({
                    ...prev,
                    inventory: data,
                    auditLog: [
                      {
                        id: `evt-imp-inv-${Date.now()}`,
                        timestamp: new Date().toISOString(),
                        type: 'DATASET_IMPORTED',
                        actor: 'HUMAN',
                        summary: `Imported ${data.length} custom inventory products via CSV.`,
                        severity: 'INFO',
                      },
                      ...prev.auditLog,
                    ],
                  }));
                  showToast(`Imported ${data.length} inventory products.`);
                }}
                onUpdateOrders={(data) => {
                  setState((prev) => ({
                    ...prev,
                    orders: data,
                    auditLog: [
                      {
                        id: `evt-imp-ord-${Date.now()}`,
                        timestamp: new Date().toISOString(),
                        type: 'DATASET_IMPORTED',
                        actor: 'HUMAN',
                        summary: `Imported ${data.length} custom orders via CSV.`,
                        severity: 'INFO',
                      },
                      ...prev.auditLog,
                    ],
                  }));
                  showToast(`Imported ${data.length} orders.`);
                }}
                onUpdateInvoices={(data) => {
                  setState((prev) => ({
                    ...prev,
                    invoices: data,
                    auditLog: [
                      {
                        id: `evt-imp-invc-${Date.now()}`,
                        timestamp: new Date().toISOString(),
                        type: 'DATASET_IMPORTED',
                        actor: 'HUMAN',
                        summary: `Imported ${data.length} custom invoices via CSV.`,
                        severity: 'INFO',
                      },
                      ...prev.auditLog,
                    ],
                  }));
                  showToast(`Imported ${data.length} invoices.`);
                }}
                onUpdateSales={(data) => {
                  setState((prev) => ({
                    ...prev,
                    sales: data,
                    auditLog: [
                      {
                        id: `evt-imp-sale-${Date.now()}`,
                        timestamp: new Date().toISOString(),
                        type: 'DATASET_IMPORTED',
                        actor: 'HUMAN',
                        summary: `Imported ${data.length} custom sales records via CSV.`,
                        severity: 'INFO',
                      },
                      ...prev.auditLog,
                    ],
                  }));
                  showToast(`Imported ${data.length} sales records.`);
                }}
                onResetDemoData={handleResetDemoData}
              />
            )}
          </div>
        </main>
      </div>

      {/* Floating Toast Notification */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 rounded-xl bg-slate-900 border border-slate-700 shadow-2xl text-xs font-medium text-white animate-in fade-in slide-in-from-bottom-4">
          {toast.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />}
          {toast.type === 'error' && <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />}
          {toast.type === 'info' && <Info className="w-4 h-4 text-cyan-400 shrink-0" />}
          <span>{toast.message}</span>
        </div>
      )}
    </div>
  );
}
