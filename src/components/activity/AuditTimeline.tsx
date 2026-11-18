'use client';

import React, { useState } from 'react';
import {
  History,
  CheckCircle2,
  XCircle,
  Play,
  AlertTriangle,
  FileSpreadsheet,
  ShieldCheck,
  Filter,
  User,
  Bot,
} from 'lucide-react';
import { AuditEvent } from '@/types';

interface AuditTimelineProps {
  auditLog: AuditEvent[];
}

export const AuditTimeline: React.FC<AuditTimelineProps> = ({ auditLog }) => {
  const [filterType, setFilterType] = useState<string>('ALL');
  const [filterActor, setFilterActor] = useState<string>('ALL');

  const filteredLog = auditLog.filter((evt) => {
    const matchType = filterType === 'ALL' || evt.type === filterType;
    const matchActor = filterActor === 'ALL' || evt.actor === filterActor;
    return matchType && matchActor;
  });

  const getEventBadge = (type: AuditEvent['type']) => {
    switch (type) {
      case 'ACTION_APPROVED':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
            <CheckCircle2 className="w-3 h-3" />
            Approved (Demo)
          </span>
        );
      case 'ACTION_REJECTED':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-red-500/20 text-red-300 border border-red-500/30">
            <XCircle className="w-3 h-3" />
            Rejected
          </span>
        );
      case 'ACTION_DRAFTED':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
            Action Drafted
          </span>
        );
      case 'EXCEPTION_DETECTED':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
            <AlertTriangle className="w-3 h-3" />
            Exception Flagged
          </span>
        );
      case 'ANALYSIS_STARTED':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30">
            <Play className="w-3 h-3" />
            Analysis Run
          </span>
        );
      case 'DATASET_IMPORTED':
      case 'DATASET_RESET':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">
            <FileSpreadsheet className="w-3 h-3" />
            Dataset Synced
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-300">
            Audit Event
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
            <History className="w-5 h-5 text-cyan-400" />
            <h2 className="text-xl font-bold text-white tracking-tight">Audit & Activity Timeline</h2>
          </div>
          <p className="text-xs text-slate-400">
            Immutable chronological audit log capturing autonomous agent detections, algorithmic runs, and human approval sign-offs.
          </p>
        </div>

        <div className="px-3.5 py-2 rounded-xl bg-slate-950/70 border border-slate-800 text-right">
          <div className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">
            Recorded Audit Events
          </div>
          <div className="text-sm font-bold text-white">{auditLog.length}</div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 text-xs">
        <div className="flex items-center gap-3">
          <Filter className="w-4 h-4 text-cyan-400" />
          <span className="text-slate-400 font-medium">Filter Audit Events:</span>

          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-200 text-xs focus:outline-none focus:border-cyan-500"
          >
            <option value="ALL">All Event Types</option>
            <option value="ANALYSIS_STARTED">Analysis Started</option>
            <option value="EXCEPTION_DETECTED">Exception Detected</option>
            <option value="ACTION_DRAFTED">Action Drafted</option>
            <option value="ACTION_APPROVED">Action Approved</option>
            <option value="ACTION_REJECTED">Action Rejected</option>
            <option value="DATASET_IMPORTED">Dataset Imported</option>
            <option value="DATASET_RESET">Dataset Reset</option>
          </select>

          <select
            value={filterActor}
            onChange={(e) => setFilterActor(e.target.value)}
            className="px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-200 text-xs focus:outline-none focus:border-cyan-500"
          >
            <option value="ALL">All Actors</option>
            <option value="AGENT">Autonomous Agent</option>
            <option value="HUMAN">Human Operator</option>
          </select>
        </div>

        <div className="text-slate-400">
          Showing <strong className="text-slate-200">{filteredLog.length}</strong> events
        </div>
      </div>

      {/* Timeline Stream */}
      <div className="relative pl-6 space-y-4 before:absolute before:left-2.5 before:top-3 before:bottom-3 before:w-0.5 before:bg-slate-800">
        {filteredLog.length === 0 ? (
          <div className="p-8 text-center rounded-xl bg-slate-950/60 border border-slate-800 text-xs text-slate-500">
            No audit records matching filter criteria.
          </div>
        ) : (
          filteredLog.map((evt, idx) => {
            const isAgent = evt.actor === 'AGENT';
            return (
              <div key={evt.id || idx} className="relative group">
                {/* Node pin */}
                <div
                  className={`absolute -left-6 top-3 w-5 h-5 rounded-full border-2 bg-slate-950 flex items-center justify-center transition-colors ${
                    evt.type === 'ACTION_APPROVED'
                      ? 'border-emerald-500 text-emerald-400'
                      : evt.type === 'ACTION_REJECTED'
                      ? 'border-red-500 text-red-400'
                      : isAgent
                      ? 'border-cyan-500 text-cyan-400'
                      : 'border-slate-500 text-slate-400'
                  }`}
                >
                  <div
                    className={`w-1.5 h-1.5 rounded-full ${
                      evt.type === 'ACTION_APPROVED'
                        ? 'bg-emerald-400'
                        : evt.type === 'ACTION_REJECTED'
                        ? 'bg-red-400'
                        : isAgent
                        ? 'bg-cyan-400'
                        : 'bg-slate-400'
                    }`}
                  />
                </div>

                {/* Event Card */}
                <div className="p-4 rounded-xl bg-slate-900 border border-slate-800/80 hover:border-slate-700 transition-colors text-xs space-y-2">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      {getEventBadge(evt.type)}
                      <span className="font-mono text-slate-400 text-[11px]">
                        Actor:{' '}
                        <strong className={isAgent ? 'text-cyan-400' : 'text-slate-200'}>
                          {evt.actor}
                        </strong>
                      </span>
                    </div>

                    <span className="font-mono text-[11px] text-slate-500">
                      {new Date(evt.timestamp).toLocaleString()}
                    </span>
                  </div>

                  <p className="text-slate-200 font-medium text-xs leading-relaxed">{evt.summary}</p>

                  {/* Details json if present */}
                  {evt.details && Object.keys(evt.details).length > 0 && (
                    <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800/60 font-mono text-[10px] text-slate-400 overflow-x-auto">
                      {JSON.stringify(evt.details, null, 2)}
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
