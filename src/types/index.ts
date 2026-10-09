export type FinancialYear = 'FY2023-24' | 'FY2024-25' | 'FY2025-26' | 'FY2026-27';

export type LawVersion = 'IT_ACT_1961' | 'IT_ACT_2025';

export type TaxForm = 'Form 3CA/3CD' | 'Form 3CB/3CD' | 'Form 26 (New Act)';

export type EntityType = 'company' | 'firm' | 'llp' | 'individual' | 'huf' | 'trust' | 'aop_boi';

export type AccountingBasis = 'mercantile' | 'cash';

export type RiskLevel = 'HIGH' | 'MEDIUM' | 'LOW';

export type FindingStatus = 'OPEN' | 'IN_REVIEW' | 'VERIFIED' | 'DISMISSED';

export type RuleCategory = 
  | 'Income-tax / Tax Audit'
  | 'TDS'
  | 'GST'
  | 'Companies Act'
  | 'CARO 2020'
  | 'Accounting / Anomaly'
  | 'Labour Law & Statutory';

export interface AuditConfig {
  entityName: string;
  cinOrPan: string;
  financialYear: FinancialYear;
  lawVersion: LawVersion;
  taxForm: TaxForm;
  entityType: EntityType;
  accountingBasis: AccountingBasis;
  turnover: number;
  netProfit: number;
  caFirmName: string;
  caMembershipNo: string;
  udin: string;
}

export interface Transaction {
  id: string;
  date: string; // YYYY-MM-DD
  voucherNo: string;
  voucherType: 'Payment' | 'Receipt' | 'Journal' | 'Contra' | 'Sales' | 'Purchase';
  ledgerName: string;
  parentGroup: string;
  particulars: string;
  debit: number;
  credit: number;
  netAmount?: number;
  paymentMode: 'Cash' | 'Bank' | 'Journal' | 'Contra';
  partyPan?: string;
  gstin?: string;
  ewayBill?: string;
  tdsSection?: string;
  invoiceRef?: string;
  msmeType?: 'Micro' | 'Small' | 'Medium' | 'Non-MSME';
  msmePaymentDays?: number;
  partyType?: 'Director' | 'Relative' | 'Related Entity' | 'Third Party' | 'Government' | 'Employee';
  bankAccountRef?: string;
  flags?: string[];
}

export interface RuleEvaluationResult {
  matched: boolean;
  note?: string;
  exposureAmount?: number;
}

export interface AuditRule {
  id: string;
  category: RuleCategory;
  title: string;
  description: string;
  risk: RiskLevel;
  legalReference: string;
  source: string;
  applicability: string;
  evidenceRequired: string[];
  recommendation: string;
  form3cdClause?: string;
  caroClause?: string;
  lawVersionApplicability?: string;
  check: (tx: Transaction, allTx: Transaction[], config: AuditConfig) => RuleEvaluationResult;
}

export interface RuleFinding {
  ruleId: string;
  rule: AuditRule;
  txCount: number;
  totalExposure: number;
  transactions: Transaction[];
  findingsNotes: string[];
  status: FindingStatus;
  auditorRemarks: string;
  evidenceChecklist: {
    item: string;
    checked: boolean;
  }[];
}

export interface AnomalyGroup {
  id: string;
  type: 'SPLIT_TRANSACTION' | 'ROUND_SUM' | 'WEEKEND_ENTRY' | 'HIGH_VELOCITY_CASH' | 'NEGATIVE_CASH' | 'DORMANT_SPIKE';
  title: string;
  description: string;
  severity: RiskLevel;
  txCount: number;
  totalAmount: number;
  transactions: Transaction[];
  explanation: string;
  recommendedAction: string;
}

export interface ClauseChecklistItem {
  clauseNumber: string;
  title: string;
  type: 'Form3CD' | 'CARO2020';
  category: string;
  automationLevel: 'Automated' | 'Semi-automated (Reconciliation)' | 'Auditor Manual Inquiry';
  governingLaw: string;
  status: 'Compliant / No Finding' | 'Potential Risk Finding' | 'Pending Evidence' | 'Not Applicable';
  matchedRuleIds: string[];
  notes: string;
  statutoryGuidance: string;
}

export interface AuditDashboardMetrics {
  totalTransactions: number;
  totalDebitSum: number;
  totalCreditSum: number;
  totalFindingsCount: number;
  highRiskCount: number;
  mediumRiskCount: number;
  lowRiskCount: number;
  totalTaxExposureAmount: number;
  potentialDisallowanceAmount: number;
  msmeDelayedAmount: number;
  cashViolationsAmount: number;
  unreconciledGstCount: number;
}
