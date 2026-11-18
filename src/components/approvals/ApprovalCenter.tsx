'use client';

import React, { useState } from 'react';
import {
  CheckSquare,
  ShieldCheck,
  Check,
  X,
  Eye,
  ShoppingBag,
  Mail,
  Receipt,
  Clock,
  AlertTriangle,
  ArrowRight,
  Filter,
} from 'lucide-react';
import { DraftAction, ApprovalStatus } from '@/types';

interface ApprovalCenterProps {
  draftActions: DraftAction[];
  onApproveAction: (actionId: string) => void;
  onRejectAction: (actionId: string, reason: string) => void;
  targetRecordId?: string | null;
}

export const ApprovalCenter: React.FC<ApprovalCenterProps> = ({
  draftActions,
  onApproveAction,
  onRejectAction,
  targetRecordId,
}) => {
  const [statusFilter, setStatusFilter] = useState<string>('PENDING');
  const [selectedActionForModal, setSelectedActionForModal] = useState<DraftAction | null>(null);
  const [rejectingActionId, setRejectingActionId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');

  const filteredActions = draftActions.filter((action) => {
    if (targetRecordId && action.relatedRecordId === targetRecordId) {
      return true;
    }
    if (statusFilter === 'ALL') return true;
    return action.approvalStatus === statusFilter;
  });

  const pendingCount = draftActions.filter((a) => a.approvalStatus === 'PENDING').length;
  const approvedCount = draftActions.filter((a) => a.approvalStatus === 'APPROVED').length;
  const rejectedCount = draftActions.filter((a) => a.approvalStatus === 'REJECTED').length;

  const handleConfirmReject = () => {
    if (!rejectingActionId) return;
    onRejectAction(
      rejectingActionId,
      rejectionReason.trim() || 'Rejected by business operations manager.'
    );
    setRejectingActionId(null);
    setRejectionReason('');
  };

  const getActionTypeIcon = (type: DraftAction['type']) => {
    switch (type) {
      case 'PURCHASE_ORDER':
        return <ShoppingBag className="w-4 h-4 text-cyan-400" />;
      case 'CUSTOMER_MESSAGE':
        return <Mail className="w-4 h-4 text-blue-400" />;
      case 'PAYMENT_REMINDER':
        return <Receipt className="w-4 h-4 text-purple-400" />;
      default:
        return <CheckSquare className="w-4 h-4 text-emerald-400" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-2xl bg-slate-900 border border-slate-800">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
            <h2 className="text-xl font-bold text-white tracking-tight">Action Approval Center</h2>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800">
              Human-in-the-Loop Safeguard
            </span>
          </div>
          <p className="text-xs text-slate-400">
            Autonomous agent proposals require human sign-off before consequential purchase orders, payment requests, or customer communications are dispatched.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="px-3.5 py-2 rounded-xl bg-cyan-950/40 border border-cyan-800/60 text-right">
            <div className="text-[10px] text-cyan-400 uppercase tracking-wider font-semibold">
              Pending Review
            </div>
            <div className="text-sm font-bold text-cyan-300">{pendingCount} actions</div>
          </div>
          <div className="px-3.5 py-2 rounded-xl bg-emerald-950/40 border border-emerald-800/60 text-right">
            <div className="text-[10px] text-emerald-400 uppercase tracking-wider font-semibold">
              Approved
            </div>
            <div className="text-sm font-bold text-emerald-300">{approvedCount}</div>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center justify-between gap-3 p-3 rounded-xl bg-slate-900/60 border border-slate-800 text-xs">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setStatusFilter('PENDING')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
              statusFilter === 'PENDING'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Pending Review ({pendingCount})
          </button>
          <button
            onClick={() => setStatusFilter('APPROVED')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
              statusFilter === 'APPROVED'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Approved ({approvedCount})
          </button>
          <button
            onClick={() => setStatusFilter('REJECTED')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
              statusFilter === 'REJECTED'
                ? 'bg-red-500/20 text-red-300 border border-red-500/40 font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Rejected ({rejectedCount})
          </button>
          <button
            onClick={() => setStatusFilter('ALL')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
              statusFilter === 'ALL'
                ? 'bg-slate-800 text-slate-200 border border-slate-700 font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            All Actions ({draftActions.length})
          </button>
        </div>

        <div className="text-slate-400">
          Showing <strong className="text-slate-200">{filteredActions.length}</strong> proposals
        </div>
      </div>

      {/* Action Proposal Cards */}
      <div className="space-y-4">
        {filteredActions.length === 0 ? (
          <div className="p-12 text-center rounded-2xl bg-slate-950/60 border border-slate-800">
            <CheckSquare className="w-10 h-10 text-slate-600 mx-auto mb-3" />
            <h3 className="text-sm font-bold text-slate-300">Queue is empty</h3>
            <p className="text-xs text-slate-500 mt-1">
              No draft proposals found matching &quot;{statusFilter}&quot;. Run analysis to generate new action proposals.
            </p>
          </div>
        ) : (
          filteredActions.map((action) => {
            const isPending = action.approvalStatus === 'PENDING';
            const isApproved = action.approvalStatus === 'APPROVED';
            const isRejected = action.approvalStatus === 'REJECTED';

            return (
              <div
                key={action.id}
                className={`p-5 rounded-2xl bg-slate-900 border transition-all ${
                  isApproved
                    ? 'border-emerald-800/60 bg-emerald-950/10'
                    : isRejected
                    ? 'border-red-800/40 opacity-75'
                    : 'border-slate-800 hover:border-slate-700'
                }`}
              >
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-800">
                  <div className="flex items-center gap-2.5">
                    <div className="p-1.5 rounded-lg bg-slate-950 border border-slate-800">
                      {getActionTypeIcon(action.type)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-bold text-cyan-400">{action.id}</span>
                        <span className="text-[10px] font-mono text-slate-400">
                          Record: <strong>{action.relatedRecordId}</strong>
                        </span>
                      </div>
                      <h3 className="text-sm font-bold text-white mt-0.5">{action.title}</h3>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${
                        action.priority === 'CRITICAL'
                          ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                          : action.priority === 'HIGH'
                          ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30'
                          : 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                      }`}
                    >
                      {action.priority} Priority
                    </span>

                    <span
                      className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                        isApproved
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                          : isRejected
                          ? 'bg-red-500/20 text-red-400 border border-red-500/40'
                          : 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 animate-pulse'
                      }`}
                    >
                      {isApproved
                        ? 'Approved — Demo Mode'
                        : isRejected
                        ? 'Rejected'
                        : 'Awaiting Decision'}
                    </span>
                  </div>
                </div>

                {/* Reason & Outcome */}
                <div className="py-3 space-y-2 text-xs">
                  <div>
                    <span className="text-slate-400 font-medium">Reason for Recommendation: </span>
                    <span className="text-slate-300">{action.reason}</span>
                  </div>
                  <div>
                    <span className="text-cyan-400 font-medium">Expected Outcome: </span>
                    <span className="text-slate-300">{action.expectedOutcome}</span>
                  </div>

                  {/* Summary of payload values */}
                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-[11px] flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-4">
                      {action.payload.supplierName && (
                        <span>
                          Supplier: <strong className="text-slate-200">{action.payload.supplierName}</strong>
                        </span>
                      )}
                      {action.payload.recipientName && (
                        <span>
                          Recipient: <strong className="text-slate-200">{action.payload.recipientName}</strong>
                        </span>
                      )}
                      {action.payload.totalAmount && (
                        <span>
                          Value: <strong className="text-cyan-400 font-mono">${action.payload.totalAmount.toLocaleString()}</strong>
                        </span>
                      )}
                    </div>

                    <button
                      onClick={() => setSelectedActionForModal(action)}
                      className="text-cyan-400 hover:text-cyan-300 flex items-center gap-1 font-semibold"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>View Full Payload Draft</span>
                    </button>
                  </div>

                  {/* Rejection notice if rejected */}
                  {isRejected && action.rejectionReason && (
                    <div className="p-2.5 rounded-lg bg-red-950/30 border border-red-900/40 text-[11px] text-red-300">
                      <strong>Rejection Note:</strong> {action.rejectionReason}
                    </div>
                  )}

                  {/* Approval notice if approved */}
                  {isApproved && action.approvedAt && (
                    <div className="p-2.5 rounded-lg bg-emerald-950/30 border border-emerald-900/40 text-[11px] text-emerald-300 flex items-center justify-between">
                      <span>Approved — Demo Mode (Simulation Only). No external transactions placed.</span>
                      <span className="font-mono text-[10px] text-emerald-400">
                        {new Date(action.approvedAt).toLocaleTimeString()}
                      </span>
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                {isPending && (
                  <div className="pt-3 border-t border-slate-800/80 flex items-center justify-end gap-3">
                    <button
                      onClick={() => setRejectingActionId(action.id)}
                      className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold text-red-400 hover:text-red-300 bg-red-950/40 hover:bg-red-900/50 border border-red-800/60 transition-colors"
                    >
                      <X className="w-3.5 h-3.5" />
                      <span>Reject</span>
                    </button>

                    <button
                      onClick={() => onApproveAction(action.id)}
                      className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-semibold text-slate-950 bg-emerald-400 hover:bg-emerald-300 shadow-md shadow-emerald-500/20 transition-colors"
                    >
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                      <span>Approve (Demo Mode)</span>
                    </button>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Rejection Reason Modal */}
      {rejectingActionId && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-2xl p-6 shadow-2xl space-y-4">
            <h3 className="font-bold text-sm text-white">Record Rejection Decision</h3>
            <p className="text-xs text-slate-400">
              Provide a rationale for why this recommended action is rejected. This reason will be permanently archived in the audit timeline.
            </p>
            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="e.g., Supplier lead time is currently non-viable; waiting for Q4 consolidation."
              rows={3}
              className="w-full p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
            />
            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setRejectingActionId(null)}
                className="px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmReject}
                className="px-4 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-white text-xs font-bold"
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Full Payload View Modal */}
      {selectedActionForModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-700 rounded-2xl p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="font-bold text-sm text-white">{selectedActionForModal.title}</h3>
              <button
                onClick={() => setSelectedActionForModal(null)}
                className="text-slate-400 hover:text-slate-200 text-sm font-mono"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 space-y-1">
                <div>
                  <span className="text-slate-500 font-medium">Action Type:</span>{' '}
                  <span className="text-cyan-400 font-mono">{selectedActionForModal.type}</span>
                </div>
                <div>
                  <span className="text-slate-500 font-medium">Related ID:</span>{' '}
                  <span className="text-slate-200 font-mono">{selectedActionForModal.relatedRecordId}</span>
                </div>
                <div>
                  <span className="text-slate-500 font-medium">Priority:</span>{' '}
                  <span className="text-slate-200 font-bold">{selectedActionForModal.priority}</span>
                </div>
              </div>

              <div>
                <span className="text-slate-400 font-semibold block mb-1">Structured Action Payload:</span>
                <pre className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-[11px] font-mono text-slate-300 overflow-x-auto whitespace-pre-wrap">
                  {JSON.stringify(selectedActionForModal.payload, null, 2)}
                </pre>
              </div>

              <div className="p-2.5 rounded bg-cyan-950/30 border border-cyan-800/40 text-[11px] text-cyan-300">
                🔒 <strong>Demo Mode Notice:</strong> Approved actions are simulated and tagged as &quot;Approved — Demo Mode&quot;. No live external orders or communications will be initiated.
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelectedActionForModal(null)}
                className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
