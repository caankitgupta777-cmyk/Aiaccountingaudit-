import { Transaction } from '../types';

export interface TallyXmlParseResult {
  success: boolean;
  transactions: Transaction[];
  companyName?: string;
  totalVouchers: number;
  totalDebit: number;
  totalCredit: number;
  warnings: string[];
  error?: string;
}

/**
 * Sanitizes raw XML text from Tally, stripping illegal character references and control characters.
 * Fixes W3C violation: xmlParseCharRef: invalid xmlChar value (e.g. &#4;)
 */
export function sanitizeTallyXml(raw: string): string {
  if (!raw) return '';
  let cleaned = raw;

  // 1. Strip UTF-8 Byte Order Mark (BOM)
  if (cleaned.charCodeAt(0) === 0xFEFF) {
    cleaned = cleaned.slice(1);
  }

  // 2. Remove invalid XML numeric character references (decimal & hex)
  // Valid XML 1.0 chars: #x9, #xA, #xD, [#x20-#xD7FF], [#xE000-#xFFFD], [#x10000-#x10FFFF]
  // Invalid decimal: &#0; to &#8;, &#11;, &#12;, &#14; to &#31;, &#127;
  cleaned = cleaned.replace(/&#0*(?:[0-8]|1[12]|1[4-9]|2[0-9]|3[01]|127);/gi, ' ');
  // Invalid hex: &#x0; to &#x8;, &#xb;, &#xc;, &#xe; to &#x1f;, &#x7f;
  cleaned = cleaned.replace(/&#x0*(?:[0-8]|[bB]|[cC]|[eE]|[fF]|1[0-9a-fA-F]|7[fF]);/gi, ' ');

  // 3. Remove literal ASCII control characters (0x00 - 0x1F except \t (0x09), \n (0x0A), \r (0x0D)) and 0x7F
  cleaned = cleaned.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, ' ');

  // 4. Sanitize rogue ampersands that are not valid entity references
  // e.g., "M/S RAM & SONS" or "P&L A/C" -> "M/S RAM &amp; SONS"
  cleaned = cleaned.replace(/&(?!amp;|lt;|gt;|quot;|apos;|#\d+;|#x[0-9a-fA-F]+;)/g, '&amp;');

  return cleaned;
}

/**
 * Normalizes Tally dates (e.g. '20240514', '14-05-2024', '14-May-2024') into 'YYYY-MM-DD'.
 */
function parseTallyDate(rawDate: string): string {
  if (!rawDate) return new Date().toISOString().split('T')[0];
  const cleaned = rawDate.trim();

  // YYYYMMDD format (e.g. 20240514)
  if (/^\d{8}$/.test(cleaned)) {
    const y = cleaned.substring(0, 4);
    const m = cleaned.substring(4, 6);
    const d = cleaned.substring(6, 8);
    return `${y}-${m}-${d}`;
  }

  // YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(cleaned)) {
    return cleaned;
  }

  // DD/MM/YYYY or DD-MM-YYYY
  if (/^\d{1,2}[-/]\d{1,2}[-/]\d{4}$/.test(cleaned)) {
    const parts = cleaned.split(/[-/]/);
    const d = parts[0].padStart(2, '0');
    const m = parts[1].padStart(2, '0');
    const y = parts[2];
    return `${y}-${m}-${d}`;
  }

  // Parse using Date constructor
  const parsed = new Date(cleaned);
  if (!isNaN(parsed.getTime())) {
    return parsed.toISOString().split('T')[0];
  }

  return cleaned;
}

/**
 * Infers parent accounting group based on ledger name or context
 */
function inferParentGroup(ledgerName: string, voucherType: string): string {
  const name = ledgerName.toLowerCase();
  if (name.includes('cash')) return 'Cash-in-hand';
  if (name.includes('bank') || name.includes('sbi') || name.includes('hdfc') || name.includes('icici')) return 'Bank Accounts';
  if (name.includes('gst') || name.includes('tax') || name.includes('tds') || name.includes('pf') || name.includes('esi')) return 'Duties & Taxes';
  if (name.includes('salary') || name.includes('rent') || name.includes('repair') || name.includes('conveyance') || name.includes('advert') || name.includes('legal') || name.includes('consult')) return 'Indirect Expenses';
  if (name.includes('freight') || name.includes('wage') || name.includes('power') || name.includes('fuel')) return 'Direct Expenses';
  if (name.includes('purchase') || name.includes('raw material')) return 'Purchase Accounts';
  if (name.includes('sales') || name.includes('revenue')) return 'Sales Accounts';
  if (name.includes('director loan') || name.includes('inter-corporate')) return 'Loans & Advances';
  if (name.includes('capital') || name.includes('drawings')) return 'Capital Account';
  if (name.includes('loan') || name.includes('unsecured')) return 'Unsecured Loans';
  
  if (voucherType === 'Purchase' || voucherType === 'Payment') return 'Sundry Creditors';
  if (voucherType === 'Sales' || voucherType === 'Receipt') return 'Sundry Debtors';
  return 'Current Assets';
}

/**
 * Parses Tally XML string using dual-stage parsing:
 * 1. Sanitization (fixes invalid xmlChar values e.g. &#4;)
 * 2. Standard DOMParser
 * 3. Resilient Regular Expression Tag Extractor fallback if DOMParser errors
 */
export function parseTallyXml(xmlString: string): TallyXmlParseResult {
  const warnings: string[] = [];

  // Step 1: Pre-sanitize XML to remove invalid character references like &#4;
  const sanitizedXml = sanitizeTallyXml(xmlString);

  // Step 2: Try DOMParser
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(sanitizedXml, 'text/xml');
    const parserError = doc.querySelector('parsererror');

    if (!parserError) {
      // Try extracting company name
      let companyName: string | undefined;
      const companyElem = doc.querySelector('SVCURRENTCOMPANY, COMPANY, COMPANYNAME');
      if (companyElem && companyElem.textContent?.trim()) {
        companyName = companyElem.textContent.trim();
      }

      // Find all <VOUCHER> nodes
      const voucherNodes = doc.querySelectorAll('VOUCHER');
      if (voucherNodes.length > 0) {
        const transactions: Transaction[] = [];
        let runningDebit = 0;
        let runningCredit = 0;

        voucherNodes.forEach((vNode, index) => {
          const rawDate = vNode.querySelector('DATE')?.textContent || '';
          const date = parseTallyDate(rawDate);

          const voucherNo = 
            vNode.querySelector('VOUCHERNUMBER, VCHNUM, VOUCHERNO')?.textContent?.trim() || 
            vNode.getAttribute('VCHNUM') || 
            `VCH-${index + 1}`;

          const rawType = 
            vNode.querySelector('VOUCHERTYPENAME, VCHTYPE')?.textContent?.trim() || 
            vNode.getAttribute('VCHTYPE') || 
            'Journal';
          
          let voucherType: Transaction['voucherType'] = 'Journal';
          const typeLower = rawType.toLowerCase();
          if (typeLower.includes('payment')) voucherType = 'Payment';
          else if (typeLower.includes('receipt')) voucherType = 'Receipt';
          else if (typeLower.includes('sales')) voucherType = 'Sales';
          else if (typeLower.includes('purchase')) voucherType = 'Purchase';
          else if (typeLower.includes('contra')) voucherType = 'Contra';
          else voucherType = 'Journal';

          const narration = vNode.querySelector('NARRATION')?.textContent?.trim() || '';
          const partyLedger = vNode.querySelector('PARTYLEDGERNAME')?.textContent?.trim() || '';
          const partyGstin = vNode.querySelector('PARTYGSTIN, GSTIN, BUYERGSTIN')?.textContent?.trim() || '';
          const partyPan = vNode.querySelector('PARTYPAN, INCOMETAXNUMBER, PAN')?.textContent?.trim() || '';
          const ewayBill = vNode.querySelector('EWAYBILLNO, EWBNO, BILLOFLADINGNO')?.textContent?.trim() || '';
          const invoiceRef = vNode.querySelector('REFERENCE, INVOICENUMBER, BILLNUM')?.textContent?.trim() || '';

          const ledgerEntryNodes = vNode.querySelectorAll('ALLLEDGERENTRIES\\.LIST, LEDGERENTRIES\\.LIST');
          
          let totalVoucherDebit = 0;
          let totalVoucherCredit = 0;
          let detectedMode: Transaction['paymentMode'] = 'Journal';

          interface LedgerEntry {
            name: string;
            amount: number;
            isDeemedPositive: boolean;
          }

          const entries: LedgerEntry[] = [];

          for (const lNode of Array.from(ledgerEntryNodes)) {
            const lName = lNode.querySelector('LEDGERNAME')?.textContent?.trim() || 'General';
            const rawAmt = parseFloat(lNode.querySelector('AMOUNT')?.textContent?.trim() || '0');
            const deemedPos = (lNode.querySelector('ISDEEMEDPOSITIVE')?.textContent?.trim() || '').toLowerCase() === 'yes';

            if (lName.toLowerCase().includes('cash')) {
              detectedMode = 'Cash';
            } else if (
              lName.toLowerCase().includes('bank') || 
              lName.toLowerCase().includes('sbi') || 
              lName.toLowerCase().includes('hdfc') || 
              lName.toLowerCase().includes('icici')
            ) {
              detectedMode = 'Bank';
            }

            const isDebit = deemedPos || rawAmt < 0;
            const absAmt = Math.abs(rawAmt);

            if (isDebit) {
              totalVoucherDebit += absAmt;
            } else {
              totalVoucherCredit += absAmt;
            }

            entries.push({
              name: lName,
              amount: absAmt,
              isDeemedPositive: isDebit
            });
          }

          let finalLedger = partyLedger;
          let finalDebit = 0;
          let finalCredit = 0;

          if (entries.length > 0) {
            const nonCashBank = entries.filter(e => 
              !e.name.toLowerCase().includes('cash') && 
              !e.name.toLowerCase().includes('bank')
            );

            if (nonCashBank.length > 0) {
              finalLedger = nonCashBank[0].name;
              if (voucherType === 'Payment' || voucherType === 'Purchase') {
                finalDebit = nonCashBank[0].amount;
              } else if (voucherType === 'Receipt' || voucherType === 'Sales') {
                finalCredit = nonCashBank[0].amount;
              } else {
                if (nonCashBank[0].isDeemedPositive) {
                  finalDebit = nonCashBank[0].amount;
                } else {
                  finalCredit = nonCashBank[0].amount;
                }
              }
            } else {
              finalLedger = entries[0].name;
              if (entries[0].isDeemedPositive) finalDebit = entries[0].amount;
              else finalCredit = entries[0].amount;
            }
          }

          if (finalDebit === 0 && finalCredit === 0) {
            if (voucherType === 'Payment' || voucherType === 'Purchase') {
              finalDebit = totalVoucherDebit || totalVoucherCredit;
            } else {
              finalCredit = totalVoucherCredit || totalVoucherDebit;
            }
          }

          const flags: string[] = [];
          if (detectedMode === 'Cash' && finalDebit > 10000 && (voucherType === 'Payment' || voucherType === 'Purchase')) {
            flags.push('CASH_OVER_10K');
          }
          if (detectedMode === 'Cash' && finalCredit >= 20000 && (narration.toLowerCase().includes('loan') || finalLedger.toLowerCase().includes('loan'))) {
            flags.push('269SS_VIOLATION');
          }
          if (detectedMode === 'Cash' && finalDebit >= 20000 && (narration.toLowerCase().includes('loan') || finalLedger.toLowerCase().includes('loan'))) {
            flags.push('269T_VIOLATION');
          }
          if (detectedMode === 'Cash' && finalCredit >= 200000) {
            flags.push('269ST_VIOLATION');
          }

          runningDebit += finalDebit;
          runningCredit += finalCredit;

          transactions.push({
            id: `tally-xml-${index + 1}`,
            date,
            voucherNo,
            voucherType,
            ledgerName: finalLedger || 'General Ledger',
            parentGroup: inferParentGroup(finalLedger, voucherType),
            particulars: narration || `${voucherType} Voucher #${voucherNo}`,
            debit: finalDebit,
            credit: finalCredit,
            netAmount: finalDebit > 0 ? finalDebit : finalCredit,
            paymentMode: detectedMode,
            partyPan: partyPan || undefined,
            gstin: partyGstin || undefined,
            ewayBill: ewayBill || undefined,
            invoiceRef: invoiceRef || undefined,
            flags: flags.length > 0 ? flags : undefined
          });
        });

        return {
          success: true,
          transactions,
          companyName,
          totalVouchers: transactions.length,
          totalDebit: runningDebit,
          totalCredit: runningCredit,
          warnings
        };
      }
    }
  } catch (err: any) {
    // Fall through to resilient regex fallback
  }

  // Step 3: Resilient Regular Expression Parser Fallback
  // Handles severely malformed XML, unclosed tags, or unparseable entities
  return parseTallyXmlWithRegex(sanitizedXml);
}

/**
 * Resilient regex tag-extractor for Tally XML dumps that fail strict XML DOM parsing.
 */
function parseTallyXmlWithRegex(xml: string): TallyXmlParseResult {
  const warnings: string[] = [];

  // Extract company name
  const compMatch = xml.match(/<(?:SVCURRENTCOMPANY|COMPANY|COMPANYNAME)[^>]*>([^<]+)<\/(?:SVCURRENTCOMPANY|COMPANY|COMPANYNAME)>/i);
  const companyName = compMatch ? compMatch[1].trim() : undefined;

  // Extract all <VOUCHER ...> ... </VOUCHER> blocks
  const voucherRegex = /<VOUCHER\b([^>]*)>([\s\S]*?)<\/VOUCHER>/gi;
  let match: RegExpExecArray | null;
  const transactions: Transaction[] = [];
  let runningDebit = 0;
  let runningCredit = 0;
  let index = 0;

  while ((match = voucherRegex.exec(xml)) !== null) {
    index++;
    const vAttrs = match[1] || '';
    const vContent = match[2] || '';

    // Extract Date
    const dateMatch = vContent.match(/<DATE>([^<]+)<\/DATE>/i);
    const date = parseTallyDate(dateMatch ? dateMatch[1] : '');

    // Extract Voucher No
    const vNoMatch = vContent.match(/<(?:VOUCHERNUMBER|VCHNUM|VOUCHERNO)>([^<]+)<\/(?:VOUCHERNUMBER|VCHNUM|VOUCHERNO)>/i);
    const vNoAttrMatch = vAttrs.match(/VCHNUM="([^"]+)"/i);
    const voucherNo = (vNoMatch ? vNoMatch[1] : (vNoAttrMatch ? vNoAttrMatch[1] : `VCH-${index}`)).trim();

    // Extract Voucher Type
    const vTypeMatch = vContent.match(/<(?:VOUCHERTYPENAME|VCHTYPE)>([^<]+)<\/(?:VOUCHERTYPENAME|VCHTYPE)>/i);
    const vTypeAttrMatch = vAttrs.match(/VCHTYPE="([^"]+)"/i);
    const rawType = (vTypeMatch ? vTypeMatch[1] : (vTypeAttrMatch ? vTypeAttrMatch[1] : 'Journal')).trim();

    let voucherType: Transaction['voucherType'] = 'Journal';
    const typeLower = rawType.toLowerCase();
    if (typeLower.includes('payment')) voucherType = 'Payment';
    else if (typeLower.includes('receipt')) voucherType = 'Receipt';
    else if (typeLower.includes('sales')) voucherType = 'Sales';
    else if (typeLower.includes('purchase')) voucherType = 'Purchase';
    else if (typeLower.includes('contra')) voucherType = 'Contra';

    // Metadata
    const narrMatch = vContent.match(/<NARRATION>([^<]+)<\/NARRATION>/i);
    const narration = narrMatch ? narrMatch[1].trim() : '';

    const partyMatch = vContent.match(/<PARTYLEDGERNAME>([^<]+)<\/PARTYLEDGERNAME>/i);
    const partyLedger = partyMatch ? partyMatch[1].trim() : '';

    const gstinMatch = vContent.match(/<(?:PARTYGSTIN|GSTIN|BUYERGSTIN)>([^<]+)<\/(?:PARTYGSTIN|GSTIN|BUYERGSTIN)>/i);
    const partyGstin = gstinMatch ? gstinMatch[1].trim() : '';

    const panMatch = vContent.match(/<(?:PARTYPAN|INCOMETAXNUMBER|PAN)>([^<]+)<\/(?:PARTYPAN|INCOMETAXNUMBER|PAN)>/i);
    const partyPan = panMatch ? panMatch[1].trim() : '';

    const ewbMatch = vContent.match(/<(?:EWAYBILLNO|EWBNO|BILLOFLADINGNO)>([^<]+)<\/(?:EWAYBILLNO|EWBNO|BILLOFLADINGNO)>/i);
    const ewayBill = ewbMatch ? ewbMatch[1].trim() : '';

    const refMatch = vContent.match(/<(?:REFERENCE|INVOICENUMBER|BILLNUM)>([^<]+)<\/(?:REFERENCE|INVOICENUMBER|BILLNUM)>/i);
    const invoiceRef = refMatch ? refMatch[1].trim() : '';

    // Extract Ledger entries
    const ledgerListRegex = /<(?:ALLLEDGERENTRIES\.LIST|LEDGERENTRIES\.LIST)[^>]*>([\s\S]*?)<\/(?:ALLLEDGERENTRIES\.LIST|LEDGERENTRIES\.LIST)>/gi;
    let lMatch: RegExpExecArray | null;

    let totalVoucherDebit = 0;
    let totalVoucherCredit = 0;
    let detectedMode: Transaction['paymentMode'] = 'Journal';

    interface Entry {
      name: string;
      amount: number;
      isDebit: boolean;
    }
    const entries: Entry[] = [];

    while ((lMatch = ledgerListRegex.exec(vContent)) !== null) {
      const lBlock = lMatch[1];
      const nameM = lBlock.match(/<LEDGERNAME>([^<]+)<\/LEDGERNAME>/i);
      const lName = nameM ? nameM[1].trim() : 'General';

      const amtM = lBlock.match(/<AMOUNT>([^<]+)<\/AMOUNT>/i);
      const rawAmt = amtM ? parseFloat(amtM[1].trim()) || 0 : 0;

      const posM = lBlock.match(/<ISDEEMEDPOSITIVE>([^<]+)<\/ISDEEMEDPOSITIVE>/i);
      const deemedPos = posM ? posM[1].trim().toLowerCase() === 'yes' : false;

      if (lName.toLowerCase().includes('cash')) {
        detectedMode = 'Cash';
      } else if (
        lName.toLowerCase().includes('bank') || 
        lName.toLowerCase().includes('sbi') || 
        lName.toLowerCase().includes('hdfc') || 
        lName.toLowerCase().includes('icici')
      ) {
        detectedMode = 'Bank';
      }

      const isDebit = deemedPos || rawAmt < 0;
      const absAmt = Math.abs(rawAmt);

      if (isDebit) totalVoucherDebit += absAmt;
      else totalVoucherCredit += absAmt;

      entries.push({
        name: lName,
        amount: absAmt,
        isDebit
      });
    }

    let finalLedger = partyLedger;
    let finalDebit = 0;
    let finalCredit = 0;

    if (entries.length > 0) {
      const nonCashBank = entries.filter(e => 
        !e.name.toLowerCase().includes('cash') && 
        !e.name.toLowerCase().includes('bank')
      );

      if (nonCashBank.length > 0) {
        finalLedger = nonCashBank[0].name;
        if (voucherType === 'Payment' || voucherType === 'Purchase') {
          finalDebit = nonCashBank[0].amount;
        } else if (voucherType === 'Receipt' || voucherType === 'Sales') {
          finalCredit = nonCashBank[0].amount;
        } else {
          if (nonCashBank[0].isDebit) finalDebit = nonCashBank[0].amount;
          else finalCredit = nonCashBank[0].amount;
        }
      } else {
        finalLedger = entries[0].name;
        if (entries[0].isDebit) finalDebit = entries[0].amount;
        else finalCredit = entries[0].amount;
      }
    }

    if (finalDebit === 0 && finalCredit === 0) {
      if (voucherType === 'Payment' || voucherType === 'Purchase') {
        finalDebit = totalVoucherDebit || totalVoucherCredit;
      } else {
        finalCredit = totalVoucherCredit || totalVoucherDebit;
      }
    }

    const flags: string[] = [];
    if (detectedMode === 'Cash' && finalDebit > 10000 && (voucherType === 'Payment' || voucherType === 'Purchase')) {
      flags.push('CASH_OVER_10K');
    }
    if (detectedMode === 'Cash' && finalCredit >= 20000 && (narration.toLowerCase().includes('loan') || finalLedger.toLowerCase().includes('loan'))) {
      flags.push('269SS_VIOLATION');
    }
    if (detectedMode === 'Cash' && finalDebit >= 20000 && (narration.toLowerCase().includes('loan') || finalLedger.toLowerCase().includes('loan'))) {
      flags.push('269T_VIOLATION');
    }
    if (detectedMode === 'Cash' && finalCredit >= 200000) {
      flags.push('269ST_VIOLATION');
    }

    runningDebit += finalDebit;
    runningCredit += finalCredit;

    transactions.push({
      id: `tally-xml-fb-${index}`,
      date,
      voucherNo,
      voucherType,
      ledgerName: finalLedger || 'General Ledger',
      parentGroup: inferParentGroup(finalLedger, voucherType),
      particulars: narration || `${voucherType} Voucher #${voucherNo}`,
      debit: finalDebit,
      credit: finalCredit,
      netAmount: finalDebit > 0 ? finalDebit : finalCredit,
      paymentMode: detectedMode,
      partyPan: partyPan || undefined,
      gstin: partyGstin || undefined,
      ewayBill: ewayBill || undefined,
      invoiceRef: invoiceRef || undefined,
      flags: flags.length > 0 ? flags : undefined
    });
  }

  if (transactions.length === 0) {
    return {
      success: false,
      transactions: [],
      totalVouchers: 0,
      totalDebit: 0,
      totalCredit: 0,
      warnings,
      error: 'No <VOUCHER> tags could be recovered from the XML file. Please verify that this file contains exported Tally vouchers.'
    };
  }

  warnings.push('Sanitized invalid XML character references (e.g. &#4;) and successfully recovered vouchers using resilient Tally parser.');

  return {
    success: true,
    transactions,
    companyName,
    totalVouchers: transactions.length,
    totalDebit: runningDebit,
    totalCredit: runningCredit,
    warnings
  };
}

/**
 * Provides a ready-to-use sample Tally Daybook XML string for test demonstrations.
 */
export const SAMPLE_TALLY_XML = `<?xml version="1.0" encoding="utf-8"?>
<ENVELOPE>
  <HEADER>
    <TALLYREQUEST>Export Data</TALLYREQUEST>
  </HEADER>
  <BODY>
    <IMPORTDATA>
      <REQUESTDATA>
        <SVCURRENTCOMPANY>Shree Mahavir Industrial Works Pvt Ltd</SVCURRENTCOMPANY>
        <TALLYMESSAGE xmlns:UDF="TallyUDF">
          <VOUCHER VCHTYPE="Payment" ACTION="Create" OBJVIEW="Accounting Voucher View">
            <DATE>20240518</DATE>
            <VOUCHERTYPENAME>Payment</VOUCHERTYPENAME>
            <VOUCHERNUMBER>CP-24-0091</VOUCHERNUMBER>
            <NARRATION>Cash payment for urgent factory machinery repair</NARRATION>
            <PARTYLEDGERNAME>Ganesh Engineering Works</PARTYLEDGERNAME>
            <PARTYPAN>AAFFG9912K</PARTYPAN>
            <ALLLEDGERENTRIES.LIST>
              <LEDGERNAME>Cash Account</LEDGERNAME>
              <ISDEEMEDPOSITIVE>No</ISDEEMEDPOSITIVE>
              <AMOUNT>28500.00</AMOUNT>
            </ALLLEDGERENTRIES.LIST>
            <ALLLEDGERENTRIES.LIST>
              <LEDGERNAME>Machinery Repairs &amp; Maintenance</LEDGERNAME>
              <ISDEEMEDPOSITIVE>Yes</ISDEEMEDPOSITIVE>
              <AMOUNT>-28500.00</AMOUNT>
            </ALLLEDGERENTRIES.LIST>
          </VOUCHER>

          <VOUCHER VCHTYPE="Receipt" ACTION="Create" OBJVIEW="Accounting Voucher View">
            <DATE>20240612</DATE>
            <VOUCHERTYPENAME>Receipt</VOUCHERTYPENAME>
            <VOUCHERNUMBER>CR-24-0034</VOUCHERNUMBER>
            <NARRATION>Cash loan accepted from Director Relative Smt Meena Shah</NARRATION>
            <PARTYLEDGERNAME>Meena Shah - Unsecured Loan</PARTYLEDGERNAME>
            <PARTYPAN>ABMPS4412R</PARTYPAN>
            <ALLLEDGERENTRIES.LIST>
              <LEDGERNAME>Cash Account</LEDGERNAME>
              <ISDEEMEDPOSITIVE>Yes</ISDEEMEDPOSITIVE>
              <AMOUNT>-65000.00</AMOUNT>
            </ALLLEDGERENTRIES.LIST>
            <ALLLEDGERENTRIES.LIST>
              <LEDGERNAME>Unsecured Loans from Relatives</LEDGERNAME>
              <ISDEEMEDPOSITIVE>No</ISDEEMEDPOSITIVE>
              <AMOUNT>65000.00</AMOUNT>
            </ALLLEDGERENTRIES.LIST>
          </VOUCHER>

          <VOUCHER VCHTYPE="Payment" ACTION="Create" OBJVIEW="Accounting Voucher View">
            <DATE>20240722</DATE>
            <VOUCHERTYPENAME>Payment</VOUCHERTYPENAME>
            <VOUCHERNUMBER>BP-24-0511</VOUCHERNUMBER>
            <NARRATION>Legal retainer fees paid to Adv. K. R. Raman without TDS deduction</NARRATION>
            <PARTYLEDGERNAME>Legal &amp; Professional Charges</PARTYLEDGERNAME>
            <PARTYPAN>AAFFR1234N</PARTYPAN>
            <INVOICENUMBER>ADV/24/09</INVOICENUMBER>
            <ALLLEDGERENTRIES.LIST>
              <LEDGERNAME>HDFC Bank Current A/c</LEDGERNAME>
              <ISDEEMEDPOSITIVE>No</ISDEEMEDPOSITIVE>
              <AMOUNT>95000.00</AMOUNT>
            </ALLLEDGERENTRIES.LIST>
            <ALLLEDGERENTRIES.LIST>
              <LEDGERNAME>Legal &amp; Professional Fees</LEDGERNAME>
              <ISDEEMEDPOSITIVE>Yes</ISDEEMEDPOSITIVE>
              <AMOUNT>-95000.00</AMOUNT>
            </ALLLEDGERENTRIES.LIST>
          </VOUCHER>

          <VOUCHER VCHTYPE="Purchase" ACTION="Create" OBJVIEW="Accounting Voucher View">
            <DATE>20240815</DATE>
            <VOUCHERTYPENAME>Purchase</VOUCHERTYPENAME>
            <VOUCHERNUMBER>PUR-24-0312</VOUCHERNUMBER>
            <NARRATION>Bulk stainless steel sheets purchase without 194Q TDS deduction</NARRATION>
            <PARTYLEDGERNAME>Jindal Stainless Steel Mart</PARTYLEDGERNAME>
            <PARTYGSTIN>27AAACJ8891P1ZX</PARTYGSTIN>
            <PARTYPAN>AAACJ8891P</PARTYPAN>
            <INVOICENUMBER>JSS/24-25/891</INVOICENUMBER>
            <ALLLEDGERENTRIES.LIST>
              <LEDGERNAME>Raw Material Purchases</LEDGERNAME>
              <ISDEEMEDPOSITIVE>Yes</ISDEEMEDPOSITIVE>
              <AMOUNT>-5800000.00</AMOUNT>
            </ALLLEDGERENTRIES.LIST>
            <ALLLEDGERENTRIES.LIST>
              <LEDGERNAME>Jindal Stainless Steel Mart</LEDGERNAME>
              <ISDEEMEDPOSITIVE>No</ISDEEMEDPOSITIVE>
              <AMOUNT>5800000.00</AMOUNT>
            </ALLLEDGERENTRIES.LIST>
          </VOUCHER>

          <VOUCHER VCHTYPE="Sales" ACTION="Create" OBJVIEW="Accounting Voucher View">
            <DATE>20240920</DATE>
            <VOUCHERTYPENAME>Sales</VOUCHERTYPENAME>
            <VOUCHERNUMBER>SAL-24-0419</VOUCHERNUMBER>
            <NARRATION>Dispatch of industrial fabricated components</NARRATION>
            <PARTYLEDGERNAME>Gujarat Auto Components Ltd</PARTYLEDGERNAME>
            <PARTYGSTIN>24AABCG1234F1Z8</PARTYGSTIN>
            <EWAYBILLNO>241199048192</EWAYBILLNO>
            <INVOICENUMBER>SM/24-25/419</INVOICENUMBER>
            <ALLLEDGERENTRIES.LIST>
              <LEDGERNAME>Gujarat Auto Components Ltd</LEDGERNAME>
              <ISDEEMEDPOSITIVE>Yes</ISDEEMEDPOSITIVE>
              <AMOUNT>-840000.00</AMOUNT>
            </ALLLEDGERENTRIES.LIST>
            <ALLLEDGERENTRIES.LIST>
              <LEDGERNAME>Sales - Domestic</LEDGERNAME>
              <ISDEEMEDPOSITIVE>No</ISDEEMEDPOSITIVE>
              <AMOUNT>840000.00</AMOUNT>
            </ALLLEDGERENTRIES.LIST>
          </VOUCHER>

          <VOUCHER VCHTYPE="Payment" ACTION="Create" OBJVIEW="Accounting Voucher View">
            <DATE>20241010</DATE>
            <VOUCHERTYPENAME>Payment</VOUCHERTYPENAME>
            <VOUCHERNUMBER>BP-24-0718</VOUCHERNUMBER>
            <NARRATION>Comprehensive insurance of Director personal luxury car debited to P&amp;L</NARRATION>
            <PARTYLEDGERNAME>Motor Car Maintenance &amp; Insurance</PARTYLEDGERNAME>
            <INVOICENUMBER>INS/2024/781</INVOICENUMBER>
            <ALLLEDGERENTRIES.LIST>
              <LEDGERNAME>State Bank of India</LEDGERNAME>
              <ISDEEMEDPOSITIVE>No</ISDEEMEDPOSITIVE>
              <AMOUNT>165000.00</AMOUNT>
            </ALLLEDGERENTRIES.LIST>
            <ALLLEDGERENTRIES.LIST>
              <LEDGERNAME>Motor Car Maintenance &amp; Insurance</LEDGERNAME>
              <ISDEEMEDPOSITIVE>Yes</ISDEEMEDPOSITIVE>
              <AMOUNT>-165000.00</AMOUNT>
            </ALLLEDGERENTRIES.LIST>
          </VOUCHER>

          <VOUCHER VCHTYPE="Journal" ACTION="Create" OBJVIEW="Accounting Voucher View">
            <DATE>20241128</DATE>
            <VOUCHERTYPENAME>Journal</VOUCHERTYPENAME>
            <VOUCHERNUMBER>JV-24-0210</VOUCHERNUMBER>
            <NARRATION>Advance in nature of loan to Managing Director without Section 185 resolution</NARRATION>
            <PARTYLEDGERNAME>Loans &amp; Advances to Directors</PARTYLEDGERNAME>
            <ALLLEDGERENTRIES.LIST>
              <LEDGERNAME>Loans &amp; Advances to Directors</LEDGERNAME>
              <ISDEEMEDPOSITIVE>Yes</ISDEEMEDPOSITIVE>
              <AMOUNT>-1200000.00</AMOUNT>
            </ALLLEDGERENTRIES.LIST>
            <ALLLEDGERENTRIES.LIST>
              <LEDGERNAME>Sundry Advances</LEDGERNAME>
              <ISDEEMEDPOSITIVE>No</ISDEEMEDPOSITIVE>
              <AMOUNT>1200000.00</AMOUNT>
            </ALLLEDGERENTRIES.LIST>
          </VOUCHER>
        </TALLYMESSAGE>
      </REQUESTDATA>
    </IMPORTDATA>
  </BODY>
</ENVELOPE>`;
