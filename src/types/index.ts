export type RiskLevel = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'HEALTHY';
export type ActionPriority = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
export type ApprovalStatus = 'PENDING' | 'APPROVED' | 'REJECTED';
export type ActionType = 'PURCHASE_ORDER' | 'CUSTOMER_MESSAGE' | 'PAYMENT_REMINDER' | 'OPERATIONAL_TASK';
export type ExceptionCategory = 'INVENTORY' | 'ORDER' | 'RECEIVABLE' | 'SALES';

export interface InventoryItem {
  sku: string;
  productName: string;
  category: string;
  stockOnHand: number;
  avgDailySales: number;
  leadTimeDays: number;
  safetyStockDays: number;
  targetCoverDays: number;
  incomingStock: number;
  unitCost: number;
  supplierName: string;
  // Computed fields
  daysOfCover?: number;
  reorderQuantity?: number;
  riskLevel?: RiskLevel;
}

export interface SaleRecord {
  date: string; // YYYY-MM-DD
  sku: string;
  units: number;
  revenue: number;
}

export interface OrderItem {
  orderId: string;
  customerName: string;
  orderDate: string; // YYYY-MM-DD
  promisedDate: string; // YYYY-MM-DD
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  amount: number;
  // Computed fields
  isDelayed?: boolean;
  delayDays?: number;
}

export interface InvoiceItem {
  invoiceId: string;
  customerName: string;
  issueDate: string; // YYYY-MM-DD
  dueDate: string; // YYYY-MM-DD
  amount: number;
  status: 'paid' | 'unpaid' | 'overdue' | 'disputed';
  // Computed fields
  isOverdue?: boolean;
  overdueDays?: number;
}

export interface OperationalException {
  id: string;
  category: ExceptionCategory;
  severity: RiskLevel;
  title: string;
  description: string;
  dataEvidence: string;
  businessImpact: string;
  recommendedAction: string;
  confidenceLevel: number; // 0 to 1
  detectedAt: string;
  relatedRecordId: string;
  status: 'PENDING_REVIEW' | 'ACTIONED' | 'DISMISSED';
}

export interface DraftAction {
  id: string;
  type: ActionType;
  title: string;
  relatedRecordId: string;
  priority: ActionPriority;
  reason: string;
  expectedOutcome: string;
  payload: {
    supplierName?: string;
    items?: Array<{ sku: string; name: string; quantity: number; unitCost: number; totalCost: number }>;
    totalAmount?: number;
    recipientName?: string;
    subject?: string;
    messageBody?: string;
    dueDate?: string;
    invoiceId?: string;
    notes?: string;
  };
  approvalStatus: ApprovalStatus;
  approvedAt?: string;
  rejectedAt?: string;
  rejectionReason?: string;
  createdAt: string;
}

export interface AuditEvent {
  id: string;
  timestamp: string;
  type:
    | 'ANALYSIS_STARTED'
    | 'EXCEPTION_DETECTED'
    | 'RECOMMENDATION_GENERATED'
    | 'ACTION_DRAFTED'
    | 'APPROVAL_REQUESTED'
    | 'ACTION_APPROVED'
    | 'ACTION_REJECTED'
    | 'DATASET_IMPORTED'
    | 'DATASET_RESET';
  actor: 'AGENT' | 'HUMAN';
  actionId?: string;
  summary: string;
  details?: Record<string, any>;
  severity?: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'INFO';
}

export interface BusinessHealthScore {
  overallScore: number; // 0 to 100
  inventoryScore: number;
  fulfillmentScore: number;
  receivablesScore: number;
  healthTier: 'EXCELLENT' | 'GOOD' | 'NEEDS_ATTENTION' | 'CRITICAL';
  summary: string;
}

export interface BusinessState {
  inventory: InventoryItem[];
  sales: SaleRecord[];
  orders: OrderItem[];
  invoices: InvoiceItem[];
  exceptions: OperationalException[];
  draftActions: DraftAction[];
  auditLog: AuditEvent[];
  healthScore: BusinessHealthScore | null;
  lastAnalysisTimestamp: string | null;
  isAiEnabled: boolean;
  aiMode: 'GEMINI_ASSISTED' | 'DETERMINISTIC_RULES';
}

export interface AnalysisResult {
  timestamp: string;
  healthScore: BusinessHealthScore;
  exceptions: OperationalException[];
  draftActions: DraftAction[];
  auditEvents: AuditEvent[];
  aiExplanations?: Record<string, string>;
  mode: 'GEMINI_ASSISTED' | 'DETERMINISTIC_RULES';
}
