import { NextResponse } from 'next/server';

export async function GET() {
  const hasGeminiKey = Boolean(process.env.GEMINI_API_KEY?.trim());
  const geminiModel = process.env.GEMINI_MODEL || 'gemini-2.5-flash';

  return NextResponse.json({
    status: 'healthy',
    system: 'OpsPilot AI Operations Control Tower',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    aiEngine: {
      provider: 'Google Gemini',
      model: geminiModel,
      isConfigured: hasGeminiKey,
      activeMode: hasGeminiKey ? 'GEMINI_ASSISTED' : 'DETERMINISTIC_RULES',
    },
    capabilities: [
      'Inventory Cover & Reorder Intelligence',
      'Delayed Order Fulfillment Tracking',
      'Overdue Receivables Aging Analysis',
      'Sales Volume Anomaly Detection',
      'Human-in-the-Loop Action Approval Queue',
      'Deterministic Rule Engine Fallback',
    ],
  });
}
