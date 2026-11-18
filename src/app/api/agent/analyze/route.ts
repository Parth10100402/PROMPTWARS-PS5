import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { runOperationsAnalysis } from '@/lib/agent/engine';
import { checkRateLimit } from '@/lib/security/sanitizer';
import { BusinessState } from '@/types';

const AnalyzePayloadSchema = z.object({
  inventory: z.array(z.record(z.string(), z.unknown())).default([]),
  sales: z.array(z.record(z.string(), z.unknown())).default([]),
  orders: z.array(z.record(z.string(), z.unknown())).default([]),
  invoices: z.array(z.record(z.string(), z.unknown())).default([]),
  referenceDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Reference date must be YYYY-MM-DD').optional(),
});

export async function POST(req: NextRequest) {
  // 1. Rate limiting by IP
  const clientIp = req.headers.get('x-forwarded-for')?.split(',')[0] || '127.0.0.1';
  const { allowed, remaining } = checkRateLimit(clientIp, 60, 60000);

  if (!allowed) {
    return NextResponse.json(
      { error: 'Too many requests. Rate limit exceeded (60 req/min).' },
      { status: 429, headers: { 'Retry-After': '60' } }
    );
  }

  try {
    const rawBody = await req.json();
    const validation = AnalyzePayloadSchema.safeParse(rawBody);

    if (!validation.success) {
      return NextResponse.json(
        {
          error: 'Invalid request payload schema',
          details: validation.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`),
        },
        { status: 400 }
      );
    }

    const { inventory, sales, orders, invoices, referenceDate } = validation.data;

    const pseudoState: BusinessState = {
      inventory: inventory as any,
      sales: sales as any,
      orders: orders as any,
      invoices: invoices as any,
      exceptions: [],
      draftActions: [],
      auditLog: [],
      healthScore: null,
      lastAnalysisTimestamp: null,
      isAiEnabled: Boolean(process.env.GEMINI_API_KEY),
      aiMode: process.env.GEMINI_API_KEY ? 'GEMINI_ASSISTED' : 'DETERMINISTIC_RULES',
    };

    const result = await runOperationsAnalysis(pseudoState, {
      referenceDate: referenceDate || '2026-11-18',
    });

    return NextResponse.json(result, {
      headers: {
        'X-RateLimit-Remaining': String(remaining),
      },
    });
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Internal operations engine failure';
    console.error('[API /api/agent/analyze Error]:', errorMessage);
    return NextResponse.json(
      { error: 'Failed to execute operations analysis', message: errorMessage },
      { status: 500 }
    );
  }
}
