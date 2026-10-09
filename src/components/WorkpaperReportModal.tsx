import React from 'react';
import { 
  X, 
  Printer, 
  Download, 
  ShieldCheck, 
  FileText, 
  Scale, 
  AlertTriangle,
  Building2,
  Calendar,
  CheckCircle2
} from 'lucide-react';
import { AuditRunResult, formatINR } from '../services/auditEngine';

interface WorkpaperReportModalProps {
  auditResult: AuditRunResult;
  onClose: () => void;
  onExportCsv: () => void;
}

export const WorkpaperReportModal: React.FC<WorkpaperReportModalProps> = ({
  auditResult,
  onClose,
  onExportCsv
}) => {
  const { config, findings, metrics, anomalies } = auditResult;

  const handlePrint = () => {
    window.print();
  };

  const highFindings = findings.filter(f => f.rule.risk === 'HIGH');
  const mediumFindings = findings.filter(f => f.rule.risk === 'MEDIUM');

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl max-w-5xl w-full max-h-[95vh] flex flex-col shadow-2xl overflow-hidden">
        
        {/* Top Control Bar (Hidden on print) */}
        <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between no-print">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-teal-500/10 text-teal-400 border border-teal-500/20">
              <FileText className="w-4 h-4" />
            </span>
            <div>
              <h2 className="text-sm font-bold text-white">
                Chartered Accountant Statutory Audit Working Paper & Report
              </h2>
              <span className="text-[11px] text-slate-400">
                Prepared in accordance with ICAI Standards on Auditing (SA 230 / SA 240 / Form 3CD)
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onExportCsv}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 transition flex items-center gap-1.5 border border-slate-700"
            >
              <Download className="w-3.5 h-3.5 text-slate-400" />
              <span>Export CSV</span>
            </button>
            <button
              onClick={handlePrint}
              className="px-3.5 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-500 text-white text-xs font-semibold shadow-sm transition flex items-center gap-1.5"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print / Save PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition ml-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Working Paper Document Area */}
        <div className="p-8 overflow-y-auto bg-slate-950 text-slate-200 space-y-6 text-xs font-sans print:p-0 print:bg-white print:text-black">
          
          {/* Working Paper Header */}
          <div className="border-b-2 border-slate-800 print:border-black pb-5">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-widest text-teal-400 print:text-teal-700 font-bold">
                  CONFIDENTIAL AUDIT WORKING PAPER
                </span>
                <h1 className="text-lg font-bold text-white print:text-black mt-0.5">
                  STATUTORY COMPLIANCE & TAX AUDIT SCREENING MEMORANDUM
                </h1>
                <p className="text-xs text-slate-400 print:text-gray-600 mt-1">
                  Firm: {config.caFirmName} | Membership No: {config.caMembershipNo}
                </p>
                <div className="text-[11px] font-mono text-teal-400/90 print:text-gray-700 mt-0.5">
                  UDIN Reference: {config.udin}
                </div>
              </div>

              <div className="text-left sm:text-right shrink-0">
                <span className="text-xs font-semibold block text-white print:text-black">
                  {config.entityName}
                </span>
                <span className="text-[11px] text-slate-400 print:text-gray-600 block font-mono">
                  CIN / PAN: {config.cinOrPan}
                </span>
                <div className="mt-1 flex flex-wrap sm:justify-end gap-1.5">
                  <span className="px-2 py-0.5 rounded bg-slate-900 print:bg-gray-200 text-slate-300 print:text-black text-[10px] font-mono border border-slate-800 print:border-gray-400">
                    {config.financialYear}
                  </span>
                  <span className="px-2 py-0.5 rounded bg-slate-900 print:bg-gray-200 text-teal-300 print:text-black text-[10px] font-mono border border-slate-800 print:border-gray-400 font-bold">
                    {config.taxForm}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Executive Summary Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 rounded-lg bg-slate-900 print:bg-gray-100 border border-slate-800 print:border-gray-300">
              <span className="text-[10px] uppercase text-slate-400 print:text-gray-600 block font-semibold">Screened Vouchers</span>
              <span className="text-base font-bold text-white print:text-black font-mono mt-0.5 block">
                {metrics.totalTransactions}
              </span>
              <span className="text-[10px] text-slate-500 print:text-gray-600">
                Volume: {formatINR(metrics.totalDebitSum)}
              </span>
            </div>

            <div className="p-3 rounded-lg bg-slate-900 print:bg-gray-100 border border-slate-800 print:border-gray-300">
              <span className="text-[10px] uppercase text-rose-400 print:text-red-700 block font-semibold">High Risk Findings</span>
              <span className="text-base font-bold text-rose-300 print:text-red-700 font-mono mt-0.5 block">
                {metrics.highRiskCount}
              </span>
              <span className="text-[10px] text-slate-500 print:text-gray-600">
                Total Flags: {metrics.totalFindingsCount}
              </span>
            </div>

            <div className="p-3 rounded-lg bg-slate-900 print:bg-gray-100 border border-slate-800 print:border-gray-300">
              <span className="text-[10px] uppercase text-amber-400 print:text-amber-800 block font-semibold">Disallowance Candidates</span>
              <span className="text-base font-bold text-amber-300 print:text-amber-800 font-mono mt-0.5 block">
                {formatINR(metrics.potentialDisallowanceAmount)}
              </span>
              <span className="text-[10px] text-slate-500 print:text-gray-600">
                Form 3CD Clause 21
              </span>
            </div>

            <div className="p-3 rounded-lg bg-slate-900 print:bg-gray-100 border border-slate-800 print:border-gray-300">
              <span className="text-[10px] uppercase text-teal-400 print:text-teal-800 block font-semibold">MSME 43B(h) Dues</span>
              <span className="text-base font-bold text-teal-300 print:text-teal-800 font-mono mt-0.5 block">
                {formatINR(metrics.msmeDelayedAmount)}
              </span>
              <span className="text-[10px] text-slate-500 print:text-gray-600">
                Compound Interest Risk
              </span>
            </div>
          </div>

          {/* Detailed Findings Schedule */}
          <div className="space-y-3">
            <h2 className="text-xs font-bold text-white print:text-black uppercase tracking-wider border-b border-slate-800 print:border-gray-400 pb-1">
              Annexure 1: Schedule of Identified Statutory Screening Findings
            </h2>

            <div className="border border-slate-800 print:border-gray-400 rounded-lg overflow-hidden">
              <table className="min-w-full text-left text-xs">
                <thead className="bg-slate-900 print:bg-gray-200 text-slate-400 print:text-black uppercase text-[10px] border-b border-slate-800 print:border-gray-400">
                  <tr>
                    <th className="py-2.5 px-3">Rule / Code</th>
                    <th className="py-2.5 px-3">Category & Title</th>
                    <th className="py-2.5 px-3">3CD / CARO Clause</th>
                    <th className="py-2.5 px-3">Legal Reference</th>
                    <th className="py-2.5 px-3 text-center">Risk</th>
                    <th className="py-2.5 px-3 text-right">Exposure (₹)</th>
                    <th className="py-2.5 px-3">Auditor Remarks</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 print:divide-gray-300">
                  {findings.map((f) => (
                    <tr key={f.ruleId} className="hover:bg-slate-900/40 print:hover:bg-transparent">
                      <td className="py-2 px-3 font-mono text-teal-400 print:text-black font-semibold whitespace-nowrap">
                        {f.ruleId}
                      </td>
                      <td className="py-2 px-3">
                        <div className="font-semibold text-white print:text-black">{f.rule.title}</div>
                        <div className="text-[10px] text-slate-500 print:text-gray-600">{f.rule.category}</div>
                      </td>
                      <td className="py-2 px-3 whitespace-nowrap font-mono text-[11px]">
                        {f.rule.form3cdClause && <span className="block text-teal-400 print:text-black">3CD: Cl. {f.rule.form3cdClause}</span>}
                        {f.rule.caroClause && f.rule.caroClause !== 'N/A' && <span className="block text-blue-400 print:text-black">CARO: {f.rule.caroClause}</span>}
                      </td>
                      <td className="py-2 px-3 text-[11px] text-slate-300 print:text-gray-700 max-w-[200px]">
                        {f.rule.legalReference}
                      </td>
                      <td className="py-2 px-3 text-center whitespace-nowrap">
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold ${
                          f.rule.risk === 'HIGH' ? 'bg-rose-950 text-rose-300 print:text-red-700' :
                          f.rule.risk === 'MEDIUM' ? 'bg-amber-950 text-amber-300 print:text-amber-800' :
                          'bg-emerald-950 text-emerald-300 print:text-green-700'
                        }`}>
                          {f.rule.risk}
                        </span>
                      </td>
                      <td className="py-2 px-3 text-right font-mono font-bold text-amber-300 print:text-black whitespace-nowrap">
                        {formatINR(f.totalExposure)}
                      </td>
                      <td className="py-2 px-3 text-[11px] text-slate-300 print:text-gray-800 italic max-w-[180px]">
                        {f.auditorRemarks || 'Verified against accounting vouchers.'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Forensic Anomalies Section */}
          {anomalies.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-xs font-bold text-white print:text-black uppercase tracking-wider border-b border-slate-800 print:border-gray-400 pb-1">
                Annexure 2: Forensic Pattern Screening (SA 240 Fraud Indicators)
              </h2>
              <div className="space-y-2">
                {anomalies.map((anom) => (
                  <div key={anom.id} className="p-3 rounded-lg bg-slate-900 print:bg-gray-100 border border-slate-800 print:border-gray-300">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-white print:text-black text-xs">{anom.title}</span>
                      <span className="font-mono font-bold text-amber-400 print:text-black">{formatINR(anom.totalAmount)}</span>
                    </div>
                    <p className="text-[11px] text-slate-400 print:text-gray-600 mt-1">{anom.description}</p>
                    <div className="text-[11px] text-teal-400 print:text-teal-800 mt-1 font-medium">
                      Auditor Procedure: {anom.recommendedAction}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Statutory Limitation Disclaimer as per ICAI Standards */}
          <div className="border-t-2 border-slate-800 print:border-black pt-4 space-y-2 text-[10px] text-slate-500 print:text-gray-600">
            <h3 className="font-bold uppercase tracking-wider text-slate-400 print:text-black">
              Auditor Statement & Limitation of Scope
            </h3>
            <p>
              1. This memorandum is an analytical screening working paper designed to assist the audit engagement team in planning and executing statutory audit procedures under the Companies Act, 2013, Form 3CD under Section 44AB of the Income-tax Act, 1961/2025, and CARO 2020.
            </p>
            <p>
              2. Transactional flagging is configuration-driven based on Tally ERP daybook parameters. Definitive conclusions on statutory disallowances (such as Rule 6DD exceptions for Section 40A(3), Form 26A submissions for Section 40(a)(ia), or MSME enterprise classification) require substantive examination of underlying documentary evidence referenced in the working paper checklist.
            </p>
            <div className="pt-4 flex justify-between items-end">
              <div>
                <span className="block font-semibold text-slate-300 print:text-black">Date of Review: {new Date().toLocaleDateString('en-IN')}</span>
                <span className="block">Place: Mumbai, India</span>
              </div>
              <div className="text-right">
                <span className="block font-semibold text-slate-300 print:text-black">For {config.caFirmName}</span>
                <span className="block">Chartered Accountants</span>
                <span className="block font-mono mt-3">Partner / Proprietor</span>
              </div>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
