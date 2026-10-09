import { 
  Transaction, 
  AuditConfig, 
  RuleFinding, 
  AuditDashboardMetrics, 
  AnomalyGroup, 
  ClauseChecklistItem 
} from '../types';
import { ALL_RULES } from '../data/rulesCatalogue';
import { FORM_3CD_CHECKLIST, CARO_2020_CHECKLIST } from '../data/checklistsData';

export interface AuditRunResult {
  config: AuditConfig;
  transactions: Transaction[];
  findings: RuleFinding[];
  anomalies: AnomalyGroup[];
  form3cdChecklist: ClauseChecklistItem[];
  caroChecklist: ClauseChecklistItem[];
  metrics: AuditDashboardMetrics;
}

export function executeAuditScreening(
  transactions: Transaction[], 
  config: AuditConfig,
  existingFindingsMap?: Map<string, { status: any; remarks: string; checkedEvidence: string[] }>
): AuditRunResult {
  const findings: RuleFinding[] = [];
  let totalDebitSum = 0;
  let totalCreditSum = 0;
  let highRiskCount = 0;
  let mediumRiskCount = 0;
  let lowRiskCount = 0;
  let totalTaxExposureAmount = 0;
  let potentialDisallowanceAmount = 0;
  let msmeDelayedAmount = 0;
  let cashViolationsAmount = 0;
  let unreconciledGstCount = 0;

  for (const tx of transactions) {
    totalDebitSum += tx.debit || 0;
    totalCreditSum += tx.credit || 0;
  }

  // 1. Evaluate each of the 42 statutory rules
  for (const rule of ALL_RULES) {
    const matchedTxList: Transaction[] = [];
    const notes: string[] = [];
    let ruleExposure = 0;

    for (const tx of transactions) {
      const result = rule.check(tx, transactions, config);
      if (result.matched) {
        matchedTxList.push(tx);
        if (result.note) notes.push(result.note);
        if (result.exposureAmount) {
          ruleExposure += result.exposureAmount;
        }
      }
    }

    if (matchedTxList.length > 0) {
      if (rule.risk === 'HIGH') highRiskCount++;
      else if (rule.risk === 'MEDIUM') mediumRiskCount++;
      else lowRiskCount++;

      totalTaxExposureAmount += ruleExposure;

      // Track specific statutory metric aggregates
      if (rule.id.includes('40A3') || rule.id.includes('269SS') || rule.id.includes('269T') || rule.id.includes('269ST')) {
        cashViolationsAmount += ruleExposure;
      }
      if (rule.id.includes('40AIA') || rule.id.includes('37') || rule.id.includes('40A7') || rule.id.includes('40A9') || rule.id.includes('40B') || rule.id.includes('40A3')) {
        potentialDisallowanceAmount += ruleExposure;
      }
      if (rule.id.includes('MSMED')) {
        msmeDelayedAmount += ruleExposure;
      }
      if (rule.category === 'GST') {
        unreconciledGstCount += matchedTxList.length;
      }

      const existing = existingFindingsMap?.get(rule.id);

      findings.push({
        ruleId: rule.id,
        rule,
        txCount: matchedTxList.length,
        totalExposure: ruleExposure,
        transactions: matchedTxList,
        findingsNotes: notes,
        status: existing?.status || 'OPEN',
        auditorRemarks: existing?.remarks || '',
        evidenceChecklist: rule.evidenceRequired.map(item => ({
          item,
          checked: existing?.checkedEvidence?.includes(item) || false
        }))
      });
    }
  }

  // 2. Anomaly Detection Engine
  const anomalies: AnomalyGroup[] = [];

  // Anomaly A: Split Cash Smurfing (multiple transactions on same date under ₹10,000)
  const cashDateMap = new Map<string, Transaction[]>();
  for (const tx of transactions) {
    if (tx.paymentMode === 'Cash' || tx.ledgerName.toLowerCase().includes('cash')) {
      const list = cashDateMap.get(tx.date) || [];
      list.push(tx);
      cashDateMap.set(tx.date, list);
    }
  }

  const smurfingTransactions: Transaction[] = [];
  for (const [_date, list] of cashDateMap.entries()) {
    const nearLimitTx = list.filter(t => t.debit >= 8000 && t.debit <= 10000);
    if (nearLimitTx.length > 1) {
      smurfingTransactions.push(...nearLimitTx);
    }
  }

  if (smurfingTransactions.length > 0) {
    const smurfSum = smurfingTransactions.reduce((acc, t) => acc + (t.debit || t.netAmount || 0), 0);
    anomalies.push({
      id: 'anom-split-cash',
      type: 'SPLIT_TRANSACTION',
      title: 'Split Cash Vouchers (Structuring / Smurfing Below ₹10,000)',
      description: 'Multiple cash disbursements made on the same day just below the statutory threshold of ₹10,000, indicating potential structuring to bypass Section 40A(3).',
      severity: 'HIGH',
      txCount: smurfingTransactions.length,
      totalAmount: smurfSum,
      transactions: smurfingTransactions,
      explanation: 'Structuring payments into amounts between ₹8,000 and ₹9,999 to same parties or related vendors on the same calendar day.',
      recommendedAction: 'Aggregate payments by recipient PAN and date. If paid to the same vendor, treat aggregate sum as disallowed under Section 40A(3).'
    });
  }

  // Anomaly B: Round Sum Entries in Journals
  const roundSumTx = transactions.filter(t => {
    const amt = t.debit || t.credit || 0;
    return amt >= 100000 && amt % 50000 === 0 && t.voucherType === 'Journal';
  });

  if (roundSumTx.length > 0) {
    const roundSum = roundSumTx.reduce((acc, t) => acc + (t.debit || t.credit || 0), 0);
    anomalies.push({
      id: 'anom-round-sum',
      type: 'ROUND_SUM',
      title: 'High-Value Exact Round Number Journal Entries',
      description: 'Journal vouchers booked in round intervals (₹50,000 / ₹1,00,000 multiples) without specific odd paisa or invoice breakdown.',
      severity: 'MEDIUM',
      txCount: roundSumTx.length,
      totalAmount: roundSum,
      transactions: roundSumTx,
      explanation: 'Under SA 240, round figure adjustments posted at period ends without underlying calculations are key indicators of unverified management estimates.',
      recommendedAction: 'Request working sheets and primary source invoices for all round-sum journals.'
    });
  }

  // Anomaly C: Weekend / Non-working Day Postings
  const weekendTx = transactions.filter(t => {
    if (!t.date) return false;
    const d = new Date(t.date);
    const day = d.getDay();
    return day === 0; // Sunday
  });

  if (weekendTx.length > 0) {
    const weekendSum = weekendTx.reduce((acc, t) => acc + (t.debit || t.credit || 0), 0);
    anomalies.push({
      id: 'anom-weekend',
      type: 'WEEKEND_ENTRY',
      title: 'Transactions Dated on Sundays / Non-Banking Days',
      description: 'Vouchers passed on Sundays when administrative offices and banking institutions were closed.',
      severity: 'LOW',
      txCount: weekendTx.length,
      totalAmount: weekendSum,
      transactions: weekendTx,
      explanation: 'Postings on non-business days require review to confirm whether transactions occurred in normal course of business.',
      recommendedAction: 'Verify physical register logs and gate passes for transactions recorded on Sundays.'
    });
  }

  // Anomaly D: High Velocity Cash Withdrawals / Deposits
  const highCashTx = transactions.filter(t => {
    const isCash = t.paymentMode === 'Cash' || t.ledgerName.toLowerCase().includes('cash');
    const amt = t.debit || t.credit || 0;
    return isCash && amt >= 50000;
  });

  if (highCashTx.length > 0) {
    const highCashSum = highCashTx.reduce((acc, t) => acc + (t.debit || t.credit || 0), 0);
    anomalies.push({
      id: 'anom-velocity-cash',
      type: 'HIGH_VELOCITY_CASH',
      title: 'High-Value Cash Movement (> ₹50,000 per Voucher)',
      description: 'Vouchers with large single-ticket cash movements that warrant enhanced anti-money laundering and Income-tax screening.',
      severity: 'HIGH',
      txCount: highCashTx.length,
      totalAmount: highCashSum,
      transactions: highCashTx,
      explanation: 'Cash transactions above ₹50,000 trigger mandatory PAN quotation under Rule 114B.',
      recommendedAction: 'Verify PAN of party and check compliance with Rule 114B and SFT (Statement of Financial Transactions) reporting thresholds.'
    });
  }

  // 3. Update Checklist status based on active findings
  const findingRuleIds = new Set(findings.map(f => f.ruleId));

  const updatedForm3cd = FORM_3CD_CHECKLIST.map(item => {
    const hasTriggeredRule = item.matchedRuleIds.some(id => findingRuleIds.has(id));
    let status = item.status;
    if (hasTriggeredRule) {
      status = 'Potential Risk Finding';
    } else if (item.automationLevel === 'Automated' && item.matchedRuleIds.length > 0) {
      status = 'Compliant / No Finding';
    }
    return {
      ...item,
      status
    };
  });

  const updatedCaro = CARO_2020_CHECKLIST.map(item => {
    const hasTriggeredRule = item.matchedRuleIds.some(id => findingRuleIds.has(id));
    let status = item.status;
    if (config.entityType !== 'company') {
      status = 'Not Applicable';
    } else if (hasTriggeredRule) {
      status = 'Potential Risk Finding';
    }
    return {
      ...item,
      status
    };
  });

  const metrics: AuditDashboardMetrics = {
    totalTransactions: transactions.length,
    totalDebitSum,
    totalCreditSum,
    totalFindingsCount: findings.length,
    highRiskCount,
    mediumRiskCount,
    lowRiskCount,
    totalTaxExposureAmount,
    potentialDisallowanceAmount,
    msmeDelayedAmount,
    cashViolationsAmount,
    unreconciledGstCount
  };

  return {
    config,
    transactions,
    findings,
    anomalies,
    form3cdChecklist: updatedForm3cd,
    caroChecklist: updatedCaro,
    metrics
  };
}

export function formatINR(val: number): string {
  if (isNaN(val)) return '₹0';
  return '₹' + val.toLocaleString('en-IN');
}
