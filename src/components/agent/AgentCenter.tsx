'use client';

import React, { useState } from 'react';
import {
  Cpu,
  Play,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ArrowRight,
  TrendingDown,
  Layers,
  ShieldCheck,
  Filter,
} from 'lucide-react';
import { OperationalException, BusinessHealthScore, RiskLevel } from '@/types';

interface AgentCenterProps {
  exceptions: OperationalException[];
  healthScore: BusinessHealthScore | null;
  lastAnalysisTimestamp: string | null;
  onRunAnalysis: () => void;
  isAnalyzing: boolean;
  onNavigateToApprovals: (recordId?: string) => void;
  aiMode: 'GEMINI_ASSISTED' | 'DETERMINISTIC_RULES';
}

export const AgentCenter: React.FC<AgentCenterProps> = ({
  exceptions,
  healthScore,
  lastAnalysisTimestamp,
  onRunAnalysis,
  isAnalyzing,
  onNavigateToApprovals,
  aiMode,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedSeverity, setSelectedSeverity] = useState<string>('ALL');

  const filteredExceptions = exceptions.filter((exc) => {
    const matchCat = selectedCategory === 'ALL' || exc.category === selectedCategory;
    const matchSev = selectedSeverity === 'ALL' || exc.severity === selectedSeverity;
    return matchCat && matchSev;
  });

  const criticalCount = exceptions.filter((e) => e.severity === 'CRITICAL').length;
  const highCount = exceptions.filter((e) => e.severity === 'HIGH').length;
  const mediumCount = exceptions.filter((e) => e.severity === 'MEDIUM').length;

  return (
    <div className="space-y-6">
      {/* Hero Banner with Big Call to Action */}
      <div className="relative overflow-hidden p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-[#0d1628] to-[#0b1f3a] border border-cyan-900/50 shadow-2xl">
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="max-w-2xl">
            <div className="flex items-center gap-2 mb-2">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold font-mono bg-cyan-950 text-cyan-400 border border-cyan-800">
                <Cpu className="w-3.5 h-3.5" />
                AUTONOMOUS OPERATIONS ENGINE
              </span>
              <span className="text-xs text-slate-400">
                Mode: <strong className="text-emerald-400">{aiMode === 'GEMINI_ASSISTED' ? 'Gemini 2.5 Flash' : 'Deterministic Rule Engine'}</strong>
              </span>
            </div>
            <h1 className="text-2xl lg:text-3xl font-extrabold text-white tracking-tight">
              AI Operations Agent Center
            </h1>
            <p className="text-xs text-slate-300 mt-2 leading-relaxed">
              OpsPilot continuously inspects business data, runs deterministic operational rules, detects exceptions with concrete evidence, and prepares actionable human-in-the-loop workflows.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3 shrink-0">
            <button
              onClick={onRunAnalysis}
              disabled={isAnalyzing}
              className={`w-full sm:w-auto flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-xl font-bold text-xs tracking-wider transition-all duration-200 shadow-xl ${
                isAnalyzing
                  ? 'bg-slate-800 text-slate-400 cursor-not-allowed border border-slate-700'
                  : 'bg-gradient-to-r from-cyan-400 to-blue-500 hover:from-cyan-300 hover:to-blue-400 text-slate-950 shadow-cyan-500/25 active:scale-95'
              }`}
            >
              {isAnalyzing ? (
                <>
                  <div className="w-4 h-4 border-2 border-slate-400 border-t-transparent rounded-full animate-spin"></div>
                  <span>ANALYZING OPERATIONS...</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-current" />
                  <span>RUN AI OPERATIONS ANALYSIS</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Live Step Progress Simulation when running */}
        {isAnalyzing && (
          <div className="mt-6 pt-4 border-t border-slate-800/80">
            <div className="flex items-center justify-between text-xs text-cyan-400 font-mono mb-2">
              <span className="flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5 animate-spin" />
                Executing Pipeline: Validating datasets → Evaluating rules → Correlating exceptions...
              </span>
              <span>In Progress</span>
            </div>
            <div className="w-full h-1.5 bg-slate-950 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 animate-pulse w-3/4 rounded-full"></div>
            </div>
          </div>
        )}
      </div>

      {/* Operations Analysis Summary Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
          <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Total Exceptions</div>
          <div className="text-2xl font-bold text-white mt-1">{exceptions.length}</div>
          <div className="text-[11px] text-slate-500 mt-1">Identified across datasets</div>
        </div>

        <div className="p-4 rounded-xl bg-red-950/30 border border-red-900/50">
          <div className="text-[11px] font-semibold text-red-400 uppercase tracking-wider">Critical Severity</div>
          <div className="text-2xl font-bold text-red-300 mt-1">{criticalCount}</div>
          <div className="text-[11px] text-red-400/80 mt-1">Requires immediate intervention</div>
        </div>

        <div className="p-4 rounded-xl bg-orange-950/30 border border-orange-900/50">
          <div className="text-[11px] font-semibold text-orange-400 uppercase tracking-wider">High Risk Warnings</div>
          <div className="text-2xl font-bold text-orange-300 mt-1">{highCount}</div>
          <div className="text-[11px] text-orange-400/80 mt-1">Approaching replenishment thresholds</div>
        </div>

        <div className="p-4 rounded-xl bg-yellow-950/20 border border-yellow-900/40">
          <div className="text-[11px] font-semibold text-yellow-400 uppercase tracking-wider">Medium Cover</div>
          <div className="text-2xl font-bold text-yellow-300 mt-1">{mediumCount}</div>
          <div className="text-[11px] text-yellow-400/80 mt-1">Normal replenishment cycles</div>
        </div>
      </div>

      {/* Exception Filter Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-xl bg-slate-900/60 border border-slate-800">
        <div className="flex items-center gap-3">
          <Filter className="w-4 h-4 text-cyan-400" />
          <span className="text-xs font-semibold text-slate-300">Filter Exceptions:</span>

          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
          >
            <option value="ALL">All Categories</option>
            <option value="INVENTORY">Inventory Stockout</option>
            <option value="ORDER">Delayed Orders</option>
            <option value="RECEIVABLE">Overdue Receivables</option>
            <option value="SALES">Sales Velocity Anomalies</option>
          </select>

          <select
            value={selectedSeverity}
            onChange={(e) => setSelectedSeverity(e.target.value)}
            className="px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
          >
            <option value="ALL">All Severities</option>
            <option value="CRITICAL">Critical Only</option>
            <option value="HIGH">High Only</option>
            <option value="MEDIUM">Medium Only</option>
          </select>
        </div>

        <div className="text-xs text-slate-400">
          Showing <strong className="text-slate-200">{filteredExceptions.length}</strong> of {exceptions.length} exceptions
        </div>
      </div>

      {/* Exceptions Feed */}
      <div className="space-y-4">
        {filteredExceptions.length === 0 ? (
          <div className="p-12 text-center rounded-2xl bg-slate-950/60 border border-slate-800">
            <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto mb-3 opacity-90" />
            <h3 className="text-base font-bold text-white">No exceptions detected</h3>
            <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
              Click the &quot;RUN AI OPERATIONS ANALYSIS&quot; button above to evaluate all business datasets and detect operational risks.
            </p>
          </div>
        ) : (
          filteredExceptions.map((exc) => {
            const isCritical = exc.severity === 'CRITICAL';
            const isHigh = exc.severity === 'HIGH';

            return (
              <div
                key={exc.id}
                className={`p-5 rounded-2xl bg-slate-900/90 border transition-all duration-150 ${
                  isCritical
                    ? 'border-red-900/60 hover:border-red-600/80'
                    : isHigh
                    ? 'border-orange-900/50 hover:border-orange-600/80'
                    : 'border-slate-800 hover:border-slate-700'
                }`}
              >
                {/* Header row */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-800">
                  <div className="flex items-center gap-2.5">
                    <span
                      className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
                        isCritical
                          ? 'bg-red-500/20 text-red-400 border border-red-500/40'
                          : isHigh
                          ? 'bg-orange-500/20 text-orange-400 border border-orange-500/40'
                          : 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/40'
                      }`}
                    >
                      {exc.severity}
                    </span>
                    <span className="text-xs font-mono text-cyan-400 font-semibold">{exc.id}</span>
                    <span className="text-xs font-mono text-slate-500">[{exc.category}]</span>
                  </div>

                  <div className="flex items-center gap-3 text-xs">
                    <span className="font-mono text-slate-400">
                      Confidence: <strong className="text-cyan-400">{Math.round(exc.confidenceLevel * 100)}%</strong>
                    </span>
                    <span className="text-slate-600">•</span>
                    <span className="text-slate-500 font-mono text-[11px]">
                      {new Date(exc.detectedAt).toLocaleTimeString()}
                    </span>
                  </div>
                </div>

                {/* Body */}
                <div className="pt-3 space-y-3">
                  <h3 className="text-sm font-bold text-white tracking-tight">{exc.title}</h3>
                  <p className="text-xs text-slate-300 leading-relaxed">{exc.description}</p>

                  {/* Concrete Data Evidence Box */}
                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 text-xs">
                    <div className="text-[10px] uppercase font-mono font-bold text-slate-500 mb-1">
                      Data Evidence (Deterministic)
                    </div>
                    <code className="text-cyan-300 font-mono text-[11px] block break-all">
                      {exc.dataEvidence}
                    </code>
                  </div>

                  {/* Impact & Action */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                    <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 text-xs">
                      <span className="text-slate-400 font-medium block mb-1">Business Impact:</span>
                      <span className="text-slate-200">{exc.businessImpact}</span>
                    </div>

                    <div className="p-3 rounded-xl bg-cyan-950/20 border border-cyan-800/30 text-xs flex flex-col justify-between">
                      <div>
                        <span className="text-cyan-400 font-medium block mb-1">Recommended Action:</span>
                        <span className="text-slate-200">{exc.recommendedAction}</span>
                      </div>
                      <div className="mt-3 flex justify-end">
                        <button
                          onClick={() => onNavigateToApprovals(exc.relatedRecordId)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 text-xs font-semibold border border-cyan-500/40 transition-colors"
                        >
                          <span>Review Draft in Approval Queue</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
