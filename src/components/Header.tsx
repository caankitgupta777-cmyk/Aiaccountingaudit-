import React from 'react';
import { 
  Building2, 
  Calendar, 
  FileText, 
  Download, 
  RefreshCw, 
  ShieldAlert, 
  Sparkles,
  UploadCloud,
  CheckSquare
} from 'lucide-react';
import { AuditConfig, FinancialYear, EntityType, AccountingBasis } from '../types';

interface HeaderProps {
  config: AuditConfig;
  onUpdateConfig: (updated: Partial<AuditConfig>) => void;
  onLoadManufacturingSample: () => void;
  onLoadLlpSample: () => void;
  onOpenImport: () => void;
  onOpenReport: () => void;
  onExportCsv: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  config,
  onUpdateConfig,
  onLoadManufacturingSample,
  onLoadLlpSample,
  onOpenImport,
  onOpenReport,
  onExportCsv
}) => {
  const handleYearChange = (year: FinancialYear) => {
    let lawVersion: 'IT_ACT_1961' | 'IT_ACT_2025' = 'IT_ACT_1961';
    let taxForm: 'Form 3CA/3CD' | 'Form 3CB/3CD' | 'Form 26 (New Act)' = 'Form 3CA/3CD';
    
    if (year === 'FY2026-27') {
      lawVersion = 'IT_ACT_2025';
      taxForm = 'Form 26 (New Act)';
    } else {
      lawVersion = 'IT_ACT_1961';
      taxForm = config.entityType === 'company' ? 'Form 3CA/3CD' : 'Form 3CB/3CD';
    }

    onUpdateConfig({
      financialYear: year,
      lawVersion,
      taxForm
    });
  };

  const handleEntityTypeChange = (type: EntityType) => {
    const taxForm = config.lawVersion === 'IT_ACT_2025' 
      ? 'Form 26 (New Act)' 
      : (type === 'company' ? 'Form 3CA/3CD' : 'Form 3CB/3CD');
    onUpdateConfig({
      entityType: type,
      taxForm
    });
  };

  return (
    <header className="bg-slate-900 border-b border-slate-800 text-slate-100 sticky top-0 z-30 shadow-md">
      {/* Top Banner */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          
          {/* Logo & Branding */}
          <div className="flex items-center space-x-3.5">
            <div className="h-10 w-10 rounded-xl bg-teal-500/10 border border-teal-500/30 flex items-center justify-center text-teal-400 shadow-sm">
              <ShieldAlert className="w-5 h-5 text-teal-400" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
                  AI Tally Audit Agent
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-teal-500/10 text-teal-400 border border-teal-500/20">
                    CA Edition v1.1
                  </span>
                </h1>
              </div>
              <p className="text-xs text-slate-400">
                Statutory Audit, Form 3CD, CARO 2020 & Forensic Tally Screening Engine
              </p>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center rounded-lg bg-slate-800/80 p-0.5 border border-slate-700/60 text-xs">
              <button
                onClick={onLoadManufacturingSample}
                className="px-2.5 py-1.5 rounded-md text-slate-300 hover:text-white hover:bg-slate-700/80 transition flex items-center gap-1.5 font-medium"
                title="Load Vardhaman Precision Engineering Pvt Ltd (Manufacturing FY24-25)"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>Pvt Ltd Demo</span>
              </button>
              <button
                onClick={onLoadLlpSample}
                className="px-2.5 py-1.5 rounded-md text-slate-300 hover:text-white hover:bg-slate-700/80 transition flex items-center gap-1.5 font-medium"
                title="Load Apex Global Logistics & Trading LLP (FY25-26)"
              >
                <Building2 className="w-3.5 h-3.5 text-cyan-400" />
                <span>LLP Demo</span>
              </button>
            </div>

            <button
              onClick={onOpenImport}
              className="px-3 py-1.5 rounded-lg bg-teal-950/60 hover:bg-teal-900/80 border border-teal-700/80 text-xs font-medium text-teal-200 transition flex items-center gap-1.5 shadow-xs"
              title="Import Tally XML Daybook or CSV file"
            >
              <UploadCloud className="w-3.5 h-3.5 text-teal-400" />
              <span>Import Tally XML / CSV</span>
            </button>

            <button
              onClick={onExportCsv}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-medium text-slate-200 transition flex items-center gap-1.5"
              title="Export Screened Findings to CSV"
            >
              <Download className="w-3.5 h-3.5 text-slate-400" />
              <span>Export CSV</span>
            </button>

            <button
              onClick={onOpenReport}
              className="px-3.5 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-500 text-white text-xs font-semibold shadow-sm transition flex items-center gap-1.5"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>CA Working Paper</span>
            </button>
          </div>
        </div>

        {/* Audit Context Bar */}
        <div className="mt-3 pt-3 border-t border-slate-800/80 grid grid-cols-1 md:grid-cols-4 gap-3 text-xs">
          {/* Assessee Name & CIN */}
          <div className="bg-slate-800/50 rounded-lg p-2 border border-slate-800 flex items-center justify-between">
            <div className="truncate">
              <span className="text-slate-500 block text-[10px] uppercase font-semibold">Assessee Entity</span>
              <span className="font-semibold text-slate-200 truncate block" title={config.entityName}>
                {config.entityName}
              </span>
            </div>
            <span className="text-[10px] text-teal-400/90 font-mono bg-teal-950/60 px-1.5 py-0.5 rounded border border-teal-900/60 shrink-0 ml-2">
              {config.cinOrPan.split('/')[1]?.trim() || config.cinOrPan}
            </span>
          </div>

          {/* Financial Year & Law Framework */}
          <div className="bg-slate-800/50 rounded-lg p-2 border border-slate-800 flex items-center justify-between">
            <div>
              <span className="text-slate-500 block text-[10px] uppercase font-semibold">Financial Year & Act</span>
              <div className="flex items-center gap-1.5 mt-0.5">
                <select
                  value={config.financialYear}
                  onChange={(e) => handleYearChange(e.target.value as FinancialYear)}
                  className="bg-slate-900 border border-slate-700 text-white rounded px-2 py-0.5 text-xs font-medium focus:outline-none focus:border-teal-500"
                >
                  <option value="FY2023-24">FY 2023-24 (AY 2024-25)</option>
                  <option value="FY2024-25">FY 2024-25 (AY 2025-26)</option>
                  <option value="FY2025-26">FY 2025-26 (AY 2026-27)</option>
                  <option value="FY2026-27">FY 2026-27 (Tax Year 2026-27 / New Act)</option>
                </select>
              </div>
            </div>
            <div className="text-right">
              <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${
                config.lawVersion === 'IT_ACT_2025' 
                  ? 'bg-purple-950 text-purple-300 border border-purple-800' 
                  : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
              }`}>
                {config.lawVersion === 'IT_ACT_2025' ? 'IT Act 2025' : 'IT Act 1961'}
              </span>
            </div>
          </div>

          {/* Entity Type & CARO Applicability */}
          <div className="bg-slate-800/50 rounded-lg p-2 border border-slate-800 flex items-center justify-between">
            <div>
              <span className="text-slate-500 block text-[10px] uppercase font-semibold">Entity Type</span>
              <select
                value={config.entityType}
                onChange={(e) => handleEntityTypeChange(e.target.value as EntityType)}
                className="bg-slate-900 border border-slate-700 text-white rounded px-2 py-0.5 text-xs font-medium focus:outline-none focus:border-teal-500 mt-0.5"
              >
                <option value="company">Company (Pvt Ltd / Ltd)</option>
                <option value="llp">LLP (Limited Liability Partnership)</option>
                <option value="firm">Partnership Firm</option>
                <option value="individual">Individual Proprietorship</option>
                <option value="huf">HUF</option>
                <option value="trust">Trust / NGO</option>
                <option value="aop_boi">AOP / BOI</option>
              </select>
            </div>
            <div className="text-right">
              <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${
                config.entityType === 'company'
                  ? 'bg-blue-950 text-blue-300 border border-blue-800'
                  : 'bg-slate-800 text-slate-400'
              }`}>
                {config.entityType === 'company' ? 'CARO 2020: Active' : 'CARO: N/A'}
              </span>
            </div>
          </div>

          {/* Tax Audit Form & Accounting Basis */}
          <div className="bg-slate-800/50 rounded-lg p-2 border border-slate-800 flex items-center justify-between">
            <div>
              <span className="text-slate-500 block text-[10px] uppercase font-semibold">Tax Form & Basis</span>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="text-amber-400 font-medium">{config.taxForm}</span>
                <span className="text-slate-600">|</span>
                <select
                  value={config.accountingBasis}
                  onChange={(e) => onUpdateConfig({ accountingBasis: e.target.value as AccountingBasis })}
                  className="bg-slate-900 border border-slate-700 text-slate-300 rounded px-1.5 py-0.5 text-[11px] focus:outline-none focus:border-teal-500 capitalize"
                >
                  <option value="mercantile">Mercantile</option>
                  <option value="cash">Cash</option>
                </select>
              </div>
            </div>
            <div className="text-[10px] text-slate-400">
              Sec 44AB
            </div>
          </div>
        </div>

      </div>
    </header>
  );
};
