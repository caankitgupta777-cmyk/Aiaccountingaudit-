import React, { useState, useMemo } from 'react';
import { 
  Header 
} from './components/Header';
import { 
  OverviewTab 
} from './components/OverviewTab';
import { 
  RuleEngineTab 
} from './components/RuleEngineTab';
import { 
  AnomalyTab 
} from './components/AnomalyTab';
import { 
  ChecklistsTab 
} from './components/ChecklistsTab';
import { 
  TransactionsTab 
} from './components/TransactionsTab';
import { 
  FindingDetailModal 
} from './components/FindingDetailModal';
import { 
  WorkpaperReportModal 
} from './components/WorkpaperReportModal';
import { 
  DataImportModal 
} from './components/DataImportModal';

import { 
  AuditConfig, 
  Transaction, 
  RuleFinding, 
  FindingStatus 
} from './types';
import { 
  CONFIG_MANUFACTURING, 
  TRANSACTIONS_MANUFACTURING,
  CONFIG_TRADING_LLP,
  TRANSACTIONS_TRADING_LLP
} from './data/sampleDatasets';
import { 
  executeAuditScreening 
} from './services/auditEngine';

import { 
  LayoutDashboard, 
  ShieldAlert, 
  AlertOctagon, 
  FileCheck2, 
  BookOpen, 
  Sparkles,
  Layers
} from 'lucide-react';

export const App: React.FC = () => {
  const [config, setConfig] = useState<AuditConfig>(CONFIG_MANUFACTURING);
  const [transactions, setTransactions] = useState<Transaction[]>(TRANSACTIONS_MANUFACTURING);
  const [activeTab, setActiveTab] = useState<'overview' | 'rules' | 'anomalies' | 'checklists' | 'transactions'>('overview');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  
  // Modals state
  const [selectedFinding, setSelectedFinding] = useState<RuleFinding | null>(null);
  const [isReportOpen, setIsReportOpen] = useState<boolean>(false);
  const [isImportOpen, setIsImportOpen] = useState<boolean>(false);

  // Persistence map for auditor remarks and status
  const [findingsStateMap, setFindingsStateMap] = useState<
    Map<string, { status: FindingStatus; remarks: string; checkedEvidence: string[] }>
  >(new Map());

  // Execute screening whenever transactions, config, or user findings remarks change
  const auditResult = useMemo(() => {
    return executeAuditScreening(transactions, config, findingsStateMap);
  }, [transactions, config, findingsStateMap]);

  // Load Sample 1: Manufacturing Pvt Ltd
  const handleLoadManufacturing = () => {
    setConfig(CONFIG_MANUFACTURING);
    setTransactions(TRANSACTIONS_MANUFACTURING);
    setSelectedCategory('ALL');
  };

  // Load Sample 2: Trading LLP
  const handleLoadLlp = () => {
    setConfig(CONFIG_TRADING_LLP);
    setTransactions(TRANSACTIONS_TRADING_LLP);
    setSelectedCategory('ALL');
  };

  // Update finding from modal
  const handleUpdateFinding = (updated: {
    status: FindingStatus;
    auditorRemarks: string;
    evidenceChecklist: { item: string; checked: boolean }[];
  }) => {
    if (!selectedFinding) return;

    const newMap = new Map(findingsStateMap);
    newMap.set(selectedFinding.ruleId, {
      status: updated.status,
      remarks: updated.auditorRemarks,
      checkedEvidence: updated.evidenceChecklist.filter(e => e.checked).map(e => e.item)
    });
    setFindingsStateMap(newMap);

    // Also update current modal view
    setSelectedFinding({
      ...selectedFinding,
      status: updated.status,
      auditorRemarks: updated.auditorRemarks,
      evidenceChecklist: updated.evidenceChecklist
    });
  };

  // Export CSV
  const handleExportCsv = () => {
    const headers = [
      'Rule ID',
      'Category',
      'Title',
      'Risk',
      'Form 3CD Clause',
      'CARO Clause',
      'Legal Reference',
      'Flagged Vouchers',
      'Exposure Amount (INR)',
      'Status',
      'Auditor Remarks'
    ];

    const rows = auditResult.findings.map(f => [
      `"${f.ruleId}"`,
      `"${f.rule.category}"`,
      `"${f.rule.title.replace(/"/g, '""')}"`,
      `"${f.rule.risk}"`,
      `"${f.rule.form3cdClause || 'N/A'}"`,
      `"${f.rule.caroClause || 'N/A'}"`,
      `"${f.rule.legalReference.replace(/"/g, '""')}"`,
      f.txCount,
      f.totalExposure,
      `"${f.status}"`,
      `"${(f.auditorRemarks || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Audit_Findings_${config.entityName.replace(/\s+/g, '_')}_${config.financialYear}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Link from checklist to rule
  const handleSelectRuleId = (ruleId: string) => {
    const targetFinding = auditResult.findings.find(f => f.ruleId === ruleId);
    if (targetFinding) {
      setSelectedFinding(targetFinding);
    } else {
      setActiveTab('rules');
      setSelectedCategory('ALL');
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-teal-500 selection:text-white">
      {/* Top Application Header */}
      <Header
        config={config}
        onUpdateConfig={(up) => setConfig({ ...config, ...up })}
        onLoadManufacturingSample={handleLoadManufacturing}
        onLoadLlpSample={handleLoadLlp}
        onOpenImport={() => setIsImportOpen(true)}
        onOpenReport={() => setIsReportOpen(true)}
        onExportCsv={handleExportCsv}
      />

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex-1 w-full space-y-6">
        
        {/* Navigation Tabs Bar */}
        <div className="flex border-b border-slate-800 space-x-1 sm:space-x-3 text-xs overflow-x-auto no-scrollbar">
          
          <button
            onClick={() => setActiveTab('overview')}
            className={`pb-3 px-3 font-semibold flex items-center gap-2 border-b-2 transition whitespace-nowrap ${
              activeTab === 'overview'
                ? 'border-teal-400 text-teal-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <LayoutDashboard className="w-4 h-4" />
            <span>Audit Dashboard</span>
          </button>

          <button
            onClick={() => setActiveTab('rules')}
            className={`pb-3 px-3 font-semibold flex items-center gap-2 border-b-2 transition whitespace-nowrap ${
              activeTab === 'rules'
                ? 'border-teal-400 text-teal-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <ShieldAlert className="w-4 h-4" />
            <span>Statutory Rules Engine</span>
            <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
              auditResult.findings.length > 0 
                ? 'bg-rose-950 text-rose-300 border border-rose-800' 
                : 'bg-slate-800 text-slate-400'
            }`}>
              {auditResult.findings.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('anomalies')}
            className={`pb-3 px-3 font-semibold flex items-center gap-2 border-b-2 transition whitespace-nowrap ${
              activeTab === 'anomalies'
                ? 'border-teal-400 text-teal-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <AlertOctagon className="w-4 h-4" />
            <span>Forensic Anomalies</span>
            {auditResult.anomalies.length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-amber-950 text-amber-300 border border-amber-800">
                {auditResult.anomalies.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('checklists')}
            className={`pb-3 px-3 font-semibold flex items-center gap-2 border-b-2 transition whitespace-nowrap ${
              activeTab === 'checklists'
                ? 'border-teal-400 text-teal-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileCheck2 className="w-4 h-4" />
            <span>Form 3CD & CARO Checklists</span>
          </button>

          <button
            onClick={() => setActiveTab('transactions')}
            className={`pb-3 px-3 font-semibold flex items-center gap-2 border-b-2 transition whitespace-nowrap ${
              activeTab === 'transactions'
                ? 'border-teal-400 text-teal-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>Tally Daybook Records</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-slate-800 text-slate-400">
              {transactions.length}
            </span>
          </button>

        </div>

        {/* Tab Views */}
        {activeTab === 'overview' && (
          <OverviewTab
            auditResult={auditResult}
            onSelectFinding={(f) => setSelectedFinding(f)}
            onNavigateTab={(tab) => setActiveTab(tab)}
            onCategoryFilter={(cat) => setSelectedCategory(cat)}
          />
        )}

        {activeTab === 'rules' && (
          <RuleEngineTab
            findings={auditResult.findings}
            selectedCategory={selectedCategory}
            onCategoryChange={(cat) => setSelectedCategory(cat)}
            onSelectFinding={(f) => setSelectedFinding(f)}
          />
        )}

        {activeTab === 'anomalies' && (
          <AnomalyTab
            anomalies={auditResult.anomalies}
          />
        )}

        {activeTab === 'checklists' && (
          <ChecklistsTab
            form3cdChecklist={auditResult.form3cdChecklist}
            caroChecklist={auditResult.caroChecklist}
            onSelectRuleId={handleSelectRuleId}
          />
        )}

        {activeTab === 'transactions' && (
          <TransactionsTab
            transactions={transactions}
            onOpenImport={() => setIsImportOpen(true)}
          />
        )}

      </main>

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-900 bg-slate-950 py-4 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>AI Tally Audit Agent — Decision-Support Screening Engine for Chartered Accountants</span>
          <span className="text-[11px] text-slate-400">
            Form 3CD (IT Act 1961/2025) & CARO 2020 Compliance
          </span>
        </div>
      </footer>

      {/* Finding Detail Inspection Drawer/Modal */}
      {selectedFinding && (
        <FindingDetailModal
          finding={selectedFinding}
          onClose={() => setSelectedFinding(null)}
          onUpdateFinding={handleUpdateFinding}
        />
      )}

      {/* Working Paper Report Modal */}
      {isReportOpen && (
        <WorkpaperReportModal
          auditResult={auditResult}
          onClose={() => setIsReportOpen(false)}
          onExportCsv={handleExportCsv}
        />
      )}

      {/* Data Ingestion Modal */}
      {isImportOpen && (
        <DataImportModal
          onClose={() => setIsImportOpen(false)}
          onLoadManufacturingSample={handleLoadManufacturing}
          onLoadLlpSample={handleLoadLlp}
          onImportCustomData={(customTxs, entityName) => {
            setTransactions(customTxs);
            if (entityName) {
              setConfig(prev => ({ ...prev, entityName }));
            }
          }}
        />
      )}

    </div>
  );
};
