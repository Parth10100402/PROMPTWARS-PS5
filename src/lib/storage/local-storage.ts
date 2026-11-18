import { BusinessState, InventoryItem, OrderItem, InvoiceItem, SaleRecord } from '@/types';
import { DEMO_INVENTORY, DEMO_SALES, DEMO_ORDERS, DEMO_INVOICES, DEMO_ANCHOR_DATE } from '../data/demo-data';

const STORAGE_KEY = 'OPSPILOT_STATE_V1';

export function getInitialBusinessState(): BusinessState {
  return {
    inventory: DEMO_INVENTORY,
    sales: DEMO_SALES,
    orders: DEMO_ORDERS,
    invoices: DEMO_INVOICES,
    exceptions: [],
    draftActions: [],
    auditLog: [
      {
        id: 'evt-init',
        timestamp: '2026-11-18T00:00:00.000Z',
        type: 'DATASET_RESET',
        actor: 'HUMAN',
        summary: 'Demo business "Northstar Retail & Distribution" dataset initialized.',
        severity: 'INFO',
      },
    ],
    healthScore: null,
    lastAnalysisTimestamp: null,
    isAiEnabled: false,
    aiMode: 'DETERMINISTIC_RULES',
  };
}

export function loadStoredBusinessState(): BusinessState {
  if (typeof window === 'undefined') {
    return getInitialBusinessState();
  }

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const initial = getInitialBusinessState();
      saveStoredBusinessState(initial);
      return initial;
    }
    const parsed = JSON.parse(raw);
    return {
      ...getInitialBusinessState(),
      ...parsed,
    };
  } catch (err) {
    console.error('Failed to parse localStorage state:', err);
    return getInitialBusinessState();
  }
}

export function saveStoredBusinessState(state: BusinessState): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (err) {
    console.error('Failed to save state to localStorage:', err);
  }
}

export function clearStoredBusinessState(): BusinessState {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(STORAGE_KEY);
  }
  const resetState = getInitialBusinessState();
  saveStoredBusinessState(resetState);
  return resetState;
}
