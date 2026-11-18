import { OperationalException, RiskLevel } from '@/types';

/**
 * Quantitative severity weights used to establish primary exception sorting tiers.
 * Higher values dictate immediate operational attention.
 */
const SEVERITY_WEIGHTS: Record<RiskLevel, number> = {
  CRITICAL: 1000,
  HIGH: 500,
  MEDIUM: 200,
  HEALTHY: 0,
};

/**
 * Operational category hierarchy for secondary tie-breaking.
 * Rationale: Inventory stockouts directly halt sales throughput,
 * followed by customer delivery SLAs, overdue receivables, and demand surges.
 */
const CATEGORY_PRIORITY: Record<string, number> = {
  INVENTORY: 4,
  ORDER: 3,
  RECEIVABLE: 2,
  SALES: 1,
};

/**
 * Deterministically prioritizes operational exceptions using a 3-tier ranking heuristic:
 * 1. Primary: Severity class weight (CRITICAL > HIGH > MEDIUM > HEALTHY)
 * 2. Secondary: Detection confidence coefficient (0.0 to 1.0)
 * 3. Tertiary: Operational category impact (INVENTORY > ORDER > RECEIVABLE > SALES)
 *
 * @param exceptions - Array of detected operational exceptions.
 * @returns Sorted copy of exceptions ordered from most urgent to least urgent.
 *
 * @complexity Time: O(N log N) where N is exception count | Space: O(N) shallow clone.
 */
export function prioritizeExceptions(exceptions: OperationalException[]): OperationalException[] {
  return [...exceptions].sort((a, b) => {
    // 1. Primary sort: Severity weight differential
    const weightDiff = (SEVERITY_WEIGHTS[b.severity] || 0) - (SEVERITY_WEIGHTS[a.severity] || 0);
    if (weightDiff !== 0) return weightDiff;

    // 2. Secondary sort: Statistical confidence level
    const confidenceDiff = b.confidenceLevel - a.confidenceLevel;
    if (confidenceDiff !== 0) return confidenceDiff;

    // 3. Tertiary sort: Domain impact category
    return (CATEGORY_PRIORITY[b.category] || 0) - (CATEGORY_PRIORITY[a.category] || 0);
  });
}
