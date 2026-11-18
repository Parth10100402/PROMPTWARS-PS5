import { OperationalException, RiskLevel } from '@/types';

const SEVERITY_WEIGHTS: Record<RiskLevel, number> = {
  CRITICAL: 1000,
  HIGH: 500,
  MEDIUM: 200,
  HEALTHY: 0,
};

export function prioritizeExceptions(exceptions: OperationalException[]): OperationalException[] {
  return [...exceptions].sort((a, b) => {
    // 1. Sort by severity weight
    const weightA = SEVERITY_WEIGHTS[a.severity] || 0;
    const weightB = SEVERITY_WEIGHTS[b.severity] || 0;
    if (weightA !== weightB) {
      return weightB - weightA;
    }

    // 2. Tie break by confidence level
    if (b.confidenceLevel !== a.confidenceLevel) {
      return b.confidenceLevel - a.confidenceLevel;
    }

    // 3. Tie break by category order: INVENTORY > ORDER > RECEIVABLE > SALES
    const categoryOrder: Record<string, number> = {
      INVENTORY: 4,
      ORDER: 3,
      RECEIVABLE: 2,
      SALES: 1,
    };
    return (categoryOrder[b.category] || 0) - (categoryOrder[a.category] || 0);
  });
}
