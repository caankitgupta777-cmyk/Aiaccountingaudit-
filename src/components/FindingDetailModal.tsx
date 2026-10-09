import React, { useState } from 'react';
import { 
  X, 
  CheckSquare, 
  Square, 
  AlertTriangle, 
  FileText, 
  Scale, 
  ExternalLink,
  Save,
  CheckCircle2,
  Calendar,
  Layers
} from 'lucide-react';
import { RuleFinding, FindingStatus, Transaction } from '../types';
import { formatINR } from '../services/auditEngine';

interface FindingDetailModalProps {
  finding: RuleFinding;
  onClose: () => void;
  onUpdateFinding: (updated: {
    status: FindingStatus;
    auditorRemarks: string;
    evidenceChecklist: { item: string; checked: boolean }[];
  }) => void;
}

export const FindingDetailModal: React.FC<FindingDetailModalProps> = ({
  finding,
  onClose,
  onUpdateFinding
}) => {
  const [status, setStatus] = useState<FindingStatus>(finding.status);
  const [remarks, setRemarks] = useState<string>(finding.auditorRemarks || '');
  const [checklist, setChecklist] = useState(
    finding.evidenceChecklist.length > 0 
      ? finding.evidenceChecklist 
      : finding.rule.evidenceRequired.map(item => ({ item, checked: false }))
  );
  const [savedSuccess, setSavedSuccess] = useState(false);

  const toggleCheck = (idx: number) => {
    const updated = [...checklist];
    updated[idx].checked = !updated[idx].checked;
    setChecklist(updated);
  };

  const handleSave = () => {
    onUpdateFinding({
      status,
      auditorRemarks: remarks,
      evidenceChecklist: checklist
    });
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="p-5 bg-slate-950 border-b border-slate-800 flex items-start justify-between gap-4">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold uppercase ${
                finding.rule.risk === 'HIGH' ? 'bg-rose-950 text-rose-300 border border-rose-800' :
                finding.rule.risk === 'MEDIUM' ? 'bg-amber-950 text-amber-300 border border-amber-800' :
                'bg-emerald-950 text-emerald-300 border border-emerald-800'
              }`}>
                {finding.rule.risk} RISK
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                {finding.ruleId}
              </span>
              {finding.rule.form3cdClause && (
                <span className="text-[10px] px-2 py-0.5 rounded bg-teal-950 text-teal-300 border border-teal-800 font-mono font-semibold">
                  Form 3CD Cl. {finding.rule.form3cdClause}
                </span>
              )}
              {finding.rule.caroClause && finding.rule.caroClause !== 'N/A' && (
                <span className="text-[10px] px-2 py-0.5 rounded bg-blue-950 text-blue-300 border border-blue-800 font-mono font-semibold">
                  CARO Cl. {finding.rule.caroClause}
                </span>
              )}
            </div>
            <h2 className="text-base font-bold text-white">
              {finding.rule.title}
            </h2>
            <p className="text-xs text-teal-400 font-mono">
              {finding.rule.legalReference}
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-xs">
          
          {/* Exposure and Rule Description */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800">
              <span className="text-[11px] text-slate-400 font-semibold block uppercase tracking-wider">
                Total Statutory Exposure
              </span>
              <div className="text-xl font-bold text-amber-300 font-mono mt-1">
                {formatINR(finding.totalExposure)}
              </div>
              <span className="text-[11px] text-slate-400 mt-0.5 block">
                Across {finding.txCount} flagged transactions
              </span>
            </div>

            <div className="md:col-span-2 p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2">
              <span className="text-[11px] text-slate-400 font-semibold block uppercase tracking-wider">
                Rule Scope & Recommendation
              </span>
              <p className="text-slate-300">
                {finding.rule.description}
              </p>
              <div className="text-teal-400 font-medium">
                Recommendation: {finding.rule.recommendation}
              </div>
            </div>
          </div>

          {/* Triggered Transactions Table */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-white flex items-center gap-1.5 uppercase tracking-wider">
                <FileText className="w-3.5 h-3.5 text-teal-400" />
                Vouchers Triggering this Statutory Rule ({finding.transactions.length})
              </h3>
            </div>

            <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-950">
              <div className="overflow-x-auto max-h-60">
                <table className="min-w-full text-xs text-left text-slate-300">
                  <thead className="bg-slate-900 text-slate-400 uppercase text-[10px] sticky top-0 border-b border-slate-800">
                    <tr>
                      <th className="py-2 px-3">Date</th>
                      <th className="py-2 px-3">Voucher No</th>
                      <th className="py-2 px-3">Type</th>
                      <th className="py-2 px-3">Ledger Account</th>
                      <th className="py-2 px-3">Particulars / Narration</th>
                      <th className="py-2 px-3">Mode</th>
                      <th className="py-2 px-3 text-right">Debit (₹)</th>
                      <th className="py-2 px-3 text-right">Credit (₹)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-sans">
                    {finding.transactions.map((tx) => (
                      <tr key={tx.id} className="hover:bg-slate-800/40">
                        <td className="py-2 px-3 font-mono whitespace-nowrap text-slate-300">{tx.date}</td>
                        <td className="py-2 px-3 font-mono font-medium text-teal-400 whitespace-nowrap">{tx.voucherNo}</td>
                        <td className="py-2 px-3 whitespace-nowrap">{tx.voucherType}</td>
                        <td className="py-2 px-3 font-medium text-white max-w-[160px] truncate">{tx.ledgerName}</td>
                        <td className="py-2 px-3 max-w-[240px] truncate text-slate-300">{tx.particulars}</td>
                        <td className="py-2 px-3 whitespace-nowrap font-mono">{tx.paymentMode}</td>
                        <td className="py-2 px-3 text-right font-mono font-bold text-slate-100">
                          {tx.debit > 0 ? formatINR(tx.debit) : '-'}
                        </td>
                        <td className="py-2 px-3 text-right font-mono font-bold text-slate-100">
                          {tx.credit > 0 ? formatINR(tx.credit) : '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Interactive Evidence Checklist */}
          <div className="space-y-3 bg-slate-950 p-4 rounded-xl border border-slate-800">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                  <CheckSquare className="w-3.5 h-3.5 text-teal-400" />
                  Statutory Evidence Verification Checklist
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Tick each piece of physical or electronic audit evidence as verified from client records.
                </p>
              </div>
              <span className="text-[11px] text-teal-400 font-mono">
                {checklist.filter(c => c.checked).length} of {checklist.length} verified
              </span>
            </div>

            <div className="space-y-2">
              {checklist.map((item, idx) => (
                <div 
                  key={idx}
                  onClick={() => toggleCheck(idx)}
                  className="flex items-start gap-2.5 p-2 rounded-lg hover:bg-slate-900 border border-transparent hover:border-slate-800 cursor-pointer transition"
                >
                  <div className="mt-0.5 text-teal-400">
                    {item.checked ? (
                      <CheckSquare className="w-4 h-4 text-teal-400" />
                    ) : (
                      <Square className="w-4 h-4 text-slate-500" />
                    )}
                  </div>
                  <span className={`text-xs ${item.checked ? 'text-slate-200 line-through opacity-75' : 'text-slate-300'}`}>
                    {item.item}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Working Paper Remarks & Status Box */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            
            <div className="space-y-2">
              <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                Auditor Assessment Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as FindingStatus)}
                className="w-full bg-slate-950 border border-slate-800 text-white rounded-lg p-2.5 text-xs font-medium focus:outline-none focus:border-teal-500"
              >
                <option value="OPEN">OPEN (Requires Investigation)</option>
                <option value="IN_REVIEW">IN_REVIEW (Evidence Requested)</option>
                <option value="VERIFIED">VERIFIED (Report in 3CD / CARO)</option>
                <option value="DISMISSED">DISMISSED (Exempt / Justified)</option>
              </select>
              <span className="text-[11px] text-slate-500 block">
                Update status according to auditor satisfaction with supporting records.
              </span>
            </div>

            <div className="md:col-span-2 space-y-2">
              <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                CA Working Paper Note & Clause Remarks
              </label>
              <textarea
                rows={3}
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                placeholder="Enter auditor findings note, management response, or Form 3CD qualification remark..."
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-teal-500 resize-none font-sans"
              />
            </div>
          </div>

        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {savedSuccess && (
              <span className="text-xs text-emerald-400 flex items-center gap-1 font-medium animate-in fade-in">
                <CheckCircle2 className="w-4 h-4" />
                Working paper note saved!
              </span>
            )}
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-300 transition"
            >
              Close
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-2 rounded-lg bg-teal-600 hover:bg-teal-500 text-white text-xs font-semibold shadow-sm transition flex items-center gap-1.5"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Save Auditor Remarks</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
