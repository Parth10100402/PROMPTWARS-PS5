import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { askOpsPilotAgent } from '@/lib/agent/llm';
import { checkRateLimit, defangPromptInjection, sanitizeUntrustedText } from '@/lib/security/sanitizer';
import { BusinessState } from '@/types';

const AskQuerySchema = z.object({
  question: z
    .string()
    .min(1, 'Question cannot be empty')
    .max(500, 'Question length exceeds 500 characters limit')
    .trim(),
  state: z.object({
    inventory: z.array(z.record(z.string(), z.unknown())).default([]),
    orders: z.array(z.record(z.string(), z.unknown())).default([]),
    invoices: z.array(z.record(z.string(), z.unknown())).default([]),
    sales: z.array(z.record(z.string(), z.unknown())).default([]),
    exceptions: z.array(z.record(z.string(), z.unknown())).default([]),
    healthScore: z.unknown().nullable().optional(),
  }),
});

export async function POST(req: NextRequest) {
  // 1. Rate limiting by IP
  const clientIp = req.headers.get('x-forwarded-for')?.split(',')[0] || '127.0.0.1';
  const { allowed, remaining } = checkRateLimit(clientIp, 45, 60000);

  if (!allowed) {
    return NextResponse.json(
      { error: 'Too many queries. Rate limit exceeded (45 req/min).' },
      { status: 429, headers: { 'Retry-After': '60' } }
    );
  }

  try {
    const rawBody = await req.json();
    const validation = AskQuerySchema.safeParse(rawBody);

    if (!validation.success) {
      return NextResponse.json(
        {
          error: 'Invalid question format or parameters',
          details: validation.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`),
        },
        { status: 400 }
      );
    }

    const { question, state } = validation.data;

    // 2. Security Sanitization & Prompt Injection Defanging
    const safeText = sanitizeUntrustedText(question);
    const { cleanText } = defangPromptInjection(safeText);

    const pseudoState: BusinessState = {
      inventory: state.inventory as any,
      orders: state.orders as any,
      invoices: state.invoices as any,
      sales: state.sales as any,
      exceptions: state.exceptions as any,
      draftActions: [],
      auditLog: [],
      healthScore: state.healthScore as any,
      lastAnalysisTimestamp: null,
      isAiEnabled: Boolean(process.env.GEMINI_API_KEY),
      aiMode: process.env.GEMINI_API_KEY ? 'GEMINI_ASSISTED' : 'DETERMINISTIC_RULES',
    };

    const reply = await askOpsPilotAgent(cleanText, pseudoState);

    return NextResponse.json(reply, {
      headers: {
        'X-RateLimit-Remaining': String(remaining),
      },
    });
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Internal conversational processing failure';
    console.error('[API /api/agent/ask Error]:', errorMessage);
    return NextResponse.json(
      { error: 'Failed to process inquiry', message: errorMessage },
      { status: 500 }
    );
  }
}
