import React from 'react';
import { 
  AlertTriangle, 
  CheckCircle2, 
  IndianRupee, 
  ShieldCheck, 
  Layers, 
  Clock, 
  Scale, 
  FileCheck, 
  ArrowUpRight,
  Info,
  Building
} from 'lucide-react';
import { AuditRunResult, formatINR } from '../services/auditEngine';
import { RuleFinding } from '../types';

interface OverviewTabProps {
  auditResult: AuditRunResult;
  onSelectFinding: (finding: RuleFinding) => void;
  onNavigateTab: (tab: 'rules' | 'anomalies' | 'checklists' | 'transactions') => void;
  onCategoryFilter: (category: string) => void;
}

export const OverviewTab: React.FC<OverviewTabProps> = ({
  auditResult,
  onSelectFinding,
  onNavigateTab,
  onCategoryFilter
}) => {
  const { metrics, config, findings, anomalies } = auditResult;

  const categories = [
    { name: 'Income-tax / Tax Audit', count: findings.filter(f => f.rule.category === 'Income-tax / Tax Audit').length, color: 'text-amber-400 bg-amber-500/10 border-amber-500/30' },
    { name: 'TDS', count: findings.filter(f => f.rule.category === 'TDS').length, color: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/30' },
    { name: 'GST', count: findings.filter(f => f.rule.category === 'GST').length, color: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/30' },
    { name: 'Companies Act', count: findings.filter(f => f.rule.category === 'Companies Act').length, color: 'text-purple-400 bg-purple-500/10 border-purple-500/30' },
    { name: 'CARO 2020', count: findings.filter(f => f.rule.category === 'CARO 2020').length, color: 'text-blue-400 bg-blue-500/10 border-blue-500/30' },
    { name: 'Labour Law & Statutory', count: findings.filter(f => f.rule.category === 'Labour Law & Statutory').length, color: 'text-rose-400 bg-rose-500/10 border-rose-500/30' },
    { name: 'Accounting / Anomaly', count: findings.filter(f => f.rule.category === 'Accounting / Anomaly').length, color: 'text-orange-400 bg-orange-500/10 border-orange-500/30' },
  ];

  const highPriorityFindings = findings.filter(f => f.rule.risk === 'HIGH').slice(0, 4);

  return (
    <div className="space-y-6">
      {/* Statutory Transition Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 left-0 h-full w-1.5 bg-teal-500" />
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 pl-2">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-teal-950/80 border border-teal-800 text-teal-400 mt-0.5">
              <Scale className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-slate-100 text-sm">
                  Active Framework: {config.lawVersion === 'IT_ACT_2025' ? 'Income-tax Act, 2025' : 'Income-tax Act, 1961'}
                </span>
                <span className="text-[11px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                  {config.financialYear}
                </span>
                <span className="text-[11px] px-2 py-0.5 rounded bg-teal-950 text-teal-300 border border-teal-800 font-mono">
                  {config.taxForm}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1 max-w-4xl">
                {config.lawVersion === 'IT_ACT_2025' 
                  ? 'FY 2026-27 is screened under the Income-tax Act, 2025 regime and Form 26 reporting requirements. Clauses and threshold exceptions are aligned with the new tax code.'
                  : 'Screening conducted under the Income-tax Act, 1961 and Form 3CA/3CB+3CD reporting rules. Any cash disallowances u/s 40A(3), TDS defaults u/s 40(a)(ia), and delayed statutory dues u/s 43B are linked to Form 3CD clauses.'}
              </p>
            </div>
          </div>
          <div className="text-xs text-right shrink-0 pl-2 md:pl-0">
            <span className="text-slate-400 block">ICAI SA 240 / CARO</span>
            <span className="text-emerald-400 font-medium">Screening Active</span>
          </div>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Total Screened Volume */}
        <div className="bg-slate-900 border border-slate-800/90 rounded-xl p-4 hover:border-slate-700 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Screened Records</span>
            <span className="p-1.5 rounded-lg bg-slate-800 text-slate-300">
              <Layers className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-2.5 flex items-baseline justify-between">
            <div className="text-2xl font-bold text-white font-mono">
              {metrics.totalTransactions}
              <span className="text-xs font-normal text-slate-400 ml-1.5">vouchers</span>
            </div>
          </div>
          <div className="mt-2 text-xs text-slate-400 flex justify-between border-t border-slate-800/80 pt-2">
            <span>Debits: <strong className="text-slate-200 font-mono">{formatINR(metrics.totalDebitSum)}</strong></span>
            <span>Credits: <strong className="text-slate-200 font-mono">{formatINR(metrics.totalCreditSum)}</strong></span>
          </div>
        </div>

        {/* Metric 2: High Risk Statutory Violations */}
        <div className="bg-slate-900 border border-rose-900/40 rounded-xl p-4 hover:border-rose-700/60 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-rose-400 uppercase tracking-wider">High Risk Findings</span>
            <span className="p-1.5 rounded-lg bg-rose-950/80 border border-rose-800 text-rose-400">
              <AlertTriangle className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-2.5 flex items-baseline justify-between">
            <div className="text-2xl font-bold text-rose-300 font-mono">
              {metrics.highRiskCount}
              <span className="text-xs font-normal text-slate-400 ml-1.5">rules triggered</span>
            </div>
            <span className="text-xs text-rose-400/90 font-medium">Immediate Action</span>
          </div>
          <div className="mt-2 text-xs text-slate-400 border-t border-slate-800/80 pt-2 flex justify-between">
            <span>Med: <strong className="text-amber-400 font-mono">{metrics.mediumRiskCount}</strong></span>
            <span>Low: <strong className="text-emerald-400 font-mono">{metrics.lowRiskCount}</strong></span>
            <span>Total Flags: <strong className="text-slate-200 font-mono">{metrics.totalFindingsCount}</strong></span>
          </div>
        </div>

        {/* Metric 3: Potential Tax Disallowance */}
        <div className="bg-slate-900 border border-amber-900/40 rounded-xl p-4 hover:border-amber-700/60 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-amber-400 uppercase tracking-wider">Potential Tax Disallowance</span>
            <span className="p-1.5 rounded-lg bg-amber-950/80 border border-amber-800 text-amber-400">
              <IndianRupee className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-2.5 flex items-baseline justify-between">
            <div className="text-2xl font-bold text-amber-300 font-mono">
              {formatINR(metrics.potentialDisallowanceAmount)}
            </div>
          </div>
          <div className="mt-2 text-xs text-slate-400 border-t border-slate-800/80 pt-2 flex justify-between">
            <span>40A(3), 40(a)(ia), 40(b), Sec 37</span>
            <span className="text-amber-400/80">3CD Cl. 21</span>
          </div>
        </div>

        {/* Metric 4: MSME Section 43B(h) Delayed Dues */}
        <div className="bg-slate-900 border border-teal-900/40 rounded-xl p-4 hover:border-teal-700/60 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-teal-400 uppercase tracking-wider">MSME 43B(h) Delayed Dues</span>
            <span className="p-1.5 rounded-lg bg-teal-950/80 border border-teal-800 text-teal-400">
              <Clock className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-2.5 flex items-baseline justify-between">
            <div className="text-2xl font-bold text-teal-300 font-mono">
              {formatINR(metrics.msmeDelayedAmount)}
            </div>
            <span className="text-xs text-teal-400 font-medium">&gt; 45 Days</span>
          </div>
          <div className="mt-2 text-xs text-slate-400 border-t border-slate-800/80 pt-2 flex justify-between">
            <span>Compound Int @ 3x RBI Rate</span>
            <span className="text-teal-400/80">Cl. 22 & 26</span>
          </div>
        </div>
      </div>

      {/* Second Row: Statutory Compliance Breakdown & Critical Findings */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Rule Categories Breakdown */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <FileCheck className="w-4 h-4 text-teal-400" />
              Statutory Domains Screened
            </h2>
            <span className="text-xs text-slate-500">42 Standard Rules</span>
          </div>

          <div className="space-y-2.5">
            {categories.map((cat, idx) => (
              <button
                key={idx}
                onClick={() => {
                  onCategoryFilter(cat.name);
                  onNavigateTab('rules');
                }}
                className="w-full flex items-center justify-between p-2.5 rounded-lg bg-slate-800/40 hover:bg-slate-800 border border-slate-800/80 transition text-left group"
              >
                <div className="flex items-center gap-2.5">
                  <span className={`w-2.5 h-2.5 rounded-full ${cat.count > 0 ? 'bg-amber-400' : 'bg-slate-600'}`} />
                  <span className="text-xs font-medium text-slate-200 group-hover:text-teal-300 transition">
                    {cat.name}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-xs px-2 py-0.5 rounded font-mono font-medium ${
                    cat.count > 0 ? cat.color : 'text-slate-500 bg-slate-800'
                  }`}>
                    {cat.count} {cat.count === 1 ? 'finding' : 'findings'}
                  </span>
                  <ArrowUpRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-teal-400 transition" />
                </div>
              </button>
            ))}
          </div>

          {/* Forensic Anomalies Summary Box */}
          <div className="mt-5 pt-4 border-t border-slate-800">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-300">Forensic Pattern Anomalies</span>
              <span className="text-xs text-amber-400 font-mono font-medium">{anomalies.length} detected</span>
            </div>
            <p className="text-xs text-slate-400 mb-3">
              Smurfing cash structuring, round-figure journals (SA 240), and weekend entry patterns.
            </p>
            <button
              onClick={() => onNavigateTab('anomalies')}
              className="w-full py-2 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-semibold text-slate-200 flex items-center justify-center gap-1.5 transition"
            >
              <span>View Forensic Anomaly Log</span>
              <ArrowUpRight className="w-3.5 h-3.5 text-teal-400" />
            </button>
          </div>
        </div>

        {/* Right 2 Columns: Top Critical Findings with Evidence Checklists */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-sm font-bold text-white flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-400" />
                  Key Screening Highlights & Disallowance Candidates
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Click any finding to inspect vouchers, mark audit evidence, and enter working paper comments.
                </p>
              </div>
              <button
                onClick={() => onNavigateTab('rules')}
                className="text-xs text-teal-400 hover:text-teal-300 font-medium flex items-center gap-1"
              >
                View all ({findings.length})
                <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-3">
              {highPriorityFindings.map((finding) => (
                <div
                  key={finding.ruleId}
                  onClick={() => onSelectFinding(finding)}
                  className="p-3.5 rounded-lg bg-slate-800/50 hover:bg-slate-800 border border-slate-800/90 hover:border-slate-700 cursor-pointer transition flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-rose-950 text-rose-300 border border-rose-800 font-semibold">
                        {finding.rule.risk}
                      </span>
                      <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-800 text-slate-300 border border-slate-700">
                        {finding.ruleId}
                      </span>
                      {finding.rule.form3cdClause && (
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-teal-950 text-teal-300 border border-teal-800 font-mono">
                          3CD Cl. {finding.rule.form3cdClause}
                        </span>
                      )}
                      {finding.rule.caroClause && finding.rule.caroClause !== 'N/A' && (
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-blue-950 text-blue-300 border border-blue-800 font-mono">
                          CARO {finding.rule.caroClause}
                        </span>
                      )}
                    </div>
                    <h3 className="text-xs font-semibold text-white">
                      {finding.rule.title}
                    </h3>
                    <p className="text-[11px] text-slate-400 line-clamp-1">
                      {finding.rule.legalReference}
                    </p>
                  </div>

                  <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center shrink-0 border-t sm:border-t-0 border-slate-800 pt-2 sm:pt-0">
                    <div className="text-right">
                      <span className="text-xs font-bold text-amber-300 font-mono block">
                        {formatINR(finding.totalExposure)}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {finding.txCount} {finding.txCount === 1 ? 'voucher' : 'vouchers'}
                      </span>
                    </div>
                    <span className="text-[10px] text-teal-400 mt-1 flex items-center gap-1 font-medium">
                      Inspect & Review →
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Important Audit Screening Disclaimer */}
          <div className="mt-5 p-3 rounded-lg bg-slate-950/80 border border-slate-800 text-[11px] text-slate-400 flex items-start gap-2.5">
            <Info className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <strong className="text-slate-300 font-medium">CA Screening Note: </strong>
              The engine is an audit-screening decision support tool. Ledger data alone cannot prove final statutory conclusions. Each flagged rule provides an explicit evidence checklist (contracts, Form 15CA, GST 2B, board minutes) for auditor verification before signing Form 3CD or CARO.
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
