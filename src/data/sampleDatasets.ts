import { Transaction, AuditConfig } from '../types';

export const CONFIG_MANUFACTURING: AuditConfig = {
  entityName: 'Vardhaman Precision Engineering Pvt Ltd',
  cinOrPan: 'U29253MH2014PTC259104 / AACCV9921K',
  financialYear: 'FY2024-25',
  lawVersion: 'IT_ACT_1961',
  taxForm: 'Form 3CA/3CD',
  entityType: 'company',
  accountingBasis: 'mercantile',
  turnover: 485000000, // ₹48.5 Cr
  netProfit: 38200000,  // ₹3.82 Cr
  caFirmName: 'K. R. Singhania & Associates, Chartered Accountants',
  caMembershipNo: '104829',
  udin: '24104829BKTYPW8291'
};

export const TRANSACTIONS_MANUFACTURING: Transaction[] = [
  // 1. 40A(3) Cash Payment > 10k
  {
    id: 'tx-001',
    date: '2024-05-14',
    voucherNo: 'CP-24-0108',
    voucherType: 'Payment',
    ledgerName: 'Cash Account',
    parentGroup: 'Cash-in-hand',
    particulars: 'Cash paid to Shrinath Fabrication Works for emergency machine repairs at plant',
    debit: 45000,
    credit: 0,
    paymentMode: 'Cash',
    partyPan: 'ABZPS4412M',
    invoiceRef: 'SFW/24/091',
    flags: ['CASH_OVER_10K']
  },
  // 2. 269SS Cash loan accepted >= 20k
  {
    id: 'tx-002',
    date: '2024-06-20',
    voucherNo: 'CR-24-0042',
    voucherType: 'Receipt',
    ledgerName: 'Cash Account',
    parentGroup: 'Cash-in-hand',
    particulars: 'Cash loan received from Smt. Savita Jain (Director Relative) for urgent working capital',
    debit: 0,
    credit: 75000,
    paymentMode: 'Cash',
    partyPan: 'AWVPJ5519R',
    partyType: 'Relative',
    flags: ['269SS_VIOLATION']
  },
  // 3. 269T Cash loan repayment >= 20k
  {
    id: 'tx-003',
    date: '2024-08-11',
    voucherNo: 'CP-24-0231',
    voucherType: 'Payment',
    ledgerName: 'Cash Account',
    parentGroup: 'Cash-in-hand',
    particulars: 'Cash repayment of unsecured loan to Shri Rameshwar Agarwal with interest',
    debit: 50000,
    credit: 0,
    paymentMode: 'Cash',
    partyPan: 'ABRPA1234F',
    partyType: 'Third Party',
    flags: ['269T_VIOLATION']
  },
  // 4. 269ST Cash receipt >= 2 Lakh
  {
    id: 'tx-004',
    date: '2024-09-05',
    voucherNo: 'CR-24-0112',
    voucherType: 'Receipt',
    ledgerName: 'Cash Account',
    parentGroup: 'Cash-in-hand',
    particulars: 'Cash counter sales receipt from Rajeshwari Metal Mart for scrap sale in single day',
    debit: 0,
    credit: 280000,
    paymentMode: 'Cash',
    partyPan: 'AAHPR8841P',
    invoiceRef: 'SCRAP/24/019',
    flags: ['269ST_VIOLATION']
  },
  // 5. IT_TDS_MISSING_SECTION - Professional fee without TDS
  {
    id: 'tx-005',
    date: '2024-07-18',
    voucherNo: 'BP-24-0842',
    voucherType: 'Payment',
    ledgerName: 'Legal & Professional Charges',
    parentGroup: 'Indirect Expenses',
    particulars: 'Legal consultation fee paid to LexJuris Associates without TDS deduction',
    debit: 120000,
    credit: 0,
    paymentMode: 'Bank',
    partyPan: 'AAFFL9012N',
    tdsSection: 'NONE',
    invoiceRef: 'LJ/INV/2024/77',
    flags: ['NO_TDS_DEDUCTED']
  },
  // 6. IT_TDS_40AIA_CANDIDATE - 30% disallowance
  {
    id: 'tx-006',
    date: '2024-09-28',
    voucherNo: 'JV-24-0419',
    voucherType: 'Journal',
    ledgerName: 'Management Consultancy Expenses',
    parentGroup: 'Indirect Expenses',
    particulars: 'Consultancy charges credited to Zenith Advisory (tds not deducted due to oversight)',
    debit: 350000,
    credit: 0,
    paymentMode: 'Journal',
    partyPan: 'AAHFZ6612Q',
    tdsSection: '',
    invoiceRef: 'ZA-9912',
    flags: ['DISALLOWANCE_40AIA']
  },
  // 7. IT_TDS_194C_CANDIDATE - Contractor payment
  {
    id: 'tx-007',
    date: '2024-06-12',
    voucherNo: 'BP-24-0518',
    voucherType: 'Payment',
    ledgerName: 'Contractor Expenses - Plant Maintenance',
    parentGroup: 'Direct Expenses',
    particulars: 'Factory shed fabrication and painting contract paid to Dynamic Infra Solutions',
    debit: 185000,
    credit: 0,
    paymentMode: 'Bank',
    partyPan: 'AAEFD5521B',
    invoiceRef: 'DIS/BILL/102',
    flags: ['194C_REVIEW']
  },
  // 8. IT_TDS_194H_CANDIDATE - Commission > 15k
  {
    id: 'tx-008',
    date: '2024-10-15',
    voucherNo: 'BP-24-1102',
    voucherType: 'Payment',
    ledgerName: 'Selling Agency Commission',
    parentGroup: 'Indirect Expenses',
    particulars: 'Commission paid to Mohanlal Brokerage for industrial land lease transaction',
    debit: 95000,
    credit: 0,
    paymentMode: 'Bank',
    partyPan: 'ABCPM8891D',
    invoiceRef: 'COMM/24-25/11',
    flags: ['194H_REVIEW']
  },
  // 9. IT_TDS_194I_CANDIDATE - Rent > 2.4L
  {
    id: 'tx-009',
    date: '2024-04-05',
    voucherNo: 'BP-24-0012',
    voucherType: 'Payment',
    ledgerName: 'Corporate Office Rent',
    parentGroup: 'Indirect Expenses',
    particulars: 'Corporate office rent paid to Landlord Shri Devendra Shah without 194I deduction',
    debit: 75000,
    credit: 0,
    paymentMode: 'Bank',
    partyPan: 'AAHPD3321C',
    invoiceRef: 'RENT/APR/2024',
    flags: ['194I_REVIEW']
  },
  // 10. IT_TDS_194Q_CANDIDATE - Bulk purchase > 50L
  {
    id: 'tx-010',
    date: '2024-11-20',
    voucherNo: 'PUR-24-0891',
    voucherType: 'Purchase',
    ledgerName: 'Raw Material - Alloy Steel Billets',
    parentGroup: 'Purchase Accounts',
    particulars: 'Bulk raw material purchased from Jindal Special Alloys Ltd without 194Q 0.1% TDS',
    debit: 7200000,
    credit: 0,
    paymentMode: 'Bank',
    partyPan: 'AAACJ1129K',
    gstin: '27AAACJ1129K1Z5',
    invoiceRef: 'JSAL/INV/9821',
    flags: ['194Q_REVIEW']
  },
  // 11. IT_TDS_194R_CANDIDATE - Dealer gift / perquisite > 20k
  {
    id: 'tx-011',
    date: '2024-10-29',
    voucherNo: 'BP-24-1194',
    voucherType: 'Payment',
    ledgerName: 'Business Promotion & Dealer Gifts',
    parentGroup: 'Indirect Expenses',
    particulars: 'Gold coins distributed as Diwali dealer incentive scheme gifts to top distributors',
    debit: 320000,
    credit: 0,
    paymentMode: 'Bank',
    partyPan: 'AAECG4412R',
    invoiceRef: 'JEWEL/901',
    flags: ['194R_REVIEW']
  },
  // 12. IT_TDS_195_CANDIDATE - Foreign remittance
  {
    id: 'tx-012',
    date: '2024-07-25',
    voucherNo: 'BP-24-0899',
    voucherType: 'Payment',
    ledgerName: 'Overseas Software & Server Cloud',
    parentGroup: 'Indirect Expenses',
    particulars: 'Wire transfer to Dassault SolidWorks GmbH for CAD engineering simulation cloud without Form 15CA/CB',
    debit: 480000,
    credit: 0,
    paymentMode: 'Bank',
    invoiceRef: 'DE-EUR-88129',
    flags: ['195_FOREIGN_TDS']
  },
  // 13. IT_43B_STATUTORY_DUES - Statutory dues unpaid
  {
    id: 'tx-013',
    date: '2025-03-31',
    voucherNo: 'JV-24-0892',
    voucherType: 'Journal',
    ledgerName: 'GST Output Tax Payable',
    parentGroup: 'Duties & Taxes',
    particulars: 'Year-end provision for disputed RCM & GST liability (statutory dues unpaid before ITR date)',
    debit: 0,
    credit: 640000,
    paymentMode: 'Journal',
    flags: ['43B_STATUTORY_DUES']
  },
  // 14. IT_40A7_GRATUITY - Unapproved gratuity provision
  {
    id: 'tx-014',
    date: '2025-03-31',
    voucherNo: 'JV-24-0904',
    voucherType: 'Journal',
    ledgerName: 'Gratuity Provision Account',
    parentGroup: 'Provisions',
    particulars: 'Book gratuity provision created on internal estimates (not contributed to approved fund)',
    debit: 850000,
    credit: 0,
    paymentMode: 'Journal',
    flags: ['40A7_GRATUITY']
  },
  // 15. IT_40A9_EMPLOYEE_FUND - Unapproved welfare fund
  {
    id: 'tx-015',
    date: '2024-12-14',
    voucherNo: 'BP-24-1402',
    voucherType: 'Payment',
    ledgerName: 'Staff Welfare Fund',
    parentGroup: 'Indirect Expenses',
    particulars: 'Contribution to unapproved staff welfare club society account',
    debit: 150000,
    credit: 0,
    paymentMode: 'Bank',
    flags: ['40A9_UNAPPROVED_FUND']
  },
  // 16. IT_PROHIBITED_EXPENSE_37 - Penalty / fine
  {
    id: 'tx-016',
    date: '2024-08-22',
    voucherNo: 'BP-24-0992',
    voucherType: 'Payment',
    ledgerName: 'Rates, Taxes & Penalties',
    parentGroup: 'Indirect Expenses',
    particulars: 'Environmental consent violation penalty paid to Maharashtra Pollution Control Board (MPCB)',
    debit: 175000,
    credit: 0,
    paymentMode: 'Bank',
    invoiceRef: 'MPCB/PEN/2024/441',
    flags: ['SECTION_37_PENALTY']
  },
  // 17. GST_MISSING_GSTIN - B2B purchase without GSTIN
  {
    id: 'tx-017',
    date: '2024-09-14',
    voucherNo: 'PUR-24-0612',
    voucherType: 'Purchase',
    ledgerName: 'Packaging Material Store',
    parentGroup: 'Direct Expenses',
    particulars: 'Corrugated cartons and wooden pallets purchased from Bharat Packing (unregistered dealer)',
    debit: 185000,
    credit: 0,
    paymentMode: 'Bank',
    gstin: '',
    invoiceRef: 'BP/24/099',
    flags: ['MISSING_GSTIN']
  },
  // 18. GST_ITC_BLOCKED_17_5 - Motor car & personal insurance
  {
    id: 'tx-018',
    date: '2024-07-09',
    voucherNo: 'BP-24-0711',
    voucherType: 'Payment',
    ledgerName: 'Motor Car Maintenance & Insurance',
    parentGroup: 'Indirect Expenses',
    particulars: 'Comprehensive insurance and luxury motor car repair expenses for Director Audi Sedan (ITC claimed)',
    debit: 140000,
    credit: 0,
    paymentMode: 'Bank',
    gstin: '27AAACG9912K1Z9',
    invoiceRef: 'ICICI/LOM/88219',
    flags: ['BLOCKED_ITC_17_5']
  },
  // 19. GST_RCM_CANDIDATE - GTA freight inward
  {
    id: 'tx-019',
    date: '2024-10-04',
    voucherNo: 'BP-24-1145',
    voucherType: 'Payment',
    ledgerName: 'Freight Inward - GTA Transporters',
    parentGroup: 'Direct Expenses',
    particulars: 'Road freight paid to National Goods Transport Agency without RCM GST discharge',
    debit: 195000,
    credit: 0,
    paymentMode: 'Bank',
    invoiceRef: 'NGTA/LR/8812',
    flags: ['RCM_LIABILITY']
  },
  // 20. GST_EWAY_BILL_REVIEW - Goods movement > 50k missing e-way bill
  {
    id: 'tx-020',
    date: '2024-11-15',
    voucherNo: 'SAL-24-0418',
    voucherType: 'Sales',
    ledgerName: 'Sales - Domestic Machined Components',
    parentGroup: 'Sales Accounts',
    particulars: 'Machined turbine flanges dispatched to Gujarat heavy engineering client without E-way bill',
    debit: 0,
    credit: 420000,
    paymentMode: 'Bank',
    gstin: '24AAACG1123P1ZA',
    invoiceRef: 'VPE/24-25/0819',
    ewayBill: '',
    flags: ['MISSING_EWAY_BILL']
  },
  // 21. GST_INVOICE_DATA_GAP - Missing invoice number
  {
    id: 'tx-021',
    date: '2024-12-05',
    voucherNo: 'PUR-24-0994',
    voucherType: 'Purchase',
    ledgerName: 'Store Consumables & Coolants',
    parentGroup: 'Direct Expenses',
    particulars: 'Industrial cutting lubricants purchased; vendor bill number not recorded in Tally entry',
    debit: 82000,
    credit: 0,
    paymentMode: 'Bank',
    gstin: '27AABCU8812F1Z3',
    invoiceRef: '',
    flags: ['INVOICE_DATA_GAP']
  },
  // 22. GST_RCM_IMPORT_SERVICE - Overseas cloud server
  {
    id: 'tx-022',
    date: '2024-08-30',
    voucherNo: 'BP-24-1002',
    voucherType: 'Payment',
    ledgerName: 'Overseas Cloud & Server Infrastructure',
    parentGroup: 'Indirect Expenses',
    particulars: 'Payment to AWS Inc for overseas server infrastructure (import of service requiring IGST RCM)',
    debit: 260000,
    credit: 0,
    paymentMode: 'Bank',
    flags: ['IMPORT_SERVICE_RCM']
  },
  // 23. COMPANIES_ACT_185_DIRECTOR_LOAN - Loan advance to director
  {
    id: 'tx-023',
    date: '2024-05-25',
    voucherNo: 'BP-24-0312',
    voucherType: 'Payment',
    ledgerName: 'Loans & Advances to Directors',
    parentGroup: 'Loans & Advances',
    particulars: 'Temporary advance given to Managing Director Shri Rajesh Vardhan without Board resolution',
    debit: 1500000,
    credit: 0,
    paymentMode: 'Bank',
    partyType: 'Director',
    flags: ['SECTION_185_VIOLATION']
  },
  // 24. COMPANIES_ACT_186_LOANS_INVESTMENTS - Inter-corporate loan
  {
    id: 'tx-024',
    date: '2024-09-18',
    voucherNo: 'BP-24-1055',
    voucherType: 'Payment',
    ledgerName: 'Inter-Corporate Loans - Vardhan Autotech LLP',
    parentGroup: 'Loans & Advances',
    particulars: 'Inter-corporate loan granted to group concern Vardhan Autotech without prior special resolution',
    debit: 6500000,
    credit: 0,
    paymentMode: 'Bank',
    partyType: 'Related Entity',
    flags: ['SECTION_186_REVIEW']
  },
  // 25. COMPANIES_ACT_188_RPT - Related party transaction
  {
    id: 'tx-025',
    date: '2024-10-10',
    voucherNo: 'PUR-24-0752',
    voucherType: 'Purchase',
    ledgerName: 'Purchases - Vardhan Casting Works',
    parentGroup: 'Purchase Accounts',
    particulars: 'Raw castings purchased from director partnership firm (related party transaction u/s 188)',
    debit: 2450000,
    credit: 0,
    paymentMode: 'Bank',
    partyPan: 'AAFFV9912A',
    gstin: '27AAFFV9912A1Z1',
    partyType: 'Related Entity',
    invoiceRef: 'VCW/24/318',
    flags: ['SECTION_188_RPT']
  },
  // 26. COMPANIES_ACT_184_INTEREST_DISCLOSURE - Director interest
  {
    id: 'tx-026',
    date: '2024-11-04',
    voucherNo: 'BP-24-1218',
    voucherType: 'Payment',
    ledgerName: 'Plant Warehousing Rent',
    parentGroup: 'Indirect Expenses',
    particulars: 'Warehouse rent paid to Vardhan Logistics (firm of director Shri Rajesh Vardhan) without MBP-1 record',
    debit: 180000,
    credit: 0,
    paymentMode: 'Bank',
    partyType: 'Director',
    flags: ['SECTION_184_DISCLOSURE']
  },
  // 27. COMPANIES_ACT_143_AUDIT - Prejudicial journal entry
  {
    id: 'tx-027',
    date: '2025-03-29',
    voucherNo: 'JV-24-0911',
    voucherType: 'Journal',
    ledgerName: 'General Administrative Suspense',
    parentGroup: 'Indirect Expenses',
    particulars: 'Adjustment of personal liabilities of promoter through book transfer without bank backing',
    debit: 350000,
    credit: 0,
    paymentMode: 'Journal',
    flags: ['SECTION_143_AUDIT']
  },
  // 28. COMPANIES_ACT_DEPOSITS_73 - Deemed deposit from third party
  {
    id: 'tx-028',
    date: '2024-07-14',
    voucherNo: 'BR-24-0419',
    voucherType: 'Receipt',
    ledgerName: 'Unsecured Loans from Third Parties',
    parentGroup: 'Unsecured Loans',
    particulars: 'Unsecured loan from non-director individual Shri Suresh Kothari (potential deemed deposit u/s 73)',
    debit: 0,
    credit: 1200000,
    paymentMode: 'Bank',
    partyType: 'Third Party',
    partyPan: 'ABJPK9921M',
    flags: ['DEEMED_DEPOSIT_73']
  },
  // 29. COMPANIES_ACT_CSR_135 - CSR transaction
  {
    id: 'tx-029',
    date: '2025-02-18',
    voucherNo: 'BP-24-1502',
    voucherType: 'Payment',
    ledgerName: 'Corporate Social Responsibility (CSR)',
    parentGroup: 'Indirect Expenses',
    particulars: 'CSR contribution for community technical training school (Schedule VII compliance review)',
    debit: 820000,
    credit: 0,
    paymentMode: 'Bank',
    invoiceRef: 'CSR/TR/2025/12',
    flags: ['CSR_SECTION_135']
  },
  // 30. CARO_2020_STATUTORY_DUES - Statutory dues > 6 months
  {
    id: 'tx-030',
    date: '2025-03-31',
    voucherNo: 'JV-24-0925',
    voucherType: 'Journal',
    ledgerName: 'GST Demand Arrears Under Dispute',
    parentGroup: 'Duties & Taxes',
    particulars: 'Undisputed GST balance outstanding > 6 months from due date awaiting appellate deposit',
    debit: 0,
    credit: 950000,
    paymentMode: 'Journal',
    flags: ['CARO_STATUTORY_DUES']
  },
  // 31. CARO_2020_LOANS_ADVANCES - Loans granted
  {
    id: 'tx-031',
    date: '2024-08-05',
    voucherNo: 'BP-24-0941',
    voucherType: 'Payment',
    ledgerName: 'Loans & Advances - Staff & Associates',
    parentGroup: 'Loans and Advances',
    particulars: 'Advance in nature of loan granted to associate vendor without fixed repayment schedule',
    debit: 600000,
    credit: 0,
    paymentMode: 'Bank',
    flags: ['CARO_LOANS_ADVANCES']
  },
  // 32. ACCOUNTING_PERSONAL_EXPENSE - Vacation travel
  {
    id: 'tx-032',
    date: '2024-06-28',
    voucherNo: 'BP-24-0604',
    voucherType: 'Payment',
    ledgerName: 'Travelling & Conveyance Expenses',
    parentGroup: 'Indirect Expenses',
    particulars: 'Director family vacation air tickets to Switzerland booked under overseas business development',
    debit: 420000,
    credit: 0,
    paymentMode: 'Bank',
    invoiceRef: 'MAKEMYTRIP/MMT9182',
    flags: ['PERSONAL_EXPENSE_37']
  },
  // 33. ACCOUNTING_ROUND_OFF_ANOMALY - Round sum JV
  {
    id: 'tx-033',
    date: '2025-03-30',
    voucherNo: 'JV-24-0919',
    voucherType: 'Journal',
    ledgerName: 'Factory Overheads General',
    parentGroup: 'Indirect Expenses',
    particulars: 'Round sum journal entry passed for general factory adjustments without bill particulars',
    debit: 500000,
    credit: 0,
    paymentMode: 'Journal',
    flags: ['ROUND_SUM_ANOMALY']
  },
  // 34. MSMED_INTEREST_DUE & 43B(h) - Delayed MSME payment > 45 days
  {
    id: 'tx-034',
    date: '2025-03-31',
    voucherNo: 'JV-24-0934',
    voucherType: 'Journal',
    ledgerName: 'Sundry Creditors - MSME Suppliers',
    parentGroup: 'Current Liabilities',
    particulars: 'Payable to Omkar Precision Tools (Micro Enterprise) delayed > 45 days (Sec 43B(h) disallowance & penal interest)',
    debit: 0,
    credit: 1480000,
    paymentMode: 'Journal',
    msmeType: 'Micro',
    msmePaymentDays: 78,
    partyPan: 'AAFCO8812J',
    flags: ['MSME_43BH_DELAYED']
  },
  // 35. PF_ESI_UNPAID_REVIEW - Belated PF deposit
  {
    id: 'tx-035',
    date: '2024-09-28',
    voucherNo: 'BP-24-1029',
    voucherType: 'Payment',
    ledgerName: 'Provident Fund Payable',
    parentGroup: 'Current Liabilities',
    particulars: 'Employees provident fund contribution for August 2024 deposited late (paid on 28th September vs 15th due date)',
    debit: 310000,
    credit: 0,
    paymentMode: 'Bank',
    invoiceRef: 'ECR/TRRN/2491028',
    flags: ['PF_BELATED_DISALLOWANCE']
  },
  // 36. BONUS_GRATUITY_PAYABLE - Bonus provision
  {
    id: 'tx-036',
    date: '2025-03-31',
    voucherNo: 'JV-24-0941',
    voucherType: 'Journal',
    ledgerName: 'Bonus Payable to Workers',
    parentGroup: 'Current Liabilities',
    particulars: 'Annual statutory bonus provision for shopfloor workers (actual payment due verification before ITR)',
    debit: 0,
    credit: 720000,
    paymentMode: 'Journal',
    flags: ['BONUS_PROVISION_43B']
  },
  // 37. FEMA_FOREIGN_PAYMENT - Outward remittance
  {
    id: 'tx-037',
    date: '2024-11-22',
    voucherNo: 'BP-24-1311',
    voucherType: 'Payment',
    ledgerName: 'Overseas Technical Consultancy',
    parentGroup: 'Indirect Expenses',
    particulars: 'Cross-border foreign wire transfer outward remittance to Tokyo Die Design Corp (FEMA A2 scrutiny)',
    debit: 620000,
    credit: 0,
    paymentMode: 'Bank',
    flags: ['FEMA_OUTWARD_REMITTANCE']
  },
  // 38. COMPANIES_ACT_134_FINANCIAL_CONTROLS - Backdated entry
  {
    id: 'tx-038',
    date: '2025-03-28',
    voucherNo: 'JV-24-0901',
    voucherType: 'Journal',
    ledgerName: 'Repairs & Maintenance Building',
    parentGroup: 'Indirect Expenses',
    particulars: 'Voucher posted without maker checker approval and backdated manual journal',
    debit: 115000,
    credit: 0,
    paymentMode: 'Journal',
    flags: ['IFC_DEFICIENCY']
  },
  // 39. COMPANIES_ACT_129_133_AS - Prior period item
  {
    id: 'tx-039',
    date: '2025-03-31',
    voucherNo: 'JV-24-0948',
    voucherType: 'Journal',
    ledgerName: 'Administrative Expenses',
    parentGroup: 'Indirect Expenses',
    particulars: 'Prior period item relating to FY2023-24 debited directly to current year revenue without AS 5 disclosure',
    debit: 210000,
    credit: 0,
    paymentMode: 'Journal',
    flags: ['AS_SCHEDULE_III_DISCLOSURE']
  },
  // 40. COMPANIES_ACT_148_COST_RECORDS - Cost audit
  {
    id: 'tx-040',
    date: '2024-09-30',
    voucherNo: 'PUR-24-0690',
    voucherType: 'Purchase',
    ledgerName: 'Raw Material Consumed - Forgings',
    parentGroup: 'Direct Expenses',
    particulars: 'Raw material consumed in manufacturing; requires CRA-1 cost audit record integration',
    debit: 4100000,
    credit: 0,
    paymentMode: 'Bank',
    flags: ['COST_RECORD_148']
  },
  // 41. Smurfing / Split Cash Anomaly A
  {
    id: 'tx-041',
    date: '2024-11-08',
    voucherNo: 'CP-24-0310',
    voucherType: 'Payment',
    ledgerName: 'Cash Account',
    parentGroup: 'Cash-in-hand',
    particulars: 'Cash paid to Sai Ram Hardware - Bill 1 for plant tools (split below ₹10k limit)',
    debit: 9800,
    credit: 0,
    paymentMode: 'Cash',
    partyPan: 'AAHPS4410K',
    flags: ['SMURFING_SPLIT']
  },
  // 42. Smurfing / Split Cash Anomaly B
  {
    id: 'tx-042',
    date: '2024-11-08',
    voucherNo: 'CP-24-0311',
    voucherType: 'Payment',
    ledgerName: 'Cash Account',
    parentGroup: 'Cash-in-hand',
    particulars: 'Cash paid to Sai Ram Hardware - Bill 2 for fasteners (split below ₹10k limit)',
    debit: 9600,
    credit: 0,
    paymentMode: 'Cash',
    partyPan: 'AAHPS4410K',
    flags: ['SMURFING_SPLIT']
  },
  // 43. Weekend Voucher Anomaly (Sunday posting)
  {
    id: 'tx-043',
    date: '2024-12-15', // Sunday
    voucherNo: 'JV-24-0718',
    voucherType: 'Journal',
    ledgerName: 'Miscellaneous Expenses',
    parentGroup: 'Indirect Expenses',
    particulars: 'Sundry petty expenses written off on Sunday weekend without operational register',
    debit: 88000,
    credit: 0,
    paymentMode: 'Journal',
    flags: ['WEEKEND_POSTING']
  },
  // 44. Normal Compliant Bank Transaction 1
  {
    id: 'tx-044',
    date: '2024-04-10',
    voucherNo: 'BP-24-0021',
    voucherType: 'Payment',
    ledgerName: 'State Bank of India - Current A/c',
    parentGroup: 'Bank Accounts',
    particulars: 'Statutory GST payment for March 2024 discharged through electronic cash ledger on time',
    debit: 1150000,
    credit: 0,
    paymentMode: 'Bank',
    invoiceRef: 'PMT-06-24901'
  },
  // 45. Normal Compliant Sales
  {
    id: 'tx-045',
    date: '2024-05-18',
    voucherNo: 'SAL-24-0104',
    voucherType: 'Sales',
    ledgerName: 'Sales - Export of Machined Parts',
    parentGroup: 'Sales Accounts',
    particulars: 'Export consignment to OEM partner in Germany under Letter of Undertaking (LUT)',
    debit: 0,
    credit: 4850000,
    paymentMode: 'Bank',
    ewayBill: '241199028192',
    invoiceRef: 'VPE/EXP/24/012'
  }
];

export const CONFIG_TRADING_LLP: AuditConfig = {
  entityName: 'Apex Global Logistics & Trading LLP',
  cinOrPan: 'AAP-9912 / AALFA8821N',
  financialYear: 'FY2025-26',
  lawVersion: 'IT_ACT_1961',
  taxForm: 'Form 3CB/3CD',
  entityType: 'llp',
  accountingBasis: 'mercantile',
  turnover: 242000000, // ₹24.2 Cr
  netProfit: 19500000,  // ₹1.95 Cr
  caFirmName: 'B. M. Chordia & Co, Chartered Accountants',
  caMembershipNo: '089412',
  udin: '25089412BMMK8819'
};

export const TRANSACTIONS_TRADING_LLP: Transaction[] = [
  {
    id: 'llp-001',
    date: '2025-06-14',
    voucherNo: 'CP-25-0018',
    voucherType: 'Payment',
    ledgerName: 'Cash Account',
    parentGroup: 'Cash-in-hand',
    particulars: 'Cash paid to Warehouse loader labourers in lump sum',
    debit: 38000,
    credit: 0,
    paymentMode: 'Cash',
    flags: ['CASH_OVER_10K']
  },
  {
    id: 'llp-002',
    date: '2025-07-20',
    voucherNo: 'BP-25-0210',
    voucherType: 'Payment',
    ledgerName: 'Partner Remuneration - Shri Anand Chordia',
    parentGroup: 'Partner Remuneration',
    particulars: 'Monthly partner salary debited in excess of Section 40(b) book profit ceiling',
    debit: 250000,
    credit: 0,
    paymentMode: 'Bank',
    partyType: 'Director',
    flags: ['40B_EXCESS']
  },
  {
    id: 'llp-003',
    date: '2025-09-12',
    voucherNo: 'BP-25-0489',
    voucherType: 'Payment',
    ledgerName: 'Commission to Clearing Agents',
    parentGroup: 'Indirect Expenses',
    particulars: 'Commission paid to SeaPort Clearing Agents without TDS deduction u/s 194H',
    debit: 82000,
    credit: 0,
    paymentMode: 'Bank',
    tdsSection: '',
    flags: ['194H_COMMISSION']
  },
  {
    id: 'llp-004',
    date: '2025-10-18',
    voucherNo: 'SAL-25-0145',
    voucherType: 'Sales',
    ledgerName: 'Sales - Domestic Distribution',
    parentGroup: 'Sales Accounts',
    particulars: 'Goods movement dispatched without generation of e-way bill',
    debit: 0,
    credit: 680000,
    paymentMode: 'Bank',
    ewayBill: '',
    gstin: '27AAHCA9912F1Z4',
    flags: ['MISSING_EWAY_BILL']
  },
  {
    id: 'llp-005',
    date: '2025-11-25',
    voucherNo: 'CR-25-0089',
    voucherType: 'Receipt',
    ledgerName: 'Cash Account',
    parentGroup: 'Cash-in-hand',
    particulars: 'Cash loan received from partner brother Shri Nitin Chordia',
    debit: 0,
    credit: 60000,
    paymentMode: 'Cash',
    partyType: 'Relative',
    flags: ['269SS_VIOLATION']
  }
];
