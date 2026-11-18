import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { askOpsPilotAgent } from '@/lib/agent/llm';
import { BusinessState } from '@/types';

const AskRequestSchema = z.object({
  question: z.string().min(1, 'Question cannot be empty').max(500, 'Question too long').trim(),
  state: z.object({
    inventory: z.array(z.any()).default([]),
    orders: z.array(z.any()).default([]),
    invoices: z.array(z.any()).default([]),
    sales: z.array(z.any()).default([]),
    exceptions: z.array(z.any()).default([]),
    healthScore: z.any().nullable().optional(),
  }),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validation = AskRequestSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid question format', details: validation.error.format() },
        { status: 400 }
      );
    }

    const { question, state } = validation.data;

    const pseudoState: BusinessState = {
      inventory: state.inventory,
      orders: state.orders,
      invoices: state.invoices,
      sales: state.sales,
      exceptions: state.exceptions,
      draftActions: [],
      auditLog: [],
      healthScore: state.healthScore,
      lastAnalysisTimestamp: null,
      isAiEnabled: Boolean(process.env.GEMINI_API_KEY),
      aiMode: process.env.GEMINI_API_KEY ? 'GEMINI_ASSISTED' : 'DETERMINISTIC_RULES',
    };

    const reply = await askOpsPilotAgent(question, pseudoState);
    return NextResponse.json(reply);
  } catch (err: any) {
    console.error('Error handling conversational QA:', err);
    return NextResponse.json(
      { error: 'Failed to process inquiry', message: err.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
