import React, { useState } from 'react';
import { 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  FileCheck, 
  ShieldAlert, 
  Info, 
  ExternalLink,
  Search,
  Filter
} from 'lucide-react';
import { ClauseChecklistItem } from '../types';

interface ChecklistsTabProps {
  form3cdChecklist: ClauseChecklistItem[];
  caroChecklist: ClauseChecklistItem[];
  onSelectRuleId: (ruleId: string) => void;
}

export const ChecklistsTab: React.FC<ChecklistsTabProps> = ({
  form3cdChecklist,
  caroChecklist,
  onSelectRuleId
}) => {
  const [activeChecklist, setActiveChecklist] = useState<'Form3CD' | 'CARO2020'>('Form3CD');
  const [automationFilter, setAutomationFilter] = useState<'ALL' | 'Automated' | 'Semi-automated (Reconciliation)' | 'Auditor Manual Inquiry'>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'Potential Risk Finding' | 'Compliant / No Finding' | 'Pending Evidence'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const currentList = activeChecklist === 'Form3CD' ? form3cdChecklist : caroChecklist;

  const filteredList = currentList.filter(item => {
    if (automationFilter !== 'ALL' && item.automationLevel !== automationFilter) return false;
    if (statusFilter !== 'ALL' && item.status !== statusFilter) return false;
    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase();
      const matchNum = item.clauseNumber.toLowerCase().includes(q);
      const matchTitle = item.title.toLowerCase().includes(q);
      const matchNotes = item.notes.toLowerCase().includes(q);
      const matchLaw = item.governingLaw.toLowerCase().includes(q);
      return matchNum || matchTitle || matchNotes || matchLaw;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      
      {/* Top Selector & Switcher */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        
        {/* Toggle Buttons */}
        <div className="flex items-center rounded-lg bg-slate-950 p-1 border border-slate-800 text-xs">
          <button
            onClick={() => setActiveChecklist('Form3CD')}
            className={`px-4 py-2 rounded-md font-semibold transition flex items-center gap-2 ${
              activeChecklist === 'Form3CD'
                ? 'bg-teal-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <FileCheck className="w-4 h-4" />
            <span>Form 3CD Checklist (Clauses 1–44)</span>
          </button>
          <button
            onClick={() => setActiveChecklist('CARO2020')}
            className={`px-4 py-2 rounded-md font-semibold transition flex items-center gap-2 ${
              activeChecklist === 'CARO2020'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <ShieldAlert className="w-4 h-4" />
            <span>CARO 2020 Checklist (Clauses 3(i)–3(xxi))</span>
          </button>
        </div>

        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder={`Search ${activeChecklist === 'Form3CD' ? 'Form 3CD' : 'CARO 2020'} clauses...`}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-teal-500 transition"
          />
        </div>
      </div>

      {/* Filter Chips Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs bg-slate-900/60 p-3 rounded-lg border border-slate-800">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-slate-500 font-semibold uppercase tracking-wider text-[11px] mr-1">Automation Readiness:</span>
          {(['ALL', 'Automated', 'Semi-automated (Reconciliation)', 'Auditor Manual Inquiry'] as const).map(lvl => (
            <button
              key={lvl}
              onClick={() => setAutomationFilter(lvl)}
              className={`px-2.5 py-1 rounded text-[11px] font-medium transition ${
                automationFilter === lvl
                  ? 'bg-teal-600 text-white'
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              {lvl}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-1.5">
          <span className="text-slate-500 font-semibold uppercase tracking-wider text-[11px]">Audit Status:</span>
          {(['ALL', 'Potential Risk Finding', 'Compliant / No Finding', 'Pending Evidence'] as const).map(st => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-2.5 py-1 rounded text-[11px] font-medium transition ${
                statusFilter === st
                  ? (st === 'Potential Risk Finding' ? 'bg-rose-950 text-rose-300 border border-rose-800' :
                     st === 'Compliant / No Finding' ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' :
                     'bg-amber-950 text-amber-300 border border-amber-800')
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Checklist Items Table */}
      <div className="space-y-3">
        {filteredList.map((item, idx) => (
          <div
            key={idx}
            className={`bg-slate-900 border rounded-xl p-4 transition shadow-sm ${
              item.status === 'Potential Risk Finding'
                ? 'border-rose-900/50 bg-slate-900/90'
                : item.status === 'Compliant / No Finding'
                ? 'border-emerald-900/30'
                : 'border-slate-800'
            }`}
          >
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-3">
              
              <div className="space-y-1.5 flex-1">
                {/* Clause Badges */}
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-mono px-2.5 py-0.5 rounded-md font-bold bg-slate-950 text-teal-300 border border-slate-800">
                    {item.clauseNumber}
                  </span>
                  
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded uppercase ${
                    item.automationLevel === 'Automated' ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' :
                    item.automationLevel === 'Semi-automated (Reconciliation)' ? 'bg-amber-950 text-amber-300 border border-amber-800' :
                    'bg-slate-800 text-slate-300 border border-slate-700'
                  }`}>
                    {item.automationLevel}
                  </span>

                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded ${
                    item.status === 'Potential Risk Finding' ? 'bg-rose-950 text-rose-300 border border-rose-800 font-bold' :
                    item.status === 'Compliant / No Finding' ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' :
                    item.status === 'Pending Evidence' ? 'bg-amber-950 text-amber-300 border border-amber-800' :
                    'bg-slate-800 text-slate-400'
                  }`}>
                    {item.status}
                  </span>
                </div>

                <h3 className="text-sm font-bold text-white">
                  {item.title}
                </h3>

                <p className="text-xs text-slate-400 font-mono">
                  {item.governingLaw}
                </p>

                <div className="text-xs text-slate-300 bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/80 mt-2">
                  <span className="text-slate-400 font-semibold block mb-0.5">Auditor Procedure & Notes:</span>
                  {item.notes}
                  <span className="text-teal-400/90 block mt-1 text-[11px]">
                    Guidance: {item.statutoryGuidance}
                  </span>
                </div>

                {item.matchedRuleIds.length > 0 && (
                  <div className="pt-2 flex items-center gap-2">
                    <span className="text-[11px] text-slate-500 font-medium">Mapped Rule Engine Checks:</span>
                    <div className="flex flex-wrap gap-1.5">
                      {item.matchedRuleIds.map(ruleId => (
                        <button
                          key={ruleId}
                          onClick={() => onSelectRuleId(ruleId)}
                          className="text-[10px] font-mono px-2 py-0.5 rounded bg-teal-950 text-teal-300 hover:bg-teal-900 border border-teal-800 transition flex items-center gap-1"
                          title="View Rule Details"
                        >
                          <span>{ruleId}</span>
                          <ExternalLink className="w-2.5 h-2.5" />
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

            </div>
          </div>
        ))}

        {filteredList.length === 0 && (
          <div className="text-center py-12 bg-slate-900 border border-slate-800 rounded-xl text-slate-400">
            <p className="text-sm font-semibold">No checklist clauses match the current filters.</p>
          </div>
        )}
      </div>

    </div>
  );
};
