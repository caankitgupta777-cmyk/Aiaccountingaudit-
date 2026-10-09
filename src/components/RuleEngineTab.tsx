import React, { useState, useMemo } from 'react';
import { 
  Search, 
  Filter, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  FileText, 
  ExternalLink,
  ChevronDown,
  Layers,
  Sparkles,
  Check
} from 'lucide-react';
import { RuleFinding, AuditRule } from '../types';
import { ALL_RULES } from '../data/rulesCatalogue';
import { formatINR } from '../services/auditEngine';

interface RuleEngineTabProps {
  findings: RuleFinding[];
  selectedCategory: string;
  onCategoryChange: (cat: string) => void;
  onSelectFinding: (finding: RuleFinding) => void;
}

export const RuleEngineTab: React.FC<RuleEngineTabProps> = ({
  findings,
  selectedCategory,
  onCategoryChange,
  onSelectFinding
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [riskFilter, setRiskFilter] = useState<'ALL' | 'HIGH' | 'MEDIUM' | 'LOW'>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'TRIGGERED' | 'NO_FINDING'>('ALL');

  // Map findings by ruleId for fast lookup
  const findingsMap = useMemo(() => {
    const map = new Map<string, RuleFinding>();
    for (const f of findings) {
      map.set(f.ruleId, f);
    }
    return map;
  }, [findings]);

  const categories = [
    'ALL',
    'Income-tax / Tax Audit',
    'TDS',
    'GST',
    'Companies Act',
    'CARO 2020',
    'Labour Law & Statutory',
    'Accounting / Anomaly'
  ];

  // Filter rules based on search, category, risk, status
  const filteredRules = useMemo(() => {
    return ALL_RULES.filter(rule => {
      // Category filter
      if (selectedCategory !== 'ALL' && rule.category !== selectedCategory) {
        return false;
      }
      // Risk filter
      if (riskFilter !== 'ALL' && rule.risk !== riskFilter) {
        return false;
      }
      // Status filter
      const finding = findingsMap.get(rule.id);
      const isTriggered = !!finding && finding.txCount > 0;
      if (statusFilter === 'TRIGGERED' && !isTriggered) return false;
      if (statusFilter === 'NO_FINDING' && isTriggered) return false;

      // Search query
      if (searchQuery.trim() !== '') {
        const q = searchQuery.toLowerCase();
        const matchTitle = rule.title.toLowerCase().includes(q);
        const matchId = rule.id.toLowerCase().includes(q);
        const matchDesc = rule.description.toLowerCase().includes(q);
        const matchRef = rule.legalReference.toLowerCase().includes(q);
        const match3cd = (rule.form3cdClause || '').toLowerCase().includes(q);
        const matchCaro = (rule.caroClause || '').toLowerCase().includes(q);
        return matchTitle || matchId || matchDesc || matchRef || match3cd || matchCaro;
      }

      return true;
    });
  }, [selectedCategory, riskFilter, statusFilter, searchQuery, findingsMap]);

  return (
    <div className="space-y-5">
      {/* Search and Filters Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm space-y-4">
        
        {/* Top Filter Row: Search & Status Toggle */}
        <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by rule name, section (e.g. 40A(3), 269SS), 3CD clause (e.g. 21(d)), or CARO clause..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-teal-500 transition"
            />
          </div>

          <div className="flex items-center gap-2">
            {/* Risk filter */}
            <div className="flex items-center rounded-lg bg-slate-950 p-1 border border-slate-800 text-xs">
              {(['ALL', 'HIGH', 'MEDIUM', 'LOW'] as const).map(risk => (
                <button
                  key={risk}
                  onClick={() => setRiskFilter(risk)}
                  className={`px-2.5 py-1 rounded text-[11px] font-semibold transition ${
                    riskFilter === risk
                      ? (risk === 'HIGH' ? 'bg-rose-950 text-rose-300 border border-rose-800' :
                         risk === 'MEDIUM' ? 'bg-amber-950 text-amber-300 border border-amber-800' :
                         risk === 'LOW' ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' :
                         'bg-slate-800 text-white')
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {risk}
                </button>
              ))}
            </div>

            {/* Finding status filter */}
            <div className="flex items-center rounded-lg bg-slate-950 p-1 border border-slate-800 text-xs">
              <button
                onClick={() => setStatusFilter('ALL')}
                className={`px-2.5 py-1 rounded text-[11px] font-medium transition ${
                  statusFilter === 'ALL' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                All (42)
              </button>
              <button
                onClick={() => setStatusFilter('TRIGGERED')}
                className={`px-2.5 py-1 rounded text-[11px] font-medium transition ${
                  statusFilter === 'TRIGGERED' ? 'bg-amber-950 text-amber-300 border border-amber-800' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Triggered ({findings.length})
              </button>
              <button
                onClick={() => setStatusFilter('NO_FINDING')}
                className={`px-2.5 py-1 rounded text-[11px] font-medium transition ${
                  statusFilter === 'NO_FINDING' ? 'bg-slate-800 text-teal-300' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Clean ({42 - findings.length})
              </button>
            </div>
          </div>
        </div>

        {/* Categories Pills */}
        <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-slate-800/80">
          <span className="text-[11px] text-slate-500 font-semibold uppercase tracking-wider mr-1">Domain:</span>
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => onCategoryChange(cat)}
              className={`px-2.5 py-1 rounded-md text-xs font-medium transition ${
                selectedCategory === cat
                  ? 'bg-teal-600 text-white shadow-sm'
                  : 'bg-slate-800/60 text-slate-400 hover:text-slate-200 hover:bg-slate-800 border border-slate-800'
              }`}
            >
              {cat === 'ALL' ? 'All Domains' : cat}
            </button>
          ))}
        </div>

      </div>

      {/* Rules Grid */}
      <div className="space-y-3.5">
        <div className="flex items-center justify-between text-xs text-slate-400 px-1">
          <span>Showing {filteredRules.length} statutory screening rules</span>
          <span>{findings.length} active risk findings detected</span>
        </div>

        {filteredRules.map(rule => {
          const finding = findingsMap.get(rule.id);
          const isTriggered = !!finding && finding.txCount > 0;

          return (
            <div
              key={rule.id}
              className={`bg-slate-900 border rounded-xl p-4 transition shadow-sm ${
                isTriggered 
                  ? (rule.risk === 'HIGH' ? 'border-rose-900/60 bg-slate-900/90 hover:border-rose-700/80' : 
                     rule.risk === 'MEDIUM' ? 'border-amber-900/60 bg-slate-900/90 hover:border-amber-700/80' : 
                     'border-emerald-900/60 hover:border-emerald-700/80')
                  : 'border-slate-800/80 opacity-75 hover:opacity-100 hover:border-slate-700'
              }`}
            >
              <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                
                {/* Left Rule Content */}
                <div className="space-y-2 flex-1">
                  
                  {/* Tags Bar */}
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold uppercase ${
                      rule.risk === 'HIGH' ? 'bg-rose-950 text-rose-300 border border-rose-800' :
                      rule.risk === 'MEDIUM' ? 'bg-amber-950 text-amber-300 border border-amber-800' :
                      'bg-emerald-950 text-emerald-300 border border-emerald-800'
                    }`}>
                      {rule.risk} RISK
                    </span>

                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                      {rule.id}
                    </span>

                    <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800/80 text-teal-300 border border-slate-700">
                      {rule.category}
                    </span>

                    {rule.form3cdClause && (
                      <span className="text-[10px] px-2 py-0.5 rounded bg-teal-950 text-teal-300 border border-teal-800 font-mono font-medium">
                        Form 3CD Cl. {rule.form3cdClause}
                      </span>
                    )}

                    {rule.caroClause && rule.caroClause !== 'N/A' && (
                      <span className="text-[10px] px-2 py-0.5 rounded bg-blue-950 text-blue-300 border border-blue-800 font-mono font-medium">
                        CARO Cl. {rule.caroClause}
                      </span>
                    )}

                    {isTriggered && (
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded ${
                        finding.status === 'VERIFIED' ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' :
                        finding.status === 'IN_REVIEW' ? 'bg-amber-950 text-amber-300 border border-amber-800' :
                        finding.status === 'DISMISSED' ? 'bg-slate-800 text-slate-400' :
                        'bg-rose-950 text-rose-300 border border-rose-800'
                      }`}>
                        Status: {finding.status}
                      </span>
                    )}
                  </div>

                  {/* Title & Description */}
                  <div>
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      {rule.title}
                    </h3>
                    <p className="text-xs text-slate-300 mt-1">
                      {rule.description}
                    </p>
                  </div>

                  {/* Legal Citation & Recommendation */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-[11px] bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/80">
                    <div>
                      <span className="text-slate-400 block font-semibold">Statutory Reference & Source:</span>
                      <span className="text-teal-300/90">{rule.legalReference}</span>
                      <span className="text-slate-400 block mt-0.5">Source: {rule.source}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block font-semibold">Auditor Recommendation:</span>
                      <span className="text-slate-300">{rule.recommendation}</span>
                    </div>
                  </div>

                  {/* Evidence Required preview */}
                  <div className="text-[11px] text-slate-400 pt-1">
                    <span className="text-slate-500 font-semibold block mb-1">Required Auditor Evidence Checklist:</span>
                    <ul className="grid grid-cols-1 md:grid-cols-2 gap-1">
                      {rule.evidenceRequired.map((ev, i) => (
                        <li key={i} className="flex items-center gap-1.5 text-slate-300">
                          <span className="w-1 h-1 rounded-full bg-teal-400" />
                          <span className="truncate" title={ev}>{ev}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                </div>

                {/* Right Action / Exposure Box */}
                <div className="lg:w-60 flex lg:flex-col justify-between items-end lg:items-end p-3 rounded-lg bg-slate-950 border border-slate-800 shrink-0">
                  <div className="text-left lg:text-right">
                    {isTriggered ? (
                      <>
                        <span className="text-[10px] text-rose-400 font-semibold uppercase tracking-wider block">
                          Identified Exposure
                        </span>
                        <div className="text-lg font-bold text-amber-300 font-mono mt-0.5">
                          {formatINR(finding.totalExposure)}
                        </div>
                        <div className="text-xs text-slate-400 mt-0.5">
                          {finding.txCount} {finding.txCount === 1 ? 'voucher flagged' : 'vouchers flagged'}
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="flex items-center gap-1 text-emerald-400 text-xs font-semibold">
                          <CheckCircle className="w-4 h-4" />
                          <span>No Breach Detected</span>
                        </div>
                        <span className="text-[11px] text-slate-500 mt-0.5 block">
                          0 vouchers triggered
                        </span>
                      </>
                    )}
                  </div>

                  {isTriggered && (
                    <button
                      onClick={() => onSelectFinding(finding)}
                      className="mt-3 w-full py-1.5 px-3 rounded-lg bg-teal-600 hover:bg-teal-500 text-white text-xs font-semibold shadow-sm transition flex items-center justify-center gap-1.5"
                    >
                      <span>Inspect Vouchers</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

              </div>
            </div>
          );
        })}

        {filteredRules.length === 0 && (
          <div className="text-center py-12 bg-slate-900 border border-slate-800 rounded-xl text-slate-400">
            <p className="text-sm font-semibold">No rules matched your search query or filters.</p>
            <p className="text-xs text-slate-500 mt-1">Try resetting the domain or search term.</p>
          </div>
        )}
      </div>
    </div>
  );
};
