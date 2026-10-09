import React, { useState, useMemo } from 'react';
import { 
  Search, 
  Filter, 
  ArrowUpDown, 
  FileSpreadsheet, 
  Layers, 
  AlertCircle,
  Download,
  FileCode
} from 'lucide-react';
import { Transaction } from '../types';
import { formatINR } from '../services/auditEngine';

interface TransactionsTabProps {
  transactions: Transaction[];
  onSelectTransaction?: (tx: Transaction) => void;
  onOpenImport?: () => void;
}

export const TransactionsTab: React.FC<TransactionsTabProps> = ({
  transactions,
  onSelectTransaction,
  onOpenImport
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');
  const [modeFilter, setModeFilter] = useState<string>('ALL');
  const [flagsOnly, setFlagsOnly] = useState<boolean>(false);
  const [sortField, setSortField] = useState<'date' | 'debit' | 'credit' | 'voucherNo'>('date');
  const [sortAsc, setSortAsc] = useState<boolean>(true);

  const voucherTypes = ['ALL', 'Payment', 'Receipt', 'Journal', 'Purchase', 'Sales', 'Contra'];
  const paymentModes = ['ALL', 'Cash', 'Bank', 'Journal'];

  const filteredTransactions = useMemo(() => {
    return transactions.filter(tx => {
      if (typeFilter !== 'ALL' && tx.voucherType !== typeFilter) return false;
      if (modeFilter !== 'ALL' && tx.paymentMode !== modeFilter) return false;
      if (flagsOnly && (!tx.flags || tx.flags.length === 0)) return false;

      if (searchQuery.trim() !== '') {
        const q = searchQuery.toLowerCase();
        const matchLedger = tx.ledgerName.toLowerCase().includes(q);
        const matchPart = tx.particulars.toLowerCase().includes(q);
        const matchVoucher = tx.voucherNo.toLowerCase().includes(q);
        const matchGroup = tx.parentGroup.toLowerCase().includes(q);
        const matchPan = (tx.partyPan || '').toLowerCase().includes(q);
        const matchGst = (tx.gstin || '').toLowerCase().includes(q);
        return matchLedger || matchPart || matchVoucher || matchGroup || matchPan || matchGst;
      }

      return true;
    }).sort((a, b) => {
      if (sortField === 'date') {
        const diff = new Date(a.date).getTime() - new Date(b.date).getTime();
        return sortAsc ? diff : -diff;
      }
      if (sortField === 'debit') {
        return sortAsc ? a.debit - b.debit : b.debit - a.debit;
      }
      if (sortField === 'credit') {
        return sortAsc ? a.credit - b.credit : b.credit - a.credit;
      }
      if (sortField === 'voucherNo') {
        return sortAsc ? a.voucherNo.localeCompare(b.voucherNo) : b.voucherNo.localeCompare(a.voucherNo);
      }
      return 0;
    });
  }, [transactions, typeFilter, modeFilter, flagsOnly, searchQuery, sortField, sortAsc]);

  const handleSort = (field: 'date' | 'debit' | 'credit' | 'voucherNo') => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(true);
    }
  };

  return (
    <div className="space-y-4">
      {/* Search & Filter Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm space-y-3">
        <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by ledger name, narration, PAN, GSTIN, or voucher number..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-teal-500 transition"
            />
          </div>

          <div className="flex items-center gap-2">
            {onOpenImport && (
              <button
                onClick={onOpenImport}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-teal-950/70 hover:bg-teal-900 border border-teal-700/80 text-teal-300 transition flex items-center gap-1.5"
                title="Import Tally Daybook XML export"
              >
                <FileCode className="w-3.5 h-3.5 text-teal-400" />
                <span>Import Tally XML</span>
              </button>
            )}
            <button
              onClick={() => setFlagsOnly(!flagsOnly)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 ${
                flagsOnly
                  ? 'bg-rose-950 text-rose-300 border border-rose-800'
                  : 'bg-slate-800 text-slate-300 hover:text-white border border-slate-700'
              }`}
            >
              <AlertCircle className="w-3.5 h-3.5" />
              <span>Flagged Vouchers Only</span>
            </button>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-800/80 text-xs">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-slate-500 font-semibold uppercase tracking-wider text-[11px] mr-1">Voucher Type:</span>
            {voucherTypes.map(t => (
              <button
                key={t}
                onClick={() => setTypeFilter(t)}
                className={`px-2 py-0.5 rounded text-[11px] font-medium transition ${
                  typeFilter === t
                    ? 'bg-teal-600 text-white'
                    : 'bg-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                {t}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-slate-500 font-semibold uppercase tracking-wider text-[11px] mr-1">Mode:</span>
            {paymentModes.map(m => (
              <button
                key={m}
                onClick={() => setModeFilter(m)}
                className={`px-2 py-0.5 rounded text-[11px] font-medium transition ${
                  modeFilter === m
                    ? 'bg-teal-600 text-white'
                    : 'bg-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                {m}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Ledger Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
        <div className="px-4 py-3 bg-slate-950 border-b border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <span>Showing {filteredTransactions.length} of {transactions.length} records</span>
          <span className="text-slate-500">Click column headers to sort</span>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-xs text-left text-slate-300">
            <thead className="bg-slate-950/80 text-slate-400 uppercase tracking-wider text-[10px] border-b border-slate-800">
              <tr>
                <th 
                  onClick={() => handleSort('date')}
                  className="py-3 px-4 font-semibold cursor-pointer hover:text-teal-400 transition"
                >
                  <div className="flex items-center gap-1">
                    <span>Date</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th 
                  onClick={() => handleSort('voucherNo')}
                  className="py-3 px-4 font-semibold cursor-pointer hover:text-teal-400 transition"
                >
                  <div className="flex items-center gap-1">
                    <span>Voucher No</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th className="py-3 px-4 font-semibold">Type</th>
                <th className="py-3 px-4 font-semibold">Ledger & Group</th>
                <th className="py-3 px-4 font-semibold">Particulars / Narration</th>
                <th className="py-3 px-4 font-semibold">Mode / Party</th>
                <th 
                  onClick={() => handleSort('debit')}
                  className="py-3 px-4 font-semibold text-right cursor-pointer hover:text-teal-400 transition"
                >
                  <div className="flex items-center justify-end gap-1">
                    <span>Debit (₹)</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th 
                  onClick={() => handleSort('credit')}
                  className="py-3 px-4 font-semibold text-right cursor-pointer hover:text-teal-400 transition"
                >
                  <div className="flex items-center justify-end gap-1">
                    <span>Credit (₹)</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th className="py-3 px-4 font-semibold text-center">Audit Flags</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-sans">
              {filteredTransactions.map((tx) => (
                <tr 
                  key={tx.id} 
                  onClick={() => onSelectTransaction && onSelectTransaction(tx)}
                  className={`hover:bg-slate-800/50 transition cursor-pointer ${
                    tx.flags && tx.flags.length > 0 ? 'bg-slate-900/60' : ''
                  }`}
                >
                  <td className="py-3 px-4 whitespace-nowrap font-mono text-slate-300">
                    {tx.date}
                  </td>
                  <td className="py-3 px-4 whitespace-nowrap font-mono font-medium text-teal-400">
                    {tx.voucherNo}
                  </td>
                  <td className="py-3 px-4 whitespace-nowrap">
                    <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-slate-800 text-slate-300 border border-slate-700">
                      {tx.voucherType}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <div className="font-semibold text-white max-w-[200px] truncate" title={tx.ledgerName}>
                      {tx.ledgerName}
                    </div>
                    <div className="text-[10px] text-slate-500 truncate" title={tx.parentGroup}>
                      {tx.parentGroup}
                    </div>
                  </td>
                  <td className="py-3 px-4 max-w-[300px] truncate text-slate-300" title={tx.particulars}>
                    {tx.particulars}
                    {tx.invoiceRef && (
                      <span className="block text-[10px] text-slate-500 font-mono">
                        Ref: {tx.invoiceRef}
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4 whitespace-nowrap">
                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-mono ${
                      tx.paymentMode === 'Cash' ? 'bg-amber-950 text-amber-300 border border-amber-800 font-bold' :
                      tx.paymentMode === 'Bank' ? 'bg-blue-950 text-blue-300 border border-blue-800' :
                      'bg-slate-800 text-slate-300'
                    }`}>
                      {tx.paymentMode}
                    </span>
                    {tx.partyPan && (
                      <span className="block text-[10px] text-slate-400 font-mono mt-0.5">
                        {tx.partyPan}
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4 whitespace-nowrap text-right font-mono font-bold text-slate-100">
                    {tx.debit > 0 ? formatINR(tx.debit) : '-'}
                  </td>
                  <td className="py-3 px-4 whitespace-nowrap text-right font-mono font-bold text-slate-100">
                    {tx.credit > 0 ? formatINR(tx.credit) : '-'}
                  </td>
                  <td className="py-3 px-4 whitespace-nowrap text-center">
                    {tx.flags && tx.flags.length > 0 ? (
                      <div className="flex flex-wrap gap-1 justify-center max-w-[140px]">
                        {tx.flags.map((f, i) => (
                          <span 
                            key={i} 
                            className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-rose-950 text-rose-300 border border-rose-800"
                            title={f}
                          >
                            {f.replace('_', ' ')}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-slate-600 font-mono text-[11px]">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredTransactions.length === 0 && (
          <div className="text-center py-12 text-slate-400">
            <p className="text-sm font-semibold">No transactions found matching criteria.</p>
          </div>
        )}
      </div>

    </div>
  );
};
