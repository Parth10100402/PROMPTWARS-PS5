'use client';

import React, { useState } from 'react';
import { Bot, User, Send, Sparkles, Cpu, CornerDownLeft, ShieldCheck } from 'lucide-react';
import { BusinessState } from '@/types';

interface Message {
  id: string;
  sender: 'user' | 'agent';
  text: string;
  timestamp: string;
  mode?: 'GEMINI_ASSISTED' | 'DETERMINISTIC_RULES';
  referencedIds?: string[];
}

interface AskOpsPilotChatProps {
  state: BusinessState;
}

export const AskOpsPilotChat: React.FC<AskOpsPilotChatProps> = ({ state }) => {
  const [inputQuery, setInputQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'msg-welcome',
      sender: 'agent',
      text: `Hello! I am **OpsPilot**, your AI Business Operations Manager. I have indexed ${state.inventory.length} inventory products, ${state.orders.length} orders, and ${state.invoices.length} invoices for Northstar Retail & Distribution.\n\nAsk me anything about current stock risks, delayed deliveries, cash flow receivables, or operational decisions.`,
      timestamp: '09:00 AM',
      mode: state.aiMode,
    },
  ]);

  const quickQuestions = [
    'What needs my attention today?',
    'Which products are at risk?',
    'Why is SKU-101 critical?',
    'Show overdue payments.',
    'Which orders are delayed?',
    'Summarize my business health.',
  ];

  const handleSend = async (queryToSend?: string) => {
    const q = (queryToSend || inputQuery).trim();
    if (!q || isLoading) return;

    setInputQuery('');
    const userMsg: Message = {
      id: `usr-${Date.now()}`,
      sender: 'user',
      text: q,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setIsLoading(true);

    try {
      const res = await fetch('/api/agent/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: q,
          state: {
            inventory: state.inventory,
            orders: state.orders,
            invoices: state.invoices,
            sales: state.sales,
            exceptions: state.exceptions,
            healthScore: state.healthScore,
          },
        }),
      });

      if (!res.ok) {
        throw new Error('Inquiry failed');
      }

      const data = await res.json();
      const agentMsg: Message = {
        id: `agt-${Date.now()}`,
        sender: 'agent',
        text: data.answer,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        mode: data.mode,
        referencedIds: data.referencedIds,
      };

      setMessages((prev) => [...prev, agentMsg]);
    } catch (err) {
      const fallbackMsg: Message = {
        id: `agt-err-${Date.now()}`,
        sender: 'agent',
        text: `OpsPilot encountered a temporary processing hiccup. Current operational health is ${state.healthScore?.overallScore ?? 100}/100. Please verify that analysis has been run.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        mode: 'DETERMINISTIC_RULES',
      };
      setMessages((prev) => [...prev, fallbackMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-8.5rem)] rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden shadow-2xl">
      {/* Chat Header */}
      <div className="p-4 border-b border-slate-800 bg-[#0c1220] flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center shadow-md">
            <Bot className="w-4 h-4 text-slate-950 font-bold" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-white tracking-tight">Ask OpsPilot</h2>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            </div>
            <p className="text-[11px] text-slate-400">Contextual Operations Assistant • Grounded in Business Facts</p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-400">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span className="hidden sm:inline">Anti-Hallucination & Anti-Injection Guardrails Active</span>
        </div>
      </div>

      {/* Suggested Questions Pills */}
      <div className="p-3 bg-slate-950/60 border-b border-slate-800 flex items-center gap-2 overflow-x-auto text-xs">
        <span className="text-[11px] font-semibold text-slate-400 shrink-0">Quick Inquiries:</span>
        {quickQuestions.map((q) => (
          <button
            key={q}
            onClick={() => handleSend(q)}
            disabled={isLoading}
            className="px-3 py-1 rounded-full bg-slate-900 hover:bg-slate-800 border border-slate-800 text-cyan-300 shrink-0 transition-colors text-[11px] hover:border-cyan-500/50"
          >
            {q}
          </button>
        ))}
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((m) => {
          const isAgent = m.sender === 'agent';
          return (
            <div
              key={m.id}
              className={`flex gap-3 max-w-3xl ${isAgent ? 'mr-auto' : 'ml-auto flex-row-reverse'}`}
            >
              <div
                className={`w-7 h-7 rounded-lg shrink-0 flex items-center justify-center ${
                  isAgent
                    ? 'bg-gradient-to-br from-cyan-400 to-blue-600 text-slate-950'
                    : 'bg-slate-700 text-slate-200'
                }`}
              >
                {isAgent ? <Bot className="w-4 h-4" /> : <User className="w-4 h-4" />}
              </div>

              <div
                className={`p-4 rounded-2xl text-xs leading-relaxed space-y-2 ${
                  isAgent
                    ? 'bg-slate-950 border border-slate-800 text-slate-200 shadow-md'
                    : 'bg-cyan-600 text-white shadow-md'
                }`}
              >
                <div className="whitespace-pre-wrap">{m.text}</div>

                {isAgent && (
                  <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-slate-500">
                    <span className="flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-cyan-400" />
                      Mode:{' '}
                      <strong className="text-slate-400 font-mono">
                        {m.mode === 'GEMINI_ASSISTED' ? 'Gemini 2.5 Flash' : 'Deterministic Rules'}
                      </strong>
                    </span>
                    <span>{m.timestamp}</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {isLoading && (
          <div className="flex gap-3 max-w-xl mr-auto">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-cyan-400 to-blue-600 text-slate-950 shrink-0 flex items-center justify-center">
              <Bot className="w-4 h-4" />
            </div>
            <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 text-xs text-slate-400 flex items-center gap-2">
              <div className="w-3 h-3 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin"></div>
              <span>OpsPilot is querying operational facts and calculating answer...</span>
            </div>
          </div>
        )}
      </div>

      {/* Input Bar */}
      <div className="p-4 border-t border-slate-800 bg-[#0c1220]">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex items-center gap-2"
        >
          <input
            type="text"
            value={inputQuery}
            onChange={(e) => setInputQuery(e.target.value)}
            placeholder="Ask about inventory run-rates, delayed orders, overdue invoices..."
            disabled={isLoading}
            className="flex-1 px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors"
          />
          <button
            type="submit"
            disabled={!inputQuery.trim() || isLoading}
            className="px-4 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition-colors shadow-lg shadow-cyan-500/20"
          >
            <span>Ask</span>
            <Send className="w-3.5 h-3.5" />
          </button>
        </form>
      </div>
    </div>
  );
};
