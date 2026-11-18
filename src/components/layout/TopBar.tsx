'use client';

import React from 'react';
import { Play, Sparkles, Building2, Clock, CheckCircle2, AlertTriangle } from 'lucide-react';

interface TopBarProps {
  onRunAnalysis: () => void;
  isAnalyzing: boolean;
  lastAnalysisTimestamp: string | null;
  criticalCount: number;
  aiMode: 'GEMINI_ASSISTED' | 'DETERMINISTIC_RULES';
}

export const TopBar: React.FC<TopBarProps> = ({
  onRunAnalysis,
  isAnalyzing,
  lastAnalysisTimestamp,
  criticalCount,
  aiMode,
}) => {
  return (
    <header className="h-16 border-b border-slate-800 bg-[#090d16]/90 backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-20">
      {/* Left: Organization context */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800">
          <Building2 className="w-4 h-4 text-cyan-400" />
          <span className="text-xs font-semibold text-slate-200">Northstar Retail & Distribution</span>
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
        </div>

        {lastAnalysisTimestamp && (
          <div className="hidden md:flex items-center gap-1.5 text-xs text-slate-400">
            <Clock className="w-3.5 h-3.5 text-slate-500" />
            <span>
              Last analyzed:{' '}
              <strong className="text-slate-300 font-mono">
                {new Date(lastAnalysisTimestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </strong>
            </span>
          </div>
        )}
      </div>

      {/* Right: Agent Status & Action Trigger */}
      <div className="flex items-center gap-4">
        {/* Exception alert badge */}
        {criticalCount > 0 && (
          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-950/60 border border-red-800/80 text-red-400 text-xs font-medium">
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>{criticalCount} Critical Exceptions</span>
          </div>
        )}

        {/* Engine mode pill */}
        <div className="hidden lg:flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-xs">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>
          <span className="text-slate-300">
            Agent Engine:{' '}
            <strong className="text-cyan-400 font-medium">
              {aiMode === 'GEMINI_ASSISTED' ? 'Gemini 2.5' : 'Deterministic Rules'}
            </strong>
          </span>
        </div>

        {/* The Core Run Operations Analysis Button */}
        <button
          onClick={onRunAnalysis}
          disabled={isAnalyzing}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold tracking-wide transition-all duration-200 shadow-lg ${
            isAnalyzing
              ? 'bg-slate-800 text-slate-400 cursor-not-allowed border border-slate-700'
              : 'bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 shadow-cyan-500/25 active:scale-95'
          }`}
        >
          {isAnalyzing ? (
            <>
              <div className="w-3.5 h-3.5 border-2 border-slate-400 border-t-transparent rounded-full animate-spin"></div>
              <span>Analyzing Operations...</span>
            </>
          ) : (
            <>
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>RUN AI OPERATIONS ANALYSIS</span>
            </>
          )}
        </button>
      </div>
    </header>
  );
};
