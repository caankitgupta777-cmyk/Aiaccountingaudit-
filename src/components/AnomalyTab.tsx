import React from 'react';
import { 
  AlertTriangle, 
  Calendar, 
  Coins, 
  Layers, 
  ShieldAlert, 
  HelpCircle,
  ArrowRight,
  TrendingUp,
  FileSpreadsheet
} from 'lucide-react';
import { AnomalyGroup, Transaction } from '../types';
import { formatINR } from '../services/auditEngine';

interface AnomalyTabProps {
  anomalies: AnomalyGroup[];
  onSelectVoucher?: (tx: Transaction) => void;
}

export const AnomalyTab: React.FC<AnomalyTabProps> = ({
  anomalies,
  onSelectVoucher
}) => {
  return (
    <div className="space-y-6">
      
      {/* Forensic Introduction Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
                <ShieldAlert className="w-4 h-4" />
              </span>
              <h2 className="text-sm font-bold text-white">
                Forensic Anomaly & Pattern Detection Engine
              </h2>
            </div>
            <p className="text-xs text-slate-400 mt-1 max-w-3xl">
              Identifies behavioral patterns that bypass statutory thresholds (e.g. cash structuring under ₹10,000), round-number journal postings indicating unvouched estimates (SA 240), and non-business day entries.
            </p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <span className="text-xs bg-slate-800 px-3 py-1.5 rounded-lg text-slate-300 border border-slate-700 font-mono">
              {anomalies.length} Forensic Anomalies Detected
            </span>
          </div>
        </div>
      </div>

      {/* Anomalies List */}
      <div className="space-y-6">
        {anomalies.map((anom) => (
          <div 
            key={anom.id}
            className={`bg-slate-900 border rounded-xl overflow-hidden shadow-sm ${
              anom.severity === 'HIGH' ? 'border-rose-900/60' :
              anom.severity === 'MEDIUM' ? 'border-amber-900/60' :
              'border-slate-800'
            }`}
          >
            {/* Header */}
            <div className="p-4 bg-slate-950/70 border-b border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold uppercase ${
                    anom.severity === 'HIGH' ? 'bg-rose-950 text-rose-300 border border-rose-800' :
                    anom.severity === 'MEDIUM' ? 'bg-amber-950 text-amber-300 border border-amber-800' :
                    'bg-slate-800 text-slate-300'
                  }`}>
                    {anom.severity} SEVERITY
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                    {anom.type}
                  </span>
                  <span className="text-xs text-slate-400">
                    ({anom.txCount} flagged vouchers)
                  </span>
                </div>
                <h3 className="text-sm font-bold text-white">
                  {anom.title}
                </h3>
              </div>

              <div className="text-left md:text-right">
                <span className="text-[10px] text-slate-400 uppercase tracking-wider block">
                  Aggregate Affected Sum
                </span>
                <span className="text-base font-bold text-amber-300 font-mono">
                  {formatINR(anom.totalAmount)}
                </span>
              </div>
            </div>

            {/* Description & Recommended Action */}
            <div className="p-4 bg-slate-900 grid grid-cols-1 md:grid-cols-2 gap-3 text-xs border-b border-slate-800/80">
              <div className="bg-slate-950/60 p-3 rounded-lg border border-slate-800/80">
                <span className="text-slate-400 font-semibold block mb-1">Audit Risk & Observation:</span>
                <p className="text-slate-300">{anom.description}</p>
                <p className="text-slate-400 mt-1 italic">{anom.explanation}</p>
              </div>
              <div className="bg-slate-950/60 p-3 rounded-lg border border-slate-800/80">
                <span className="text-teal-400 font-semibold block mb-1">Recommended Auditor Procedure:</span>
                <p className="text-slate-300">{anom.recommendedAction}</p>
              </div>
            </div>

            {/* Vouchers Table */}
            <div className="overflow-x-auto">
              <table className="min-w-full text-xs text-left text-slate-300">
                <thead className="bg-slate-950 text-slate-400 uppercase tracking-wider text-[10px] border-b border-slate-800">
                  <tr>
                    <th className="py-2.5 px-4 font-semibold">Date</th>
                    <th className="py-2.5 px-4 font-semibold">Voucher No</th>
                    <th className="py-2.5 px-4 font-semibold">Type</th>
                    <th className="py-2.5 px-4 font-semibold">Ledger Account</th>
                    <th className="py-2.5 px-4 font-semibold">Particulars / Narration</th>
                    <th className="py-2.5 px-4 font-semibold text-right">Debit (₹)</th>
                    <th className="py-2.5 px-4 font-semibold text-right">Credit (₹)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-sans">
                  {anom.transactions.map((tx) => (
                    <tr key={tx.id} className="hover:bg-slate-800/40 transition">
                      <td className="py-2.5 px-4 whitespace-nowrap font-mono text-slate-300">
                        {tx.date}
                      </td>
                      <td className="py-2.5 px-4 whitespace-nowrap font-mono text-teal-400 font-medium">
                        {tx.voucherNo}
                      </td>
                      <td className="py-2.5 px-4 whitespace-nowrap">
                        <span className="px-1.5 py-0.5 rounded text-[10px] bg-slate-800 text-slate-300 border border-slate-700">
                          {tx.voucherType}
                        </span>
                      </td>
                      <td className="py-2.5 px-4 font-medium text-white max-w-[200px] truncate" title={tx.ledgerName}>
                        {tx.ledgerName}
                      </td>
                      <td className="py-2.5 px-4 max-w-[320px] truncate text-slate-300" title={tx.particulars}>
                        {tx.particulars}
                      </td>
                      <td className="py-2.5 px-4 whitespace-nowrap text-right font-mono font-semibold text-slate-100">
                        {tx.debit > 0 ? formatINR(tx.debit) : '-'}
                      </td>
                      <td className="py-2.5 px-4 whitespace-nowrap text-right font-mono font-semibold text-slate-100">
                        {tx.credit > 0 ? formatINR(tx.credit) : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

          </div>
        ))}

        {anomalies.length === 0 && (
          <div className="text-center py-12 bg-slate-900 border border-slate-800 rounded-xl text-slate-400">
            <p className="text-sm font-semibold">No forensic anomalies detected in current dataset.</p>
            <p className="text-xs text-slate-500 mt-1">Cash structure limits and journal entries conform to baseline patterns.</p>
          </div>
        )}
      </div>

    </div>
  );
};
