import { AuditRule, Transaction, AuditConfig, RuleEvaluationResult } from '../types';

export const ALL_RULES: AuditRule[] = [
  // 1. IT_CASH_EXPENSE_40A3
  {
    id: 'IT_CASH_EXPENSE_40A3',
    category: 'Income-tax / Tax Audit',
    title: 'Cash Business Expenditure > ₹10,000 (Section 40A(3))',
    description: 'Any expenditure in respect of which payment or aggregate of payments made to a person in a single day exceeds ₹10,000 (or ₹35,000 for plying/hiring/leasing goods carriages) in cash is 100% disallowed.',
    risk: 'HIGH',
    legalReference: 'Section 40A(3) read with Rule 6DD of the Income-tax Act, 1961',
    source: 'Payment Voucher / Cash Ledger',
    applicability: 'All Assessees with business or profession',
    form3cdClause: '21(d)',
    caroClause: 'N/A',
    evidenceRequired: [
      'Cash payment vouchers and supporting supplier bills',
      'Bank statement verifying no account payee cheque / draft / ECS used',
      'Applicability check of Rule 6DD exceptions (banking holiday, agricultural produce, remote area)',
      'Management representation on business exigency'
    ],
    recommendation: 'Verify if payment falls under Rule 6DD exceptions. If unexempted, report disallowance under Clause 21(d) of Form 3CD.',
    check: (tx: Transaction, _allTx: Transaction[], _config: AuditConfig): RuleEvaluationResult => {
      const isCash = tx.paymentMode === 'Cash' || tx.ledgerName.toLowerCase().includes('cash') || tx.parentGroup.toLowerCase().includes('cash');
      const isExpOrPurchase = tx.parentGroup.toLowerCase().includes('expense') || 
                              tx.parentGroup.toLowerCase().includes('purchase') || 
                              tx.voucherType === 'Payment' ||
                              tx.voucherType === 'Purchase';
      const amount = tx.debit > 0 ? tx.debit : (tx.netAmount ?? 0);
      const isTransport = tx.particulars.toLowerCase().includes('freight') || 
                          tx.particulars.toLowerCase().includes('transport') ||
                          tx.ledgerName.toLowerCase().includes('transport') ||
                          tx.ledgerName.toLowerCase().includes('freight');
      const threshold = isTransport ? 35000 : 10000;
      
      if (isCash && isExpOrPurchase && amount > threshold) {
        return {
          matched: true,
          note: `Cash payment of ₹${amount.toLocaleString('en-IN')} exceeds statutory threshold of ₹${threshold.toLocaleString('en-IN')}`,
          exposureAmount: amount
        };
      }
      return { matched: false };
    }
  },

  // 2. IT_CASH_LOAN_269SS
  {
    id: 'IT_CASH_LOAN_269SS',
    category: 'Income-tax / Tax Audit',
    title: 'Cash Acceptance of Loan / Deposit / Specified Sum ≥ ₹20,000 (Section 269SS)',
    description: 'No person shall accept any loan, deposit, or specified advance of ₹20,000 or more otherwise than by account payee cheque/bank draft or online transfer. Penalty equal to 100% of amount u/s 271D.',
    risk: 'HIGH',
    legalReference: 'Section 269SS read with Section 271D of the Income-tax Act',
    source: 'Receipt Voucher / Unsecured Loans Ledger / Advance Ledger',
    applicability: 'All persons',
    form3cdClause: '31(a)',
    caroClause: '3(v)',
    evidenceRequired: [
      'Confirmation of accounts from the lender/depositor',
      'Lender PAN and bank statement proving mode of receipt',
      'Reason for receiving in cash (genuine emergency/agriculture exceptions)',
      'Board resolution for acceptance of loan/deposit'
    ],
    recommendation: 'Report particulars in Clause 31(a) of Form 3CD. Alert management regarding strict penalty liability under Section 271D.',
    check: (tx: Transaction): RuleEvaluationResult => {
      const isCash = tx.paymentMode === 'Cash' || tx.ledgerName.toLowerCase().includes('cash');
      const isLoanOrAdvance = tx.parentGroup.toLowerCase().includes('loan') || 
                              tx.parentGroup.toLowerCase().includes('deposit') || 
                              tx.particulars.toLowerCase().includes('loan') ||
                              tx.ledgerName.toLowerCase().includes('loan');
      const amount = tx.credit > 0 ? tx.credit : (tx.netAmount ?? 0);
      if (isCash && isLoanOrAdvance && amount >= 20000) {
        return {
          matched: true,
          note: `Cash loan/deposit receipt of ₹${amount.toLocaleString('en-IN')} is >= ₹20,000`,
          exposureAmount: amount
        };
      }
      return { matched: false };
    }
  },

  // 3. IT_CASH_LOAN_REPAYMENT_269T
  {
    id: 'IT_CASH_LOAN_REPAYMENT_269T',
    category: 'Income-tax / Tax Audit',
    title: 'Cash Repayment of Loan / Deposit ≥ ₹20,000 (Section 269T)',
    description: 'Repayment of loan or deposit including interest of ₹20,000 or more in cash violates Section 269T, attracting equivalent penalty under Section 271E.',
    risk: 'HIGH',
    legalReference: 'Section 269T read with Section 271E of the Income-tax Act',
    source: 'Payment Voucher / Unsecured Loans Repayment',
    applicability: 'All persons',
    form3cdClause: '31(b)',
    caroClause: '3(ix)',
    evidenceRequired: [
      'Loan repayment voucher and ledger account of depositor',
      'Evidence whether payment was through banking channel',
      'Acknowledgment of recipient and PAN',
      'Justification for cash repayment'
    ],
    recommendation: 'Detail under Clause 31(b) of Form 3CD. Highlight penalty implications under Section 271E.',
    check: (tx: Transaction): RuleEvaluationResult => {
      const isCash = tx.paymentMode === 'Cash' || tx.ledgerName.toLowerCase().includes('cash');
      const isLoanRepay = (tx.voucherType === 'Payment') && 
                          (tx.parentGroup.toLowerCase().includes('loan') || 
                           tx.ledgerName.toLowerCase().includes('loan') ||
                           tx.particulars.toLowerCase().includes('loan repayment') ||
                           tx.particulars.toLowerCase().includes('deposit refund'));
      const amount = tx.debit > 0 ? tx.debit : (tx.netAmount ?? 0);
      if (isCash && isLoanRepay && amount >= 20000) {
        return {
          matched: true,
          note: `Cash repayment of loan/deposit of ₹${amount.toLocaleString('en-IN')} violates Section 269T`,
          exposureAmount: amount
        };
      }
      return { matched: false };
    }
  },

  // 4. IT_CASH_RECEIPT_269ST
  {
    id: 'IT_CASH_RECEIPT_269ST',
    category: 'Income-tax / Tax Audit',
    title: 'Cash Receipt Exceeding ₹2 Lakh (Section 269ST)',
    description: 'No person shall receive an amount of ₹2,00,000 or more in aggregate from a person in a day, in respect of a single transaction, or in respect of transactions relating to one event/occasion in cash. Penalty u/s 271DA is 100%.',
    risk: 'HIGH',
    legalReference: 'Section 269ST read with Section 271DA of the Income-tax Act',
    source: 'Receipt Voucher / Counter Cash Sales',
    applicability: 'All persons',
    form3cdClause: '31(ba)',
    caroClause: 'N/A',
    evidenceRequired: [
      'Cash receipt voucher and sales invoice copy',
      'Customer identity and PAN card copy',
      'Daybook extract verifying aggregate cash received from customer on the date',
      'Check if exempt entity (Govt, banking company, post office savings)'
    ],
    recommendation: 'Report in Clause 31(ba) of Form 3CD. Immediate notice to management regarding Section 271DA penalty.',
    check: (tx: Transaction): RuleEvaluationResult => {
      const isCash = tx.paymentMode === 'Cash' || tx.ledgerName.toLowerCase().includes('cash');
      const isReceipt = tx.voucherType === 'Receipt' || tx.voucherType === 'Sales';
      const amount = tx.credit > 0 ? tx.credit : (tx.netAmount ?? 0);
      if (isCash && isReceipt && amount >= 200000) {
        return {
          matched: true,
          note: `Cash receipt of ₹${amount.toLocaleString('en-IN')} exceeds statutory limit of ₹2,00,000`,
          exposureAmount: amount
        };
      }
      return { matched: false };
    }
  },

  // 5. IT_TDS_MISSING_SECTION
  {
    id: 'IT_TDS_MISSING_SECTION',
    category: 'TDS',
    title: 'TDS Candidate Transaction Without TDS Section Tag',
    description: 'Expense booked under professional, contract, commission or rent heads without a corresponding TDS deduction entry or Section tagging.',
    risk: 'HIGH',
    legalReference: 'Chapter XVII-B of the Income-tax Act, 1961',
    source: 'Expense Ledger / Purchase Journal',
    applicability: 'Entities subject to TDS provisions',
    form3cdClause: '34(a)',
    caroClause: '3(vii)',
    evidenceRequired: [
      'Vendor invoice and contract agreement',
      'Vendor PAN and lower/nil deduction certificate u/s 197',
      'Proof of TDS deduction and challan payment or Form 26A CA certificate',
      'Ledger scrutiny of corresponding TDS payable accounts'
    ],
    recommendation: 'Obtain Form 26A or verify if vendor filed return u/s 139 to avert disallowance u/s 40(a)(ia). Report under Clause 34(a).',
    check: (tx: Transaction): RuleEvaluationResult => {
      const isTdsCandidateExp = 
        tx.particulars.toLowerCase().includes('professional') || 
        tx.particulars.toLowerCase().includes('contract') || 
        tx.particulars.toLowerCase().includes('brokerage') || 
        tx.particulars.toLowerCase().includes('legal fee') ||
        tx.particulars.toLowerCase().includes('consulting') ||
        tx.ledgerName.toLowerCase().includes('professional') ||
        tx.ledgerName.toLowerCase().includes('legal') ||
        tx.ledgerName.toLowerCase().includes('consultancy');
      const amount = tx.debit > 0 ? tx.debit : (tx.netAmount ?? 0);
      if (isTdsCandidateExp && (!tx.tdsSection || tx.tdsSection === 'NONE') && amount >= 30000) {
        return {
          matched: true,
          note: `Expense of ₹${amount.toLocaleString('en-IN')} booked under professional/legal head without recorded TDS section`,
          exposureAmount: amount
        };
      }
      return { matched: false };
    }
  },

  // 6. IT_TDS_40AIA_CANDIDATE
  {
    id: 'IT_TDS_40AIA_CANDIDATE',
    category: 'Income-tax / Tax Audit',
    title: 'Potential 30% Disallowance for Resident Payment Without TDS (Section 40(a)(ia))',
    description: '30% of any sum payable to a resident on which tax is deductible at source under Chapter XVII-B and such tax has not been deducted or after deduction has not been paid on or before due date of return.',
    risk: 'HIGH',
    legalReference: 'Section 40(a)(ia) of the Income-tax Act',
    source: 'Expense Ledger / Journal Vouchers',
    applicability: 'All Assessees with business or profession',
    form3cdClause: '21(b)',
    caroClause: 'N/A',
    evidenceRequired: [
      'Quarterly TDS returns (Form 26Q) and traces challan acknowledgments',
      'Challan payment date vs ITR filing due date u/s 139(1)',
      'Form 26A from payee accountant if payee has already declared income',
      'Reconciliation of Chapter XVII-B ledgers with P&L expenses'
    ],
    recommendation: 'Compute 30% disallowance amount and report under Clause 21(b) of Form 3CD.',
    check: (tx: Transaction): RuleEvaluationResult => {
      const amount = tx.debit > 0 ? tx.debit : (tx.netAmount ?? 0);
      const isCandidate = (tx.particulars.toLowerCase().includes('no tds') || 
                           tx.particulars.toLowerCase().includes('tds not deducted') ||
                           (!tx.tdsSection && tx.ledgerName.toLowerCase().includes('consultancy'))) && amount >= 30000;
      if (isCandidate) {
        const disallowance = Math.round(amount * 0.30);
        return {
          matched: true,
          note: `30% disallowance exposure: ₹${disallowance.toLocaleString('en-IN')} on total expense of ₹${amount.toLocaleString('en-IN')}`,
          exposureAmount: disallowance
        };
      }
      return { matched: false };
    }
  },

  // 7. IT_TDS_194C_CANDIDATE
  {
    id: 'IT_TDS_194C_CANDIDATE',
    category: 'TDS',
    title: 'Contractor / Sub-contractor Payment Requiring 194C Review',
    description: 'Payment to resident contractor for carrying out work exceeding ₹30,000 for a single contract or ₹1,00,000 in aggregate requires TDS at 1% (individual/HUF) or 2% (others).',
    risk: 'MEDIUM',
    legalReference: 'Section 194C of the Income-tax Act',
    source: 'Contractor Ledger / Job Work / Freight',
    applicability: 'Entities with turnover > ₹1 Cr (business) or ₹50 Lakhs (profession)',
    form3cdClause: '34(a)',
    caroClause: 'N/A',
    evidenceRequired: [
      'Work contract / work order copy',
      'Valid PAN card copy of contractor (20% if no PAN u/s 206AA)',
      'Form 197 lower rate certificate if applied',
      'Transporter declaration and vehicle numbers (if exempt u/s 194C(6))'
    ],
    recommendation: 'Check PAN status and ensure 1% or 2% TDS deducted. If transporter, inspect vehicle registration declaration.',
    check: (tx: Transaction): RuleEvaluationResult => {
      const isContract = tx.parentGroup.toLowerCase().includes('contract') || 
                         tx.particulars.toLowerCase().includes('contract') || 
                         tx.particulars.toLowerCase().includes('job work') ||
                         tx.particulars.toLowerCase().includes('advertising') ||
                         tx.ledgerName.toLowerCase().includes('contractor') ||
                         tx.ledgerName.toLowerCase().includes('advertising');
      const amount = tx.debit > 0 ? tx.debit : (tx.netAmount ?? 0);
      if (isContract && amount >= 30000 && tx.tdsSection !== '194C') {
        return {
          matched: true,
          note: `Contract payment of ₹${amount.toLocaleString('en-IN')} exceeds single bill threshold of ₹30,000 without 194C tagging`,
          exposureAmount: amount
        };
      }
      return { matched: false };
    }
  },

  // 8. IT_TDS_194H_CANDIDATE
  {
    id: 'IT_TDS_194H_CANDIDATE',
    category: 'TDS',
    title: 'Commission / Brokerage Payment Requiring 194H Review',
    description: 'Commission or brokerage paid to resident exceeding ₹15,000 during financial year requires TDS deduction at 5% (or 2% as amended).',
    risk: 'MEDIUM',
    legalReference: 'Section 194H of the Income-tax Act',
    source: 'Commission / Brokerage Expense Ledger',
    applicability: 'All corporate / tax audit assessees',
    form3cdClause: '34(a)',
    caroClause: 'N/A',
    evidenceRequired: [
      'Commission agreement / broker agency terms',
      'Payee PAN and Form 26Q statement',
      'Calculation sheet showing aggregate payments during the FY',
      'GST invoice of broker if registered'
    ],
    recommendation: 'Screen against aggregate ₹15,000 threshold. Report un-deducted amounts under Clause 34(a).',
    check: (tx: Transaction): RuleEvaluationResult => {
      const isComm = tx.particulars.toLowerCase().includes('commission') || 
                     tx.particulars.toLowerCase().includes('brokerage') ||
                     tx.ledgerName.toLowerCase().includes('commission') ||
                     tx.ledgerName.toLowerCase().includes('brokerage');
      const amount = tx.debit > 0 ? tx.debit : (tx.netAmount ?? 0);
      if (isComm && amount >= 15000 && tx.tdsSection !== '194H') {
        return {
          matched: true,
          note: `Commission/brokerage of ₹${amount.toLocaleString('en-IN')} exceeds threshold of ₹15,000 without 194H deduction`,
          exposureAmount: amount
        };
      }
      return { matched: false };
    }
  },

  // 9. IT_TDS_194I_CANDIDATE
  {
    id: 'IT_TDS_194I_CANDIDATE',
    category: 'TDS',
    title: 'Rent Payment Requiring 194I Review (> ₹2,40,000/yr)',
    description: 'Rent paid for land, building or furniture exceeding ₹2,40,000 in aggregate during FY requires TDS @ 10% (2% for plant & machinery).',
    risk: 'HIGH',
    legalReference: 'Section 194I of the Income-tax Act',
    source: 'Rent Expense Account',
    applicability: 'All corporate / tax audit assessees',
    form3cdClause: '34(a)',
    caroClause: 'N/A',
    evidenceRequired: [
      'Rent agreement and premises ownership title of landlord',
      'PAN of landlord and Form 16A TDS certificate',
      'Co-owners proportion agreement if rent is shared',
      'Monthly rent schedule vs TDS challans'
    ],
    recommendation: 'Reconcile total rent with TDS deductions. Report short deduction in Form 3CD Clause 34.',
    check: (tx: Transaction): RuleEvaluationResult => {
      const isRent = tx.particulars.toLowerCase().includes('rent') || 
                     tx.ledgerName.toLowerCase().includes('rent');
      const amount = tx.debit > 0 ? tx.debit : (tx.netAmount ?? 0);
      if (isRent && amount >= 25000 && tx.tdsSection !== '194I') {
        return {
          matched: true,
          note: `Rent booking of ₹${amount.toLocaleString('en-IN')} flagged for annual ₹2,40,000 threshold screening`,
          exposureAmount: amount
        };
      }
      return { matched: false };
    }
  },

  // 10. IT_TDS_194J_CANDIDATE
  {
    id: 'IT_TDS_194J_CANDIDATE',
    category: 'TDS',
    title: 'Professional / Technical Fees Requiring 194J Review (> ₹30,000)',
    description: 'Fees for professional services (10%), technical services (2%), royalty, or director remuneration require TDS when payment exceeds ₹30,000.',
    risk: 'HIGH',
    legalReference: 'Section 194J of the Income-tax Act',
    source: 'Professional & Legal Charges Ledger',
    applicability: 'All corporate / tax audit assessees',
    form3cdClause: '34(a)',
    caroClause: 'N/A',
    evidenceRequired: [
      'Engagement letter / invoice describing scope of professional services',
      'Distinction between professional (10%) and technical / FTS (2%)',
      'Challan receipts and Form 26Q matching',
      'Payee PAN'
    ],
    recommendation: 'Check correct rate application (10% vs 2%). Flag missing deductions for 30% disallowance u/s 40(a)(ia).',
    check: (tx: Transaction): RuleEvaluationResult => {
      const isProf = tx.particulars.toLowerCase().includes('professional') || 
                     tx.particulars.toLowerCase().includes('consult') ||
                     tx.particulars.toLowerCase().includes('legal') ||
                     tx.ledgerName.toLowerCase().includes('professional') ||
                     tx.ledgerName.toLowerCase().includes('legal') ||
                     tx.ledgerName.toLowerCase().includes('consultant');
      const amount = tx.debit > 0 ? tx.debit : (tx.netAmount ?? 0);
      if (isProf && amount >= 30000 && tx.tdsSection !== '194J') {
        return {
          matched: true,
          note: `Professional/technical fee of ₹${amount.toLocaleString('en-IN')} exceeds ₹30,000 without 194J deduction`,
          exposureAmount: amount
        };
      }
      return { matched: false };
    }
  },

  // 11. IT_TDS_194Q_CANDIDATE
  {
    id: 'IT_TDS_194Q_CANDIDATE',
    category: 'TDS',
    title: 'Purchase of Goods from Resident Seller Requiring 194Q Review (> ₹50 Lakhs)',
    description: 'Buyer with previous year turnover > ₹10 Crores is required to deduct TDS @ 0.1% on purchase of goods from a resident seller exceeding ₹50 Lakhs in aggregate.',
    risk: 'HIGH',
    legalReference: 'Section 194Q read with Section 206C(1H) of the Income-tax Act',
    source: 'Purchase Register / Sundry Creditors',
    applicability: 'Buyers having turnover > ₹10 Crore in preceding FY',
    form3cdClause: '34(a)',
    caroClause: 'N/A',
    evidenceRequired: [
      'Seller aggregate purchases statement for the financial year',
      'Buyer turnover confirmation for preceding financial year (> ₹10 Cr)',
      'Cross-check whether seller has collected TCS u/s 206C(1H)',
      'PAN verification of seller (5% rate if PAN not furnished u/s 206AA)'
    ],
    recommendation: 'Verify if aggregate purchase from vendor exceeds ₹50 Lakhs. Disallowance of 30% u/s 40(a)(ia) applies for non-deduction.',
    check: (tx: Transaction, _allTx: Transaction[], config: AuditConfig): RuleEvaluationResult => {
      const isPurchase = tx.voucherType === 'Purchase' || tx.parentGroup.toLowerCase().includes('purchase');
      const amount = tx.debit > 0 ? tx.debit : (tx.netAmount ?? 0);
      // High value purchase invoice or buyer large turnover
      if (isPurchase && (amount >= 1000000 || tx.particulars.toLowerCase().includes('194q') || tx.particulars.toLowerCase().includes('bulk raw material')) && config.turnover >= 100000000) {
        if (!tx.tdsSection || tx.tdsSection !== '194Q') {
          return {
            matched: true,
            note: `High-value purchase transaction of ₹${amount.toLocaleString('en-IN')} by entity with turnover > ₹10 Cr requires 194Q compliance review`,
            exposureAmount: amount
          };
        }
      }
      return { matched: false };
    }
  },

  // 12. IT_TDS_194R_CANDIDATE
  {
    id: 'IT_TDS_194R_CANDIDATE',
    category: 'TDS',
    title: 'Benefit or Perquisite in Business Requiring 194R Review (> ₹20,000)',
    description: 'Any person providing to a resident any benefit or perquisite arising from business or profession exceeding ₹20,000 in aggregate must deduct TDS @ 10%.',
    risk: 'MEDIUM',
    legalReference: 'Section 194R of the Income-tax Act',
    source: 'Business Promotion / Incentive / Gift Vouchers',
    applicability: 'All businesses / professions above audit turnover',
    form3cdClause: '34(a)',
    caroClause: 'N/A',
    evidenceRequired: [
      'Incentive scheme / dealer conference / foreign trip / gift documentation',
      'Value assessment of perquisite or benefit in kind',
      'Challan proving 10% tax paid before releasing benefit if in kind',
      'Recipient PAN and Form 26Q reporting'
    ],
    recommendation: 'Audit sales promotion, gifts, and dealer awards ledgers. Report un-deducted perquisites in Form 3CD.',
    check: (tx: Transaction): RuleEvaluationResult => {
      const isBenefit = tx.particulars.toLowerCase().includes('gift') || 
                        tx.particulars.toLowerCase().includes('incentive') ||
                        tx.particulars.toLowerCase().includes('dealer promotion') ||
                        tx.particulars.toLowerCase().includes('reward') ||
                        tx.ledgerName.toLowerCase().includes('business promotion') ||
                        tx.ledgerName.toLowerCase().includes('gift');
      const amount = tx.debit > 0 ? tx.debit : (tx.netAmount ?? 0);
      if (isBenefit && amount >= 20000 && tx.tdsSection !== '194R') {
        return {
          matched: true,
          note: `Business promotion / perquisite of ₹${amount.toLocaleString('en-IN')} exceeds ₹20,000 without 194R deduction`,
          exposureAmount: amount
        };
      }
      return { matched: false };
    }
  },

  // 13. IT_TDS_195_CANDIDATE
  {
    id: 'IT_TDS_195_CANDIDATE',
    category: 'Income-tax / Tax Audit',
    title: 'Payment to Non-Resident Requiring Section 195 & 15CA/CB Review',
    description: 'Any sum payable to a non-resident or foreign company chargeable to tax requires withholding under Section 195 and electronic filing of Form 15CA and CA Certificate 15CB.',
    risk: 'HIGH',
    legalReference: 'Section 195 read with Section 40(a)(i) and Rule 37BB',
    source: 'Foreign Remittance / Overseas Vendor Ledgers',
    applicability: 'All entities making payments outside India',
    form3cdClause: '21(b)',
    caroClause: 'N/A',
    evidenceRequired: [
      'Form 15CA Part A/C electronic filing acknowledgment',
      'Form 15CB Chartered Accountant certificate',
      'Foreign vendor Tax Residency Certificate (TRC) and Form 10F for DTAA benefit',
      'No PE (Permanent Establishment) declaration'
    ],
    recommendation: 'Check 100% disallowance under Section 40(a)(i) if tax was not deducted. Verify Form 15CA/15CB filings with bank Swift copies.',
    check: (tx: Transaction): RuleEvaluationResult => {
      const isForeign = tx.particulars.toLowerCase().includes('foreign') || 
                        tx.particulars.toLowerCase().includes('overseas') ||
                        tx.particulars.toLowerCase().includes('import software') ||
                        tx.particulars.toLowerCase().includes('cloud subscription') ||
                        tx.ledgerName.toLowerCase().includes('overseas') ||
                        tx.particulars.toLowerCase().includes('15ca');
      const amount = tx.debit > 0 ? tx.debit : (tx.netAmount ?? 0);
      if (isForeign && amount >= 50000 && tx.tdsSection !== '195') {
        return {
          matched: true,
          note: `Foreign payment of ₹${amount.toLocaleString('en-IN')} lacks Section 195 withholding or Form 15CA/CB documentation`,
          exposureAmount: amount
        };
      }
      return { matched: false };
    }
  },

  // 14. IT_43B_STATUTORY_DUES
  {
    id: 'IT_43B_STATUTORY_DUES',
    category: 'Income-tax / Tax Audit',
    title: 'Statutory Dues & Certain Liabilities Requiring Section 43B Payment Review',
    description: 'Taxes, duties, cess, employee contributions, loan interest to banks/FIs, and MSME payments (clause h) are allowed as deduction only upon actual payment on or before the due date for filing return.',
    risk: 'HIGH',
    legalReference: 'Section 43B of the Income-tax Act, 1961',
    source: 'Duties & Taxes / Provision Accounts / MSME Creditors',
    applicability: 'All assessees following mercantile accounting',
    form3cdClause: '26',
    caroClause: '3(vii)',
    evidenceRequired: [
      'Challan receipts showing dates of actual payment of GST, Customs, PF, ESI',
      'Bank interest payment certificates for loans from scheduled banks/NBFCs',
      'MSME vendor payment proof within 45 days (or 15 days without agreement)',
      'Comparison with ITR due date under Section 139(1)'
    ],
    recommendation: 'List all unpaid statutory sums and delayed MSME dues in Clause 26 of Form 3CD for disallowance.',
    check: (tx: Transaction): RuleEvaluationResult => {
      const is43b = tx.particulars.toLowerCase().includes('43b') || 
                    tx.particulars.toLowerCase().includes('statutory dues unpaid') ||
                    (tx.msmePaymentDays && tx.msmePaymentDays > 45) ||
                    (tx.parentGroup.toLowerCase().includes('duties & taxes') && tx.credit > 0 && tx.particulars.toLowerCase().includes('outstanding'));
      const amount = tx.debit > 0 ? tx.debit : (tx.credit > 0 ? tx.credit : (tx.netAmount ?? 0));
      if (is43b && amount > 0) {
        return {
          matched: true,
          note: `Liability of ₹${amount.toLocaleString('en-IN')} subject to Section 43B payment deadline verification`,
          exposureAmount: amount
        };
      }
      return { matched: false };
    }
  },

  // 15. IT_40A7_GRATUITY
  {
    id: 'IT_40A7_GRATUITY',
    category: 'Income-tax / Tax Audit',
    title: 'Gratuity Provision Requiring Section 40A(7) Review',
    description: 'No deduction is allowed in respect of any provision made for payment of gratuity to employees on their retirement, unless it is for contribution towards an approved gratuity fund.',
    risk: 'MEDIUM',
    legalReference: 'Section 40A(7) of the Income-tax Act',
    source: 'Provisions for Gratuity / Employee Benefit Expense',
    applicability: 'All employers',
    form3cdClause: '21(e)',
    caroClause: 'N/A',
    evidenceRequired: [
      'Actuarial valuation report for gratuity',
      'Income-tax approval letter of the gratuity trust / fund',
      'Proof of actual payment to LIC / trust within the financial year',
      'Ledger extract of Provision for Gratuity account'
    ],
    recommendation: 'Confirm whether provision is funded under an approved trust. If unapproved book provision, report disallowance under Clause 21(e).',
    check: (tx: Transaction): RuleEvaluationResult => {
      const isGratuity = tx.particulars.toLowerCase().includes('gratuity provision') || 
                         tx.ledgerName.toLowerCase().includes('gratuity provision') ||
                         (tx.ledgerName.toLowerCase().includes('gratuity') && tx.particulars.toLowerCase().includes('provision'));
      const amount = tx.debit > 0 ? tx.debit : (tx.netAmount ?? 0);
      if (isGratuity && amount > 0) {
        return {
          matched: true,
          note: `Gratuity provision of ₹${amount.toLocaleString('en-IN')} flagged for approval verification u/s 40A(7)`,
          exposureAmount: amount
        };
      }
      return { matched: false };
    }
  },

  // 16. IT_40A9_EMPLOYEE_FUND
  {
    id: 'IT_40A9_EMPLOYEE_FUND',
    category: 'Income-tax / Tax Audit',
    title: 'Non-Statutory Employee Welfare Fund Contribution (Section 40A(9))',
    description: 'No deduction is allowable for any sum paid by the assessee as an employer towards setting up or formation of, or as contribution to, any fund, trust, or association unless required by law.',
    risk: 'MEDIUM',
    legalReference: 'Section 40A(9) of the Income-tax Act',
    source: 'Staff Welfare / Trust Contributions',
    applicability: 'All employers',
    form3cdClause: '21(f)',
    caroClause: 'N/A',
    evidenceRequired: [
      'Trust deed / fund constitution documents',
      'Statutory requirement proving obligation (e.g. recognized PF vs unapproved welfare scheme)',
      'Details of trustee names and utilization of funds'
    ],
    recommendation: 'Confirm statutory mandate. Report unauthorized contributions in Clause 21(f) of Form 3CD.',
    check: (tx: Transaction): RuleEvaluationResult => {
      const isWelfare = tx.particulars.toLowerCase().includes('unapproved welfare fund') || 
                        tx.particulars.toLowerCase().includes('staff welfare trust') ||
                        (tx.ledgerName.toLowerCase().includes('welfare fund') && !tx.ledgerName.toLowerCase().includes('provident'));
      const amount = tx.debit > 0 ? tx.debit : (tx.netAmount ?? 0);
      if (isWelfare && amount > 0) {
        return {
          matched: true,
          note: `Contribution of ₹${amount.toLocaleString('en-IN')} to employee fund requires Section 40A(9) eligibility scrutiny`,
          exposureAmount: amount
        };
      }
      return { matched: false };
    }
  },

  // 17. IT_PARTNER_REMUNERATION_40B
  {
    id: 'IT_PARTNER_REMUNERATION_40B',
    category: 'Income-tax / Tax Audit',
    title: 'Partner Remuneration / Interest Requiring Section 40(b) Review',
    description: 'Remuneration paid to non-working partners, interest on capital exceeding 12% p.a., or remuneration exceeding book-profit ceiling limits under Section 40(b) is disallowed.',
    risk: 'HIGH',
    legalReference: 'Section 40(b) of the Income-tax Act',
    source: 'Partners Capital Account / Profit & Loss Appropriation',
    applicability: 'Firms and Limited Liability Partnerships (LLP)',
    form3cdClause: '21(c)',
    caroClause: 'N/A',
    evidenceRequired: [
      'Partnership Deed verifying authorization of salary and interest',
      'Working Partner status affirmation',
      'Book profit computation as per Explanation 3 to Section 40(b)',
      'Interest calculation sheets proving interest <= 12% simple interest p.a.'
    ],
    recommendation: 'Check Partnership Deed terms. Recalculate book profit ceiling. Report excess in Clause 21(c).',
    check: (tx: Transaction, _allTx: Transaction[], config: AuditConfig): RuleEvaluationResult => {
      const isFirm = config.entityType === 'firm' || config.entityType === 'llp';
      const isPartnerTx = tx.particulars.toLowerCase().includes('partner remuneration') || 
                          tx.particulars.toLowerCase().includes('partner salary') ||
                          tx.particulars.toLowerCase().includes('interest on capital') ||
                          tx.ledgerName.toLowerCase().includes('partner salary') ||
                          tx.ledgerName.toLowerCase().includes('partner remuneration');
      const amount = tx.debit > 0 ? tx.debit : (tx.netAmount ?? 0);
      if (isFirm && isPartnerTx && amount > 0) {
        return {
          matched: true,
          note: `Partner remuneration/interest payment of ₹${amount.toLocaleString('en-IN')} requires Section 40(b) ceiling verification`,
          exposureAmount: amount
        };
      }
      return { matched: false };
    }
  },

  // 18. IT_PROHIBITED_EXPENSE_37
  {
    id: 'IT_PROHIBITED_EXPENSE_37',
    category: 'Income-tax / Tax Audit',
    title: 'Expense Prohibited by Law, Penalties or Fines (Section 37(1))',
    description: 'Any expenditure incurred for any purpose which is an offence or which is prohibited by law, including compounding fees, environmental penalties, traffic fines, or illegal perquisites, is strictly disallowed.',
    risk: 'HIGH',
    legalReference: 'Explanation 1 & 3 to Section 37(1) of the Income-tax Act',
    source: 'Rates & Taxes / Penalties / Legal & Secretarial',
    applicability: 'All Assessees',
    form3cdClause: '21(a)',
    caroClause: 'N/A',
    evidenceRequired: [
      'Challan and order copy from regulatory authority (GST/MCA/Customs/Pollution Control)',
      'Accounting entry scrutiny to identify whether compensatory or penal in nature',
      'Board minutes explaining reasons for regulatory levy'
    ],
    recommendation: 'Segregate purely compensatory interest from penal fines. Add back all punitive levies under Clause 21(a).',
    check: (tx: Transaction): RuleEvaluationResult => {
      const isPenalty = tx.particulars.toLowerCase().includes('penalty') || 
                        tx.particulars.toLowerCase().includes('fine') || 
                        tx.particulars.toLowerCase().includes('challan for violation') ||
                        tx.particulars.toLowerCase().includes('compounding fee') ||
                        tx.ledgerName.toLowerCase().includes('fines & penalties') ||
                        tx.ledgerName.toLowerCase().includes('penalties');
      const amount = tx.debit > 0 ? tx.debit : (tx.netAmount ?? 0);
      if (isPenalty && amount > 0) {
        return {
          matched: true,
          note: `Penalty / fine of ₹${amount.toLocaleString('en-IN')} debited to revenue account is prohibited under Section 37(1)`,
          exposureAmount: amount
        };
      }
      return { matched: false };
    }
  },

  // 19. GST_MISSING_GSTIN
  {
    id: 'GST_MISSING_GSTIN',
    category: 'GST',
    title: 'GST-Relevant B2B Transaction Without Registered GSTIN',
    description: 'Purchases or sales involving GST input tax credit or tax charges where the supplier or recipient GSTIN is missing, invalid, or formatted incorrectly.',
    risk: 'MEDIUM',
    legalReference: 'Section 16(2) read with Section 31 of CGST Act, 2017',
    source: 'Purchase / Sales Registers',
    applicability: 'GST Registered Assessees',
    form3cdClause: '44',
    caroClause: 'N/A',
    evidenceRequired: [
      'Tax invoice copy showing supplier GSTIN and address',
      'GSTR-2B reflection check on GST portal',
      'Vendor active status on GST portal search',
      'E-invoice IRN validation if supplier turnover > ₹5 Cr'
    ],
    recommendation: 'Demand valid GSTIN and tax invoice. Ineligible for ITC unless verified in GSTR-2B.',
    check: (tx: Transaction): RuleEvaluationResult => {
      const isGstRelevant = (tx.voucherType === 'Purchase' || tx.voucherType === 'Sales') && 
                            (tx.particulars.toLowerCase().includes('gst') || tx.ledgerName.toLowerCase().includes('tax') || tx.debit > 50000 || tx.credit > 50000);
      const isMissingGstin = !tx.gstin || tx.gstin.trim() === '' || tx.gstin === 'UNREGISTERED' || tx.gstin.length !== 15;
      const amount = tx.debit > 0 ? tx.debit : (tx.credit > 0 ? tx.credit : (tx.netAmount ?? 0));
      if (isGstRelevant && isMissingGstin && amount >= 50000) {
        return {
          matched: true,
          note: `B2B transaction of ₹${amount.toLocaleString('en-IN')} missing 15-digit GSTIN; risk of ITC denial`,
          exposureAmount: Math.round(amount * 0.18) // potential 18% ITC at risk
        };
      }
      return { matched: false };
    }
  },

  // 20. GST_ITC_BLOCKED_17_5
  {
    id: 'GST_ITC_BLOCKED_17_5',
    category: 'GST',
    title: 'Potential Blocked Input Tax Credit under Section 17(5)',
    description: 'Input Tax Credit cannot be claimed on motor vehicles for transport of persons (<=13 seating), food and beverages, outdoor catering, health services, club membership, personal consumption, or goods lost/stolen/destroyed/written off.',
    risk: 'HIGH',
    legalReference: 'Section 17(5) of the Central Goods and Services Tax Act, 2017',
    source: 'Input Tax Credit Ledgers / Vehicle / Staff Welfare Expenses',
    applicability: 'All GST registered businesses',
    form3cdClause: '44',
    caroClause: 'N/A',
    evidenceRequired: [
      'Original tax invoice and asset capitalization entry',
      'Seating capacity and end-use certificate for vehicles',
      'Logbook and justification if vehicle used for further supply/training',
      'Reconciliation of ITC availed in GSTR-3B vs ineligible credit u/s 17(5)'
    ],
    recommendation: 'Reverse ineligible credit along with interest under Section 50(3) if availed. Exclude from GSTR-3B Table 4(A).',
    check: (tx: Transaction): RuleEvaluationResult => {
      const isBlockedItem = 
        tx.particulars.toLowerCase().includes('motor car') || 
        tx.particulars.toLowerCase().includes('personal insurance') ||
        tx.particulars.toLowerCase().includes('food & beverages') ||
        tx.particulars.toLowerCase().includes('catering') ||
        tx.particulars.toLowerCase().includes('club membership') ||
        tx.particulars.toLowerCase().includes('gift to employee') ||
        tx.particulars.toLowerCase().includes('written off goods') ||
        tx.particulars.toLowerCase().includes('luxury vehicle') ||
        tx.ledgerName.toLowerCase().includes('motor car maintenance') ||
        tx.ledgerName.toLowerCase().includes('club expenses');
      const amount = tx.debit > 0 ? tx.debit : (tx.netAmount ?? 0);
      if (isBlockedItem && amount >= 20000) {
        const potentialItc = Math.round(amount * 0.18);
        return {
          matched: true,
          note: `Potential blocked ITC of ₹${potentialItc.toLocaleString('en-IN')} on ₹${amount.toLocaleString('en-IN')} expenditure under Section 17(5)`,
          exposureAmount: potentialItc
        };
      }
      return { matched: false };
    }
  },

  // 21. GST_RCM_CANDIDATE
  {
    id: 'GST_RCM_CANDIDATE',
    category: 'GST',
    title: 'Potential Reverse Charge Mechanism (RCM) Transaction',
    description: 'Tax is payable by recipient under RCM for specified supplies: Goods Transport Agency (GTA), legal services by advocate/firm, sponsorship, director remuneration, security services, or renting of motor vehicle from unregistered persons.',
    risk: 'HIGH',
    legalReference: 'Section 9(3) and Notification No. 13/2017-Central Tax (Rate)',
    source: 'Freight / Legal / Security Expenses Ledgers',
    applicability: 'All business entities',
    form3cdClause: '44',
    caroClause: '3(vii)',
    evidenceRequired: [
      'Vendor invoice showing whether forward charge opted or RCM applicable',
      'Self-invoice raised by recipient under Section 31(3)(f)',
      'Payment voucher raised under Section 31(3)(g)',
      'Payment of RCM liability through electronic cash ledger in GSTR-3B'
    ],
    recommendation: 'Discharge GST liability under cash ledger. Claim corresponding ITC in same return if eligible.',
    check: (tx: Transaction): RuleEvaluationResult => {
      const isRcmCategory = 
        tx.particulars.toLowerCase().includes('gta') || 
        tx.particulars.toLowerCase().includes('advocate fees') ||
        tx.particulars.toLowerCase().includes('legal counsel') ||
        tx.particulars.toLowerCase().includes('director commission') ||
        tx.particulars.toLowerCase().includes('security service') ||
        tx.ledgerName.toLowerCase().includes('legal fees') ||
        tx.ledgerName.toLowerCase().includes('freight inward') ||
        tx.particulars.toLowerCase().includes('rcm');
      const amount = tx.debit > 0 ? tx.debit : (tx.netAmount ?? 0);
      if (isRcmCategory && amount >= 25000) {
        const rcmTax = Math.round(amount * 0.18);
        return {
          matched: true,
          note: `RCM candidate transaction: Potential GST cash liability of ₹${rcmTax.toLocaleString('en-IN')} (18%) on ₹${amount.toLocaleString('en-IN')}`,
          exposureAmount: rcmTax
        };
      }
      return { matched: false };
    }
  },

  // 22. GST_EWAY_BILL_REVIEW
  {
    id: 'GST_EWAY_BILL_REVIEW',
    category: 'GST',
    title: 'Goods Movement Above ₹50,000 Requiring E-Way Bill Review',
    description: 'Every registered person causing movement of consignment of goods exceeding ₹50,000 in value must generate an electronic way bill prior to commencement of movement.',
    risk: 'MEDIUM',
    legalReference: 'Rule 138 of CGST Rules, 2017',
    source: 'Dispatch Register / Sales & Purchase Vouchers',
    applicability: 'Consignments of goods exceeding ₹50,000',
    form3cdClause: 'N/A',
    caroClause: '3(ii)',
    evidenceRequired: [
      'E-Way Bill 12-digit number and generation date',
      'Vehicle number Part-B update / Transporter ID',
      'Delivery challan or lorry receipt (LR / Consignment Note)',
      'Matching of consignment value with tax invoice'
    ],
    recommendation: 'Verify E-way bill generation within validity time. Absence risks vehicle detention and 200% penalty u/s 129.',
    check: (tx: Transaction): RuleEvaluationResult => {
      const isGoodsMovement = (tx.voucherType === 'Sales' || tx.voucherType === 'Purchase') &&
                              (tx.particulars.toLowerCase().includes('goods') || 
                               tx.particulars.toLowerCase().includes('dispatch') ||
                               tx.particulars.toLowerCase().includes('consignment') ||
                               tx.ledgerName.toLowerCase().includes('trading') ||
                               tx.ledgerName.toLowerCase().includes('raw material'));
      const amount = tx.debit > 0 ? tx.debit : (tx.credit > 0 ? tx.credit : (tx.netAmount ?? 0));
      if (isGoodsMovement && amount >= 50000 && (!tx.ewayBill || tx.ewayBill.trim() === '')) {
        return {
          matched: true,
          note: `Consignment movement of ₹${amount.toLocaleString('en-IN')} lacks E-Way Bill reference`,
          exposureAmount: amount
        };
      }
      return { matched: false };
    }
  },

  // 23. GST_INVOICE_DATA_GAP
  {
    id: 'GST_INVOICE_DATA_GAP',
    category: 'GST',
    title: 'Tax Invoice Data Gap (Missing Number, Date, or HSN)',
    description: 'Invoices missing mandatory Rule 46 requirements: consecutive serial number, invoice date, HSN/SAC code, or place of supply.',
    risk: 'LOW',
    legalReference: 'Rule 46 and Rule 48 of CGST Rules, 2017',
    source: 'Sales & Purchase Invoices',
    applicability: 'All GST Registered Suppliers',
    form3cdClause: '44',
    caroClause: 'N/A',
    evidenceRequired: [
      'Original invoice voucher copy',
      'Harmonized System of Nomenclature (HSN) classification schedule',
      'Electronic invoice IRN JSON payload where applicable'
    ],
    recommendation: 'Ensure standardisation of invoicing sequence and mandatory tax fields in ERP.',
    check: (tx: Transaction): RuleEvaluationResult => {
      const isTx = tx.voucherType === 'Sales' || tx.voucherType === 'Purchase';
      const hasGap = !tx.invoiceRef || tx.invoiceRef.trim() === '' || !tx.date;
      if (isTx && hasGap) {
        return {
          matched: true,
          note: 'Invoice missing serial number or mandatory statutory metadata',
          exposureAmount: 0
        };
      }
      return { matched: false };
    }
  },

  // 24. GST_RCM_IMPORT_SERVICE
  {
    id: 'GST_RCM_IMPORT_SERVICE',
    category: 'GST',
    title: 'Import of Service Requiring IGST Reverse-Charge Review',
    description: 'Supply of service where supplier is outside India, recipient is in India, and place of supply is in India constitutes import of service; recipient must pay IGST under RCM.',
    risk: 'HIGH',
    legalReference: 'Section 5(3) read with Section 7(4) of IGST Act, 2017',
    source: 'Foreign Exchange Payments / Software Subscriptions / Royalties',
    applicability: 'All Indian businesses receiving overseas services',
    form3cdClause: '44',
    caroClause: '3(vii)',
    evidenceRequired: [
      'Foreign supplier invoice in foreign currency',
      'FIRC (Foreign Inward/Outward Remittance Certificate) from bank',
      'Self-invoice and IGST payment in GSTR-3B Table 3.1(d)',
      'ITC availed in Table 4(A)(2) of GSTR-3B'
    ],
    recommendation: 'Verify IGST payment under cash ledger and subsequent ITC eligibility.',
    check: (tx: Transaction): RuleEvaluationResult => {
      const isImportSvc = tx.particulars.toLowerCase().includes('overseas software') ||
                          tx.particulars.toLowerCase().includes('foreign server') ||
                          tx.particulars.toLowerCase().includes('import of service') ||
                          tx.particulars.toLowerCase().includes('foreign technical consultation');
      const amount = tx.debit > 0 ? tx.debit : (tx.netAmount ?? 0);
      if (isImportSvc && amount >= 50000) {
        const igstExposure = Math.round(amount * 0.18);
        return {
          matched: true,
          note: `Import of service payment of ₹${amount.toLocaleString('en-IN')} requires IGST RCM discharge of ₹${igstExposure.toLocaleString('en-IN')}`,
          exposureAmount: igstExposure
        };
      }
      return { matched: false };
    }
  },

  // 25. COMPANIES_ACT_185_DIRECTOR_LOAN
  {
    id: 'COMPANIES_ACT_185_DIRECTOR_LOAN',
    category: 'Companies Act',
    title: 'Loan, Guarantee or Security to Directors or Connected Persons (Section 185)',
    description: 'Companies are prohibited from advancing any loan or giving guarantee/security to directors or interested entities, subject to limited exceptions for MD/WTD schemes or principal business of lending.',
    risk: 'HIGH',
    legalReference: 'Section 185 of the Companies Act, 2013',
    source: 'Loans & Advances to Directors / Related Parties',
    applicability: 'All Companies (Private & Public)',
    form3cdClause: '31(a)',
    caroClause: '3(iv)',
    evidenceRequired: [
      'Special resolution passed in general meeting (if falling under eligible sub-section 2)',
      'Certificate from borrowing company that loan is utilized exclusively for principal business',
      'Register of loans and investments maintained under Section 189 (Form MBP-2)',
      'MCA Form MGT-14 filing acknowledgment'
    ],
    recommendation: 'Check compliance with Section 185 exceptions and special resolutions. Failure attracts criminal penalty and fine up to ₹25 Lakhs.',
    check: (tx: Transaction, _allTx: Transaction[], config: AuditConfig): RuleEvaluationResult => {
      const isCompany = config.entityType === 'company';
      const isDirectorAdvance = 
        tx.partyType === 'Director' || 
        tx.particulars.toLowerCase().includes('director advance') ||
        tx.particulars.toLowerCase().includes('director loan') ||
        tx.ledgerName.toLowerCase().includes('director loan') ||
        tx.ledgerName.toLowerCase().includes('director advance');
      const isDebit = tx.debit > 0 || (tx.voucherType === 'Payment' && (tx.netAmount || 0) > 0);
      const amount = tx.debit > 0 ? tx.debit : (tx.netAmount ?? 0);
      if (isCompany && isDirectorAdvance && isDebit && amount >= 50000) {
        return {
          matched: true,
          note: `Advance/loan to director of ₹${amount.toLocaleString('en-IN')} requires strict Section 185 compliance and CARO clause 3(iv) disclosure`,
          exposureAmount: amount
        };
      }
      return { matched: false };
    }
  },

  // 26. COMPANIES_ACT_186_LOANS_INVESTMENTS
  {
    id: 'COMPANIES_ACT_186_LOANS_INVESTMENTS',
    category: 'Companies Act',
    title: 'Inter-Corporate Loans, Investments, or Guarantees (Section 186)',
    description: 'No company shall directly or indirectly give loan, guarantee or provide security to any person or body corporate, or acquire securities exceeding 60% of paid-up share capital, free reserves and securities premium, or 100% of free reserves and securities premium without prior special resolution.',
    risk: 'HIGH',
    legalReference: 'Section 186 of the Companies Act, 2013',
    source: 'Investments / Inter-Corporate Deposits / Loans Given',
    applicability: 'All Companies',
    form3cdClause: 'N/A',
    caroClause: '3(iv)',
    evidenceRequired: [
      'Board Resolution with unanimous consent of all directors present',
      'Special Resolution if limit exceeds 60% / 100% threshold',
      'Prior approval of Public Financial Institutions if term loan is subsisting',
      'Form MBP-2 Register of Loans, Guarantees, Security and Acquisitions'
    ],
    recommendation: 'Verify Section 186 statutory thresholds, interest rate (not lower than prevailing yield of G-Sec), and disclosures in financial notes.',
    check: (tx: Transaction, _allTx: Transaction[], config: AuditConfig): RuleEvaluationResult => {
      const isCompany = config.entityType === 'company';
      const isIcl = tx.particulars.toLowerCase().includes('inter-corporate') ||
                    tx.particulars.toLowerCase().includes('loan to subsidiary') ||
                    tx.particulars.toLowerCase().includes('loan to sister concern') ||
                    tx.ledgerName.toLowerCase().includes('inter corporate loan');
      const amount = tx.debit > 0 ? tx.debit : (tx.netAmount ?? 0);
      if (isCompany && isIcl && amount >= 500000) {
        return {
          matched: true,
          note: `Inter-corporate financing of ₹${amount.toLocaleString('en-IN')} requires Section 186 resolution check & CARO 3(iv) audit`,
          exposureAmount: amount
        };
      }
      return { matched: false };
    }
  },

  // 27. COMPANIES_ACT_188_RPT
  {
    id: 'COMPANIES_ACT_188_RPT',
    category: 'Companies Act',
    title: 'Related-Party Transactions Requiring Section 188 Review',
    description: 'Contracts or arrangements with related parties for sale/purchase of goods, services, leasing, or appointment to place of profit require Board approval (and shareholder approval if exceeding limits), unless entered in ordinary course of business on arm’s length basis.',
    risk: 'HIGH',
    legalReference: 'Section 188 of the Companies Act, 2013 read with Rule 15',
    source: 'Related Party Ledgers / Director Relatives / Holding-Subsidiary',
    applicability: 'All Companies',
    form3cdClause: 'N/A',
    caroClause: '3(xiii)',
    evidenceRequired: [
      'Audit Committee approval / omnibus approval under Section 177',
      'Board Resolution and Form AOC-2 disclosure in Board Report',
      'Transfer pricing / Arm’s length documentation and benchmark study',
      'Form MBP-4 Register of contracts in which directors are interested'
    ],
    recommendation: 'Evaluate ordinary course of business and arms length basis. Disclose in notes to accounts as per AS 18 / Ind AS 24.',
    check: (tx: Transaction, _allTx: Transaction[], config: AuditConfig): RuleEvaluationResult => {
      const isCompany = config.entityType === 'company';
      const isRpt = tx.partyType === 'Related Entity' || 
                    tx.partyType === 'Relative' ||
                    tx.particulars.toLowerCase().includes('related party') ||
                    tx.particulars.toLowerCase().includes('holding company') ||
                    tx.particulars.toLowerCase().includes('sister concern');
      const amount = tx.debit > 0 ? tx.debit : (tx.credit > 0 ? tx.credit : (tx.netAmount ?? 0));
      if (isCompany && isRpt && amount >= 100000) {
        return {
          matched: true,
          note: `Related-party transaction of ₹${amount.toLocaleString('en-IN')} requires arm’s length testing and CARO 3(xiii) compliance`,
          exposureAmount: amount
        };
      }
      return { matched: false };
    }
  },

  // 28. COMPANIES_ACT_184_INTEREST_DISCLOSURE
  {
    id: 'COMPANIES_ACT_184_INTEREST_DISCLOSURE',
    category: 'Companies Act',
    title: 'Director Interest Disclosure Review (Section 184)',
    description: 'Every director must disclose concern or interest in any company, body corporate, firm, or entity in Form MBP-1 at the first board meeting, and must not participate in discussions regarding interested contracts.',
    risk: 'MEDIUM',
    legalReference: 'Section 184 of the Companies Act, 2013',
    source: 'Contracts & Vendors involving Director Equity/Partnership',
    applicability: 'All Companies',
    form3cdClause: 'N/A',
    caroClause: '3(xiii)',
    evidenceRequired: [
      'Form MBP-1 submitted by every director for the financial year',
      'Minutes of Board meeting recording disclosure of interest',
      'Verification that interested director was neither counted in quorum nor voted'
    ],
    recommendation: 'Cross-match party names in daybook against Director interest disclosures in Form MBP-1.',
    check: (tx: Transaction): RuleEvaluationResult => {
      const isInterested = tx.particulars.toLowerCase().includes('director interested entity') ||
                           tx.particulars.toLowerCase().includes('firm of director');
      const amount = tx.debit > 0 ? tx.debit : (tx.netAmount ?? 0);
      if (isInterested && amount > 0) {
        return {
          matched: true,
          note: `Contract with director-interested entity of ₹${amount.toLocaleString('en-IN')} requires MBP-1 audit check`,
          exposureAmount: amount
        };
      }
      return { matched: false };
    }
  },

  // 29. COMPANIES_ACT_143_AUDIT
  {
    id: 'COMPANIES_ACT_143_AUDIT',
    category: 'Companies Act',
    title: 'Statutory Auditor Enquiries on Book Entries & Personal Expenses (Section 143(1))',
    description: 'Auditor must enquire whether loans/advances made are properly secured and prejudicial, whether transactions represented merely by book entries are prejudicial, and whether personal expenses have been charged to revenue account.',
    risk: 'MEDIUM',
    legalReference: 'Section 143(1)(a)-(f) of the Companies Act, 2013',
    source: 'Journal Vouchers / Non-cash Adjustments / Personal Accounts',
    applicability: 'Statutory Audits under Companies Act',
    form3cdClause: 'N/A',
    caroClause: 'N/A',
    evidenceRequired: [
      'Substantiation for non-cash journal entries and inter-party adjustments',
      'Agreements supporting book entries without cash flow',
      'Scrutiny of travel, telephone, club and personal entertainment accounts'
    ],
    recommendation: 'Inquire into purpose and business rationale of prejudicial entries. Document working paper on Section 143(1) inquiries.',
    check: (tx: Transaction): RuleEvaluationResult => {
      const isPrejudicial = tx.voucherType === 'Journal' && 
                            (tx.particulars.toLowerCase().includes('adjustment of personal') ||
                             tx.particulars.toLowerCase().includes('prejudicial entry') ||
                             tx.particulars.toLowerCase().includes('book transfer without bank'));
      const amount = tx.debit > 0 ? tx.debit : (tx.netAmount ?? 0);
      if (isPrejudicial && amount > 50000) {
        return {
          matched: true,
          note: `Book adjustment entry of ₹${amount.toLocaleString('en-IN')} subject to Section 143(1) auditor enquiry`,
          exposureAmount: amount
        };
      }
      return { matched: false };
    }
  },

  // 30. COMPANIES_ACT_DEPOSITS_73
  {
    id: 'COMPANIES_ACT_DEPOSITS_73',
    category: 'Companies Act',
    title: 'Potential Deposit Acceptance Requiring Companies Act Review (Section 73)',
    description: 'Receipt of money by way of deposit or loan from any person other than banking companies or exempted categories (directors from own funds, institutional loans) is prohibited or requires strict circular and DPT-3 filing.',
    risk: 'HIGH',
    legalReference: 'Section 73 to 76 of Companies Act, 2013 read with Deposit Rules',
    source: 'Unsecured Loans / Customer Advances / Sundry Creditors',
    applicability: 'All Companies',
    form3cdClause: '31(a)',
    caroClause: '3(v)',
    evidenceRequired: [
      'Declaration from director that loan is out of own funds and not borrowed (Rule 2(1)(c)(viii))',
      'Proof of commercial supply for customer advances outstanding beyond 365 days',
      'Annual return of deposits Form DPT-3 filed before 30th June',
      'Credit rating certificate if accepted from members'
    ],
    recommendation: 'Confirm whether receipts are exempt under Deposit Rules. Deemed deposits attract 18% penal interest and heavy corporate fines.',
    check: (tx: Transaction, _allTx: Transaction[], config: AuditConfig): RuleEvaluationResult => {
      const isCompany = config.entityType === 'company';
      const isDeposit = (tx.voucherType === 'Receipt') && 
                        (tx.particulars.toLowerCase().includes('unsecured loan from non-director') ||
                         tx.particulars.toLowerCase().includes('deposit from public') ||
                         (tx.parentGroup.toLowerCase().includes('unsecured loans') && tx.partyType === 'Third Party'));
      const amount = tx.credit > 0 ? tx.credit : (tx.netAmount ?? 0);
      if (isCompany && isDeposit && amount >= 50000) {
        return {
          matched: true,
          note: `Unsecured borrowing of ₹${amount.toLocaleString('en-IN')} from third party flagged for Deemed Deposit risk u/s 73`,
          exposureAmount: amount
        };
      }
      return { matched: false };
    }
  },

  // 31. COMPANIES_ACT_CSR_135
  {
    id: 'COMPANIES_ACT_CSR_135',
    category: 'Companies Act',
    title: 'Corporate Social Responsibility (CSR) Expenditure & Obligation (Section 135)',
    description: 'Every company having net worth >= ₹500 Cr, turnover >= ₹1,000 Cr, or net profit >= ₹5 Cr during immediately preceding FY shall constitute CSR committee and spend at least 2% of average net profits of preceding 3 financial years.',
    risk: 'MEDIUM',
    legalReference: 'Section 135 of Companies Act, 2013 read with Schedule VII',
    source: 'CSR Expense Account / P&L Appropriation',
    applicability: 'Companies meeting net worth, turnover, or net profit thresholds',
    form3cdClause: 'N/A',
    caroClause: '3(xx)',
    evidenceRequired: [
      'CSR Committee constitution and meeting minutes',
      'CSR Policy and approved Schedule VII project list',
      'Transfer of unspent ongoing project funds to Special Unspent CSR Account within 30 days',
      'Transfer of unspent non-ongoing project funds to Fund specified in Schedule VII within 6 months'
    ],
    recommendation: 'Check 2% spend computation and CARO Clause 3(xx) reporting on unspent CSR transfers.',
    check: (tx: Transaction, _allTx: Transaction[], config: AuditConfig): RuleEvaluationResult => {
      const isCompany = config.entityType === 'company';
      const meetsCsrThreshold = config.turnover >= 1000000000 || config.netProfit >= 50000000;
      const isCsrTx = tx.particulars.toLowerCase().includes('csr') || 
                      tx.ledgerName.toLowerCase().includes('csr');
      const amount = tx.debit > 0 ? tx.debit : (tx.netAmount ?? 0);
      if (isCompany && (meetsCsrThreshold || isCsrTx)) {
        if (isCsrTx) {
          return {
            matched: true,
            note: `CSR transaction of ₹${amount.toLocaleString('en-IN')} booked; audit Schedule VII eligible activities and CARO 3(xx)`,
            exposureAmount: amount
          };
        }
      }
      return { matched: false };
    }
  },

  // 32. CARO_2020_STATUTORY_DUES
  {
    id: 'CARO_2020_STATUTORY_DUES',
    category: 'CARO 2020',
    title: 'Undisputed Statutory Dues Outstanding > 6 Months (CARO Clause 3(vii))',
    description: 'Reporting whether the company is regular in depositing undisputed statutory dues (GST, PF, ESI, Income-tax, Customs, Cess) and whether arrears outstanding for more than 6 months from the date they became payable.',
    risk: 'HIGH',
    legalReference: 'CARO 2020 Clause 3(vii)(a) and 3(vii)(b)',
    source: 'Duties & Taxes Accounts / Statutory Arrears',
    applicability: 'Companies covered under CARO 2020',
    form3cdClause: '26',
    caroClause: '3(vii)',
    evidenceRequired: [
      'Statutory dues ageing schedule as on balance sheet date',
      'Dates of crystallisation/liability vs date of payment',
      'Dispute details (forum, amount involved, stay order) for contested liabilities'
    ],
    recommendation: 'List all statutory dues outstanding > 6 months in CARO audit report Annexure with forums and figures.',
    check: (tx: Transaction, _allTx: Transaction[], config: AuditConfig): RuleEvaluationResult => {
      const isCompany = config.entityType === 'company';
      const isDuesArrears = tx.particulars.toLowerCase().includes('statutory dues > 6 months') ||
                            tx.particulars.toLowerCase().includes('undisputed gst balance outstanding') ||
                            tx.particulars.toLowerCase().includes('pf arrears');
      const amount = tx.credit > 0 ? tx.credit : (tx.debit > 0 ? tx.debit : (tx.netAmount ?? 0));
      if (isCompany && isDuesArrears && amount > 0) {
        return {
          matched: true,
          note: `Undisputed statutory arrears of ₹${amount.toLocaleString('en-IN')} outstanding > 6 months; mandatory CARO 3(vii) qualification`,
          exposureAmount: amount
        };
      }
      return { matched: false };
    }
  },

  // 33. CARO_2020_LOANS_ADVANCES
  {
    id: 'CARO_2020_LOANS_ADVANCES',
    category: 'CARO 2020',
    title: 'Loans, Investments & Guarantees Granted to Parties (CARO Clause 3(iii))',
    description: 'Reporting whether investments made, guarantees provided, security given, or loans/advances granted are prejudicial to company interest, terms of repayment specified, and whether overdue > 90 days.',
    risk: 'MEDIUM',
    legalReference: 'CARO 2020 Clause 3(iii)(a)-(f)',
    source: 'Loans & Advances / Inter-Corporate Loans',
    applicability: 'Companies covered under CARO 2020',
    form3cdClause: 'N/A',
    caroClause: '3(iii)',
    evidenceRequired: [
      'Loan agreements stating repayment schedule and interest terms',
      'Register of overdue loans > 90 days and recovery steps taken',
      'Details of loans renewed, extended, or settled by fresh loans',
      'Details of loans granted without specifying any terms or period of repayment'
    ],
    recommendation: 'Disclose aggregate amounts and balances outstanding at balance sheet date with subsidiaries, JVs, and other parties.',
    check: (tx: Transaction, _allTx: Transaction[], config: AuditConfig): RuleEvaluationResult => {
      const isCompany = config.entityType === 'company';
      const isLoanGiven = (tx.voucherType === 'Payment') && 
                          (tx.particulars.toLowerCase().includes('loan granted') ||
                           tx.particulars.toLowerCase().includes('advance in nature of loan') ||
                           tx.parentGroup.toLowerCase().includes('loans and advances'));
      const amount = tx.debit > 0 ? tx.debit : (tx.netAmount ?? 0);
      if (isCompany && isLoanGiven && amount >= 100000) {
        return {
          matched: true,
          note: `Loan granted of ₹${amount.toLocaleString('en-IN')} requires CARO Clause 3(iii) terms and repayment schedule review`,
          exposureAmount: amount
        };
      }
      return { matched: false };
    }
  },

  // 34. ACCOUNTING_PERSONAL_EXPENSE
  {
    id: 'ACCOUNTING_PERSONAL_EXPENSE',
    category: 'Accounting / Anomaly',
    title: 'Personal Expenses Charged to Business Revenue Account',
    description: 'Personal expenses of directors, promoters, partners, or employees charged to business revenue accounts violate fundamental accounting principles and Section 37(1).',
    risk: 'HIGH',
    legalReference: 'Section 37(1) of Income-tax Act and Section 143(1)(e) of Companies Act',
    source: 'Travel / Hotel / Telephone / General Office Expenses',
    applicability: 'All Assessees',
    form3cdClause: '21(a)',
    caroClause: 'N/A',
    evidenceRequired: [
      'Hotel bills, boarding passes, restaurant receipts',
      'Business purpose justification and tour diary / trip memo',
      'Board authorization or employment terms for personal perks',
      'Segregation between official travel and accompanying family members'
    ],
    recommendation: 'Disallow personal portion and report under Clause 21(a) of Form 3CD or recover from director.',
    check: (tx: Transaction): RuleEvaluationResult => {
      const isPersonal = tx.particulars.toLowerCase().includes('personal expense') ||
                         tx.particulars.toLowerCase().includes('family vacation') ||
                         tx.particulars.toLowerCase().includes('personal medical') ||
                         tx.particulars.toLowerCase().includes('home grocery');
      const amount = tx.debit > 0 ? tx.debit : (tx.netAmount ?? 0);
      if (isPersonal && amount > 0) {
        return {
          matched: true,
          note: `Suspected personal expense of ₹${amount.toLocaleString('en-IN')} debited to P&L account`,
          exposureAmount: amount
        };
      }
      return { matched: false };
    }
  },

  // 35. ACCOUNTING_ROUND_OFF_ANOMALY
  {
    id: 'ACCOUNTING_ROUND_OFF_ANOMALY',
    category: 'Accounting / Anomaly',
    title: 'Repeated Round-Value Journal / Payment Pattern',
    description: 'Vouchers passed in exact round figures (e.g. ₹50,000, ₹1,00,000, ₹5,00,000) through journal entries without invoice backup often indicate artificial balancing entries or unvouched estimates.',
    risk: 'MEDIUM',
    legalReference: 'Standard on Auditing (SA) 240 — Auditor’s Responsibilities Relating to Fraud',
    source: 'Journal Vouchers',
    applicability: 'All Audits',
    form3cdClause: 'N/A',
    caroClause: '3(xi)',
    evidenceRequired: [
      'Supporting invoice / calculation underlying round amount',
      'Management authorization and reason for estimated amount',
      'Subsequent actual settlement proof'
    ],
    recommendation: 'Sample 100% of large round-sum journal entries passed near year-end.',
    check: (tx: Transaction): RuleEvaluationResult => {
      const amount = tx.debit > 0 ? tx.debit : (tx.credit > 0 ? tx.credit : (tx.netAmount ?? 0));
      const isRound = amount >= 100000 && amount % 50000 === 0;
      const isJournal = tx.voucherType === 'Journal';
      if (isRound && isJournal) {
        return {
          matched: true,
          note: `Round-figure journal entry of exact ₹${amount.toLocaleString('en-IN')} flagged for forensic scrutiny under SA 240`,
          exposureAmount: amount
        };
      }
      return { matched: false };
    }
  },

  // 36. MSMED_INTEREST_DUE
  {
    id: 'MSMED_INTEREST_DUE',
    category: 'Labour Law & Statutory',
    title: 'MSME Delayed Payment Beyond 45/15 Days & Section 43B(h) Disallowance',
    description: 'Payments to Micro & Small enterprises beyond agreed period (max 45 days) or 15 days without agreement attract compound interest @ 3x RBI Bank Rate u/s 16 of MSMED Act. Under Section 43B(h), delayed unpaid amount is 100% disallowed in tax audit.',
    risk: 'HIGH',
    legalReference: 'MSMED Act, 2006 (Sec 15, 16, 22) read with Section 43B(h) of Income-tax Act',
    source: 'Sundry Creditors / MSME Ledger Aging',
    applicability: 'All buyers from Micro and Small Enterprises',
    form3cdClause: '22 & 26',
    caroClause: 'N/A',
    evidenceRequired: [
      'Udyam Registration Certificate verifying enterprise category (Micro/Small)',
      'Written agreement terms regarding credit period (maximum 45 days allowed)',
      'Invoice acceptance date vs date of payment',
      'Interest computation sheet calculated at 3x RBI Bank rate compounding monthly'
    ],
    recommendation: 'Under Section 43B(h), disallow all amounts due to Micro/Small enterprises unpaid within statutory deadline. Note: MSMED interest is inadmissible expenditure u/s 23 of MSMED Act.',
    check: (tx: Transaction): RuleEvaluationResult => {
      const isMsme = tx.msmeType === 'Micro' || tx.msmeType === 'Small' || 
                     tx.particulars.toLowerCase().includes('msme') || 
                     tx.particulars.toLowerCase().includes('43b(h)');
      const isDelayed = (tx.msmePaymentDays && tx.msmePaymentDays > 45) || tx.particulars.toLowerCase().includes('delayed > 45 days');
      const amount = tx.credit > 0 ? tx.credit : (tx.debit > 0 ? tx.debit : (tx.netAmount ?? 0));
      if (isMsme && isDelayed && amount > 0) {
        return {
          matched: true,
          note: `Delayed MSME payable of ₹${amount.toLocaleString('en-IN')} exceeds 45-day statutory limit; subject to Section 43B(h) disallowance and penal interest`,
          exposureAmount: amount
        };
      }
      return { matched: false };
    }
  },

  // 37. PF_ESI_UNPAID_REVIEW
  {
    id: 'PF_ESI_UNPAID_REVIEW',
    category: 'Labour Law & Statutory',
    title: 'Employees PF / ESI Contribution Deposited After Due Date (Section 36(1)(va))',
    description: 'Any sum received by the employer from employees as contribution to PF/ESI must be credited to their account on or before the due date under the respective Act (15th of following month). Belated deposit is PERMANENTLY disallowed as per SC Checkmate ruling.',
    risk: 'HIGH',
    legalReference: 'Section 36(1)(va) read with Section 2(24)(x) and Supreme Court ruling in Checkmate Services',
    source: 'PF / ESI Payable Accounts / Payroll Journals',
    applicability: 'All employers collecting employee PF / ESI contributions',
    form3cdClause: '20(b)',
    caroClause: '3(vii)',
    evidenceRequired: [
      'Monthly ECR challans and electronic payment confirmation receipts',
      'Challan generation date and bank account debit value date',
      'Comparison against statutory due date (15th of succeeding month)',
      'Reconciliation of payroll deductions with challan deposits'
    ],
    recommendation: 'Report in Form 3CD Clause 20(b). Unlike Section 43B, belated deposit of employee share cannot be allowed even if paid before ITR filing date.',
    check: (tx: Transaction): RuleEvaluationResult => {
      const isPfEsi = tx.particulars.toLowerCase().includes('pf deposited late') ||
                      tx.particulars.toLowerCase().includes('belated employee pf') ||
                      tx.particulars.toLowerCase().includes('esi deposited after 15th') ||
                      (tx.ledgerName.toLowerCase().includes('provident fund') && tx.particulars.toLowerCase().includes('belated'));
      const amount = tx.debit > 0 ? tx.debit : (tx.netAmount ?? 0);
      if (isPfEsi && amount > 0) {
        return {
          matched: true,
          note: `Belated employee PF/ESI deposit of ₹${amount.toLocaleString('en-IN')} attracts permanent disallowance under Section 36(1)(va)`,
          exposureAmount: amount
        };
      }
      return { matched: false };
    }
  },

  // 38. BONUS_GRATUITY_PAYABLE
  {
    id: 'BONUS_GRATUITY_PAYABLE',
    category: 'Labour Law & Statutory',
    title: 'Bonus / Gratuity Payable Provision Review (Section 43B(c))',
    description: 'Any sum payable by the assessee to an employee as bonus or commission for services rendered is allowable only if paid on or before the due date for furnishing return of income.',
    risk: 'MEDIUM',
    legalReference: 'Section 43B(c) and Payment of Bonus Act, 1965',
    source: 'Provision for Bonus / Gratuity Ledger',
    applicability: 'All employers',
    form3cdClause: '26',
    caroClause: 'N/A',
    evidenceRequired: [
      'Bonus computation register as per Payment of Bonus Act',
      'Bank statement verifying bonus disbursement date',
      'Form D annual return filed under Payment of Bonus Act'
    ],
    recommendation: 'Check whether bonus was disbursed prior to ITR filing deadline.',
    check: (tx: Transaction): RuleEvaluationResult => {
      const isBonus = tx.particulars.toLowerCase().includes('bonus provision') || 
                      tx.ledgerName.toLowerCase().includes('bonus payable');
      const amount = tx.credit > 0 ? tx.credit : (tx.debit > 0 ? tx.debit : (tx.netAmount ?? 0));
      if (isBonus && amount > 25000) {
        return {
          matched: true,
          note: `Bonus provision of ₹${amount.toLocaleString('en-IN')} requires verification of actual payment before ITR due date`,
          exposureAmount: amount
        };
      }
      return { matched: false };
    }
  },

  // 39. FEMA_FOREIGN_PAYMENT
  {
    id: 'FEMA_FOREIGN_PAYMENT',
    category: 'Labour Law & Statutory',
    title: 'Foreign Payment Requiring FEMA & Withholding Review',
    description: 'Remittances outside India must comply with Current Account Transaction Rules, Foreign Exchange Management Act (FEMA), LRS limits, and RBI Master Directions, along with Form 15CA/15CB.',
    risk: 'HIGH',
    legalReference: 'Foreign Exchange Management Act, 1999 (FEMA) and Section 195 of IT Act',
    source: 'Bank Outward Remittance / A2 Form',
    applicability: 'All entities executing cross-border payments',
    form3cdClause: '21(b)',
    caroClause: 'N/A',
    evidenceRequired: [
      'Form A2 and FEMA declaration submitted to Authorized Dealer (AD) bank',
      'Form 15CA and Form 15CB CA certification',
      'Import bill of entry (IDPMS) or invoice for service import'
    ],
    recommendation: 'Inspect AD Bank remittance advice and verify IDPMS closure for import payments.',
    check: (tx: Transaction): RuleEvaluationResult => {
      const isFema = tx.particulars.toLowerCase().includes('fema') ||
                     tx.particulars.toLowerCase().includes('outward remittance') ||
                     tx.particulars.toLowerCase().includes('foreign wire transfer');
      const amount = tx.debit > 0 ? tx.debit : (tx.netAmount ?? 0);
      if (isFema && amount > 0) {
        return {
          matched: true,
          note: `Cross-border outward remittance of ₹${amount.toLocaleString('en-IN')} requires FEMA compliance audit`,
          exposureAmount: amount
        };
      }
      return { matched: false };
    }
  },

  // 40. COMPANIES_ACT_134_FINANCIAL_CONTROLS
  {
    id: 'COMPANIES_ACT_134_FINANCIAL_CONTROLS',
    category: 'Companies Act',
    title: 'Internal Financial Controls Over Financial Reporting (IFCoFR)',
    description: 'Auditor must state in audit report under Section 143(3)(i) whether the company has adequate internal financial controls system in place and the operating effectiveness of such controls.',
    risk: 'MEDIUM',
    legalReference: 'Section 134(5)(e) and Section 143(3)(i) of Companies Act, 2013',
    source: 'Internal Financial Controls Framework',
    applicability: 'Companies other than exempt private small companies',
    form3cdClause: 'N/A',
    caroClause: 'N/A',
    evidenceRequired: [
      'Risk Control Matrix (RCM) for core business cycles (Procure-to-Pay, Order-to-Cash)',
      'Segregation of duties (SoD) review in ERP / Tally voucher entry and approval',
      'Management testing of key automated and manual financial controls'
    ],
    recommendation: 'Identify material weaknesses or significant deficiencies in voucher authorisation and journal posting controls.',
    check: (tx: Transaction): RuleEvaluationResult => {
      const isControlDeficiency = 
        tx.particulars.toLowerCase().includes('backdated voucher') ||
        tx.particulars.toLowerCase().includes('missing maker checker') ||
        tx.particulars.toLowerCase().includes('override of internal control');
      const amount = tx.debit > 0 ? tx.debit : (tx.netAmount ?? 0);
      if (isControlDeficiency) {
        return {
          matched: true,
          note: `Transaction of ₹${amount.toLocaleString('en-IN')} highlights internal control deficiency for IFC reporting`,
          exposureAmount: amount
        };
      }
      return { matched: false };
    }
  },

  // 41. COMPANIES_ACT_129_133_AS
  {
    id: 'COMPANIES_ACT_129_133_AS',
    category: 'Companies Act',
    title: 'Financial Statement Presentation & Accounting Standards Review (Schedule III / AS / Ind AS)',
    description: 'Financial statements must comply with Accounting Standards notified under Section 133 and present true and fair view in accordance with Schedule III division format.',
    risk: 'MEDIUM',
    legalReference: 'Section 129 and Section 133 of Companies Act, 2013 read with Schedule III',
    source: 'Trial Balance / Financial Statements',
    applicability: 'All Companies',
    form3cdClause: '13',
    caroClause: 'N/A',
    evidenceRequired: [
      'Current vs Non-current classification schedule for trade payables & receivables',
      'Disclosure of MSME dues, aging of trade receivables (undisputed vs disputed)',
      'Depreciation computation schedule as per Schedule II useful lives'
    ],
    recommendation: 'Review Schedule III disclosure notes and compliance with AS 1 / AS 9 / AS 15 / AS 18.',
    check: (tx: Transaction): RuleEvaluationResult => {
      const isAsIssue = tx.particulars.toLowerCase().includes('prior period item') ||
                        tx.particulars.toLowerCase().includes('unclassified current liability') ||
                        tx.particulars.toLowerCase().includes('schedule iii classification error');
      const amount = tx.debit > 0 ? tx.debit : (tx.credit > 0 ? tx.credit : (tx.netAmount ?? 0));
      if (isAsIssue && amount > 0) {
        return {
          matched: true,
          note: `Accounting standard classification issue of ₹${amount.toLocaleString('en-IN')} requiring Schedule III adjustment`,
          exposureAmount: amount
        };
      }
      return { matched: false };
    }
  },

  // 42. COMPANIES_ACT_148_COST_RECORDS
  {
    id: 'COMPANIES_ACT_148_COST_RECORDS',
    category: 'Companies Act',
    title: 'Cost Records Maintenance & Audit Applicability (Section 148)',
    description: 'Companies engaged in production of goods or providing services in regulated or non-regulated sectors exceeding prescribed turnover (₹35 Cr overall turnover) must maintain cost records in Form CRA-1.',
    risk: 'LOW',
    legalReference: 'Section 148 of Companies Act, 2013 read with Cost Records Rules',
    source: 'Manufacturing P&L / Cost Accounts',
    applicability: 'Manufacturing/mining entities crossing threshold limits',
    form3cdClause: 'N/A',
    caroClause: '3(vi)',
    evidenceRequired: [
      'Turnover statement classified by CTA / HSN chapters',
      'Form CRA-1 cost accounting records maintained in physical or electronic format',
      'Form CRA-2 appointment of cost auditor if applicable'
    ],
    recommendation: 'Confirm whether cost records are prescribed and maintained. Report under CARO Clause 3(vi).',
    check: (tx: Transaction, _allTx: Transaction[], config: AuditConfig): RuleEvaluationResult => {
      const isCompany = config.entityType === 'company';
      const isManufacturing = tx.parentGroup.toLowerCase().includes('direct expenses') ||
                              tx.parentGroup.toLowerCase().includes('manufacturing') ||
                              tx.particulars.toLowerCase().includes('raw material consumed');
      if (isCompany && isManufacturing && config.turnover >= 350000000) {
        // Sample check for cost record applicability
        if (tx.particulars.toLowerCase().includes('cost audit') || tx.particulars.toLowerCase().includes('cra-1')) {
          return {
            matched: true,
            note: 'Company turnover > ₹35 Cr in manufacturing triggers Section 148 cost records review & CARO 3(vi)',
            exposureAmount: 0
          };
        }
      }
      return { matched: false };
    }
  }
];
