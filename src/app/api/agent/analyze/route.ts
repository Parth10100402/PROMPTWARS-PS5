import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { runOperationsAnalysis } from '@/lib/agent/engine';
import { BusinessState } from '@/types';

const AnalyzeRequestSchema = z.object({
  inventory: z.array(z.any()).default([]),
  sales: z.array(z.any()).default([]),
  orders: z.array(z.any()).default([]),
  invoices: z.array(z.any()).default([]),
  referenceDate: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validation = AnalyzeRequestSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid input payload', details: validation.error.format() },
        { status: 400 }
      );
    }

    const { inventory, sales, orders, invoices, referenceDate } = validation.data;

    const pseudoState: BusinessState = {
      inventory,
      sales,
      orders,
      invoices,
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

    return NextResponse.json(result);
  } catch (err: any) {
    console.error('Error executing operations analysis:', err);
    return NextResponse.json(
      { error: 'Failed to run operations analysis', message: err.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
