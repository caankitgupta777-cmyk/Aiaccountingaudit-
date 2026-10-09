import React, { useState } from 'react';
import { 
  X, 
  UploadCloud, 
  Sparkles, 
  Building2, 
  FileSpreadsheet, 
  CheckCircle2, 
  AlertCircle, 
  FileCode, 
  ArrowRight,
  Database,
  Layers,
  FileText
} from 'lucide-react';
import { Transaction } from '../types';
import { parseTallyXml, SAMPLE_TALLY_XML, TallyXmlParseResult } from '../services/tallyXmlParser';
import { formatINR } from '../services/auditEngine';

interface DataImportModalProps {
  onClose: () => void;
  onLoadManufacturingSample: () => void;
  onLoadLlpSample: () => void;
  onImportCustomData: (transactions: Transaction[], entityName?: string) => void;
}

export const DataImportModal: React.FC<DataImportModalProps> = ({
  onClose,
  onLoadManufacturingSample,
  onLoadLlpSample,
  onImportCustomData
}) => {
  const [activeTab, setActiveTab] = useState<'xml' | 'sample' | 'csv' | 'paste'>('xml');
  const [xmlText, setXmlText] = useState('');
  const [xmlResult, setXmlResult] = useState<TallyXmlParseResult | null>(null);
  
  const [csvPasteContent, setCsvPasteContent] = useState('');
  const [parseError, setParseError] = useState<string | null>(null);
  const [parsedPreview, setParsedPreview] = useState<Transaction[] | null>(null);
  const [importedEntityName, setImportedEntityName] = useState<string>('Imported Tally Entity');

  // Handle Tally XML File Upload
  const handleXmlFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setParseError(null);
    const reader = new FileReader();
    reader.onload = (evt) => {
      const content = evt.target?.result as string;
      setXmlText(content);
      const res = parseTallyXml(content);
      setXmlResult(res);
      if (res.success) {
        setParsedPreview(res.transactions);
        if (res.companyName) {
          setImportedEntityName(res.companyName);
        }
      } else {
        setParseError(res.error || 'Failed to parse Tally XML');
      }
    };
    reader.readAsText(file);
  };

  // Parse Tally XML directly from text area or sample
  const handleParseXmlText = (rawText: string) => {
    setParseError(null);
    const res = parseTallyXml(rawText);
    setXmlResult(res);
    if (res.success) {
      setParsedPreview(res.transactions);
      if (res.companyName) {
        setImportedEntityName(res.companyName);
      }
    } else {
      setParseError(res.error || 'Failed to parse Tally XML');
    }
  };

  const handleLoadSampleXml = () => {
    setXmlText(SAMPLE_TALLY_XML);
    handleParseXmlText(SAMPLE_TALLY_XML);
  };

  // Handle CSV file upload
  const handleCsvFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check if user uploaded XML in CSV tab
    if (file.name.toLowerCase().endsWith('.xml')) {
      setActiveTab('xml');
      const reader = new FileReader();
      reader.onload = (evt) => {
        const content = evt.target?.result as string;
        setXmlText(content);
        handleParseXmlText(content);
      };
      reader.readAsText(file);
      return;
    }

    const reader = new FileReader();
    reader.onload = (evt) => {
      const text = evt.target?.result as string;
      parseCsvText(text);
    };
    reader.readAsText(file);
  };

  const parseCsvText = (text: string) => {
    try {
      setParseError(null);
      // If user pasted XML by accident into CSV tab
      if (text.trim().startsWith('<')) {
        setActiveTab('xml');
        setXmlText(text);
        handleParseXmlText(text);
        return;
      }

      const lines = text.trim().split(/\r?\n/);
      if (lines.length < 2) {
        setParseError('File has no transaction records');
        return;
      }

      const txs: Transaction[] = [];

      for (let i = 1; i < lines.length; i++) {
        const parts = lines[i].split(',').map(p => p.trim());
        if (parts.length < 3) continue;

        const date = parts[0] || '2024-04-01';
        const voucherNo = parts[1] || `VCH-${i}`;
        const voucherType = (parts[2] || 'Payment') as any;
        const ledgerName = parts[3] || 'General Ledger';
        const particulars = parts[4] || 'Business Transaction';
        const debit = parseFloat(parts[5]) || 0;
        const credit = parseFloat(parts[6]) || 0;
        const paymentMode = (parts[7] || (debit > 0 ? 'Bank' : 'Cash')) as any;

        txs.push({
          id: `custom-${i}`,
          date,
          voucherNo,
          voucherType,
          ledgerName,
          parentGroup: 'Direct Expenses',
          particulars,
          debit,
          credit,
          netAmount: debit || credit,
          paymentMode,
          partyPan: parts[8] || '',
          gstin: parts[9] || '',
          flags: debit > 10000 && paymentMode === 'Cash' ? ['CASH_OVER_10K'] : []
        });
      }

      if (txs.length === 0) {
        setParseError('Could not parse any valid CSV rows.');
        return;
      }

      setParsedPreview(txs);
      setImportedEntityName('Imported CSV Client Ledger');
    } catch (err: any) {
      setParseError(`Parsing error: ${err.message}`);
    }
  };

  const handleApplyImport = () => {
    if (parsedPreview && parsedPreview.length > 0) {
      onImportCustomData(parsedPreview, importedEntityName);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl max-w-3xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden text-xs animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-teal-500/10 text-teal-400 border border-teal-500/20">
              <UploadCloud className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                Tally Data Ingestion Engine
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-teal-950 text-teal-300 border border-teal-800 font-mono">
                  XML &amp; CSV Ready
                </span>
              </h2>
              <p className="text-[11px] text-slate-400">
                Import standard Tally XML Daybook / Vouchers, CSV exports, or select CA benchmark datasets.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab switch */}
        <div className="flex border-b border-slate-800 bg-slate-950/70 px-4 pt-2 overflow-x-auto no-scrollbar">
          <button
            onClick={() => setActiveTab('xml')}
            className={`pb-2.5 px-3.5 font-semibold transition border-b-2 flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'xml' 
                ? 'border-teal-400 text-teal-300' 
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <FileCode className="w-3.5 h-3.5" />
            <span>Import Tally XML File</span>
          </button>

          <button
            onClick={() => setActiveTab('sample')}
            className={`pb-2.5 px-3.5 font-semibold transition border-b-2 flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'sample' 
                ? 'border-teal-400 text-teal-300' 
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Pre-Built CA Audit Datasets</span>
          </button>

          <button
            onClick={() => setActiveTab('csv')}
            className={`pb-2.5 px-3.5 font-semibold transition border-b-2 flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'csv' 
                ? 'border-teal-400 text-teal-300' 
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Upload CSV / Excel Export</span>
          </button>

          <button
            onClick={() => setActiveTab('paste')}
            className={`pb-2.5 px-3.5 font-semibold transition border-b-2 flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'paste' 
                ? 'border-teal-400 text-teal-300' 
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Paste Raw Data</span>
          </button>
        </div>

        {/* Body Content */}
        <div className="p-5 space-y-4 overflow-y-auto flex-1">
          
          {/* TAB 1: Tally XML File Import */}
          {activeTab === 'xml' && (
            <div className="space-y-4">
              
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-slate-950 p-3 rounded-xl border border-slate-800">
                <div className="space-y-0.5">
                  <span className="font-semibold text-white block">Tally XML Ingestion (TallyPrime / Tally ERP 9)</span>
                  <span className="text-[11px] text-slate-400 block">
                    Upload direct XML export from Tally (via <code className="text-teal-400 font-mono">Alt+E &gt; Export &gt; XML</code>)
                  </span>
                </div>
                <button
                  onClick={handleLoadSampleXml}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-teal-300 border border-slate-700 text-xs font-medium transition flex items-center gap-1.5 shrink-0 self-start sm:self-auto"
                  title="Load sample Tally XML with manufacturing vouchers"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span>Load Sample Tally XML</span>
                </button>
              </div>

              {/* XML Drag & Drop Box */}
              <div className="border-2 border-dashed border-slate-800 hover:border-teal-500/60 rounded-xl p-6 text-center cursor-pointer transition bg-slate-950/40">
                <input
                  type="file"
                  accept=".xml,text/xml"
                  onChange={handleXmlFileUpload}
                  className="hidden"
                  id="xml-file-input"
                />
                <label htmlFor="xml-file-input" className="cursor-pointer space-y-2 block">
                  <FileCode className="w-9 h-9 text-teal-400 mx-auto" />
                  <span className="block font-semibold text-white text-xs">
                    Click to select Tally XML file (.xml) or drag and drop
                  </span>
                  <span className="block text-slate-500 text-[11px]">
                    Auto-parses <code className="text-slate-400 font-mono">&lt;VOUCHER&gt;</code>, dates, ledgers, amounts, GSTIN, and narrations
                  </span>
                </label>
              </div>

              {/* Paste or Edit XML code optionally */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-slate-400 text-[11px] font-semibold">
                    Or paste Tally XML content directly:
                  </label>
                  {xmlText && (
                    <button
                      onClick={() => handleParseXmlText(xmlText)}
                      className="text-[11px] text-teal-400 hover:text-teal-300 font-medium"
                    >
                      Re-parse XML
                    </button>
                  )}
                </div>
                <textarea
                  rows={4}
                  value={xmlText}
                  onChange={(e) => {
                    setXmlText(e.target.value);
                    if (e.target.value.trim().startsWith('<')) {
                      handleParseXmlText(e.target.value);
                    }
                  }}
                  placeholder="<ENVELOPE><BODY><IMPORTDATA><REQUESTDATA><TALLYMESSAGE>..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-[11px] text-white placeholder-slate-600 focus:outline-none focus:border-teal-500 font-mono resize-none"
                />
              </div>

              {/* Parse Error Notification */}
              {parseError && (
                <div className="p-3 rounded-lg bg-rose-950/60 border border-rose-800 text-rose-300 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold block">XML Parsing Issue</span>
                    <span className="text-[11px]">{parseError}</span>
                  </div>
                </div>
              )}

              {/* XML Success Summary */}
              {xmlResult && xmlResult.success && (
                <div className="p-3.5 rounded-xl bg-slate-950 border border-teal-800/80 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-2.5">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      <div>
                        <span className="font-bold text-white text-xs">
                          {xmlResult.companyName || 'Tally Client Company'}
                        </span>
                        <span className="text-slate-400 text-[11px] block">
                          Parsed {xmlResult.totalVouchers} vouchers successfully
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 text-right">
                      <div className="text-[11px]">
                        <span className="text-slate-400 block">Total Volume</span>
                        <span className="font-mono font-bold text-amber-300">
                          {formatINR(xmlResult.totalDebit)}
                        </span>
                      </div>
                      <button
                        onClick={handleApplyImport}
                        className="px-3.5 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-500 text-white font-semibold transition flex items-center gap-1.5 shadow-sm"
                      >
                        <span>Run Screening</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {xmlResult.warnings.length > 0 && (
                    <div className="p-2.5 rounded-lg bg-teal-950/40 border border-teal-800/60 text-teal-300 text-[11px] flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-teal-400 shrink-0" />
                      <span>{xmlResult.warnings.join(' ')}</span>
                    </div>
                  )}

                  {/* Vouchers Preview Table */}
                  <div className="overflow-x-auto max-h-40 border border-slate-800 rounded-lg">
                    <table className="min-w-full text-[11px] text-left text-slate-300">
                      <thead className="bg-slate-900 text-slate-400 uppercase text-[10px] sticky top-0 border-b border-slate-800">
                        <tr>
                          <th className="py-1.5 px-2.5">Date</th>
                          <th className="py-1.5 px-2.5">Voucher No</th>
                          <th className="py-1.5 px-2.5">Type</th>
                          <th className="py-1.5 px-2.5">Ledger</th>
                          <th className="py-1.5 px-2.5">Narration</th>
                          <th className="py-1.5 px-2.5 text-right">Debit (₹)</th>
                          <th className="py-1.5 px-2.5 text-right">Credit (₹)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60 font-sans">
                        {xmlResult.transactions.map((t) => (
                          <tr key={t.id} className="hover:bg-slate-900/50">
                            <td className="py-1.5 px-2.5 font-mono whitespace-nowrap">{t.date}</td>
                            <td className="py-1.5 px-2.5 font-mono text-teal-400 whitespace-nowrap">{t.voucherNo}</td>
                            <td className="py-1.5 px-2.5 whitespace-nowrap">{t.voucherType}</td>
                            <td className="py-1.5 px-2.5 font-medium text-white max-w-[120px] truncate">{t.ledgerName}</td>
                            <td className="py-1.5 px-2.5 max-w-[180px] truncate text-slate-400">{t.particulars}</td>
                            <td className="py-1.5 px-2.5 text-right font-mono font-bold text-slate-200">
                              {t.debit > 0 ? formatINR(t.debit) : '-'}
                            </td>
                            <td className="py-1.5 px-2.5 text-right font-mono font-bold text-slate-200">
                              {t.credit > 0 ? formatINR(t.credit) : '-'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

            </div>
          )}

          {/* TAB 2: Pre-Built Datasets */}
          {activeTab === 'sample' && (
            <div className="space-y-3">
              <p className="text-slate-300">
                Choose a pre-configured audit dataset complete with realistic Indian statutory test cases, Form 3CD clauses, and CARO 2020 indicators:
              </p>

              {/* Sample 1: Manufacturing Pvt Ltd */}
              <div 
                onClick={() => {
                  onLoadManufacturingSample();
                  onClose();
                }}
                className="p-3.5 rounded-xl bg-slate-950 hover:bg-slate-800/80 border border-slate-800 hover:border-teal-500/50 cursor-pointer transition flex items-start gap-3 group"
              >
                <div className="p-2 rounded-lg bg-teal-500/10 text-teal-400 border border-teal-500/20 group-hover:bg-teal-500/20 transition">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div className="space-y-1 flex-1">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-white text-xs group-hover:text-teal-300 transition">
                      M/s Vardhaman Precision Engineering Pvt Ltd (FY 2024-25)
                    </h3>
                    <span className="text-[10px] font-mono bg-teal-950 text-teal-300 px-2 py-0.5 rounded border border-teal-800">
                      45 Vouchers
                    </span>
                  </div>
                  <p className="text-slate-400 text-[11px]">
                    Comprehensive manufacturing company dataset: Cash 40A(3) &gt; ₹10k, Loans 269SS/T/ST, TDS 194C/H/I/J/Q/R/195, Blocked GST 17(5), Section 185/186 loans, MSME 43B(h) delayed payables, and Smurfing cash structurings.
                  </p>
                </div>
              </div>

              {/* Sample 2: Trading LLP */}
              <div 
                onClick={() => {
                  onLoadLlpSample();
                  onClose();
                }}
                className="p-3.5 rounded-xl bg-slate-950 hover:bg-slate-800/80 border border-slate-800 hover:border-cyan-500/50 cursor-pointer transition flex items-start gap-3 group"
              >
                <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 group-hover:bg-cyan-500/20 transition">
                  <Building2 className="w-5 h-5" />
                </div>
                <div className="space-y-1 flex-1">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-white text-xs group-hover:text-cyan-300 transition">
                      Apex Global Logistics &amp; Trading LLP (FY 2025-26)
                    </h3>
                    <span className="text-[10px] font-mono bg-cyan-950 text-cyan-300 px-2 py-0.5 rounded border border-cyan-800">
                      Form 3CB/3CD
                    </span>
                  </div>
                  <p className="text-slate-400 text-[11px]">
                    Trading &amp; services firm scenario: Partner remuneration ceiling u/s 40(b), Section 194H brokerage, Goods movement without E-Way Bill, and cash partner loans.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: CSV File Upload */}
          {activeTab === 'csv' && (
            <div className="space-y-4">
              <div className="border-2 border-dashed border-slate-800 hover:border-teal-500/60 rounded-xl p-6 text-center cursor-pointer transition bg-slate-950/60">
                <input
                  type="file"
                  accept=".csv,.txt,.xml"
                  onChange={handleCsvFileUpload}
                  className="hidden"
                  id="csv-file-input"
                />
                <label htmlFor="csv-file-input" className="cursor-pointer space-y-2 block">
                  <UploadCloud className="w-8 h-8 text-teal-400 mx-auto" />
                  <span className="block font-semibold text-white">Choose CSV or XML file to upload</span>
                  <span className="block text-slate-500 text-[11px]">
                    Supports Tally Daybook CSV export (Date, Voucher No, Type, Ledger, Particulars, Debit, Credit)
                  </span>
                </label>
              </div>

              {parseError && (
                <div className="p-3 rounded-lg bg-rose-950/60 border border-rose-800 text-rose-300 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{parseError}</span>
                </div>
              )}

              {parsedPreview && (
                <div className="p-3 rounded-lg bg-emerald-950/60 border border-emerald-800 text-emerald-300 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Successfully parsed {parsedPreview.length} records!</span>
                  </div>
                  <button
                    onClick={handleApplyImport}
                    className="px-3 py-1 rounded bg-teal-600 hover:bg-teal-500 text-white font-semibold transition"
                  >
                    Run Audit Screening
                  </button>
                </div>
              )}
            </div>
          )}

          {/* TAB 4: Paste Raw Text */}
          {activeTab === 'paste' && (
            <div className="space-y-3">
              <label className="text-slate-400 block font-semibold">
                Paste comma-separated rows or Tally Daybook extract:
              </label>
              <textarea
                rows={6}
                value={csvPasteContent}
                onChange={(e) => setCsvPasteContent(e.target.value)}
                placeholder="2024-05-14, CP-01, Payment, Cash Account, Machine Repairs, 45000, 0, Cash, ABZPS4412M&#10;2024-06-20, CR-02, Receipt, Cash Account, Loan received, 0, 75000, Cash, AWVPJ5519R"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-teal-500 font-mono"
              />
              <button
                onClick={() => parseCsvText(csvPasteContent)}
                className="px-4 py-2 rounded-lg bg-teal-600 hover:bg-teal-500 text-white font-semibold transition"
              >
                Parse &amp; Screen
              </button>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between">
          <div className="text-[11px] text-slate-500">
            Export from Tally: <code className="text-slate-400 font-mono">Gateway of Tally &gt; Day Book &gt; Alt+E &gt; XML</code>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium transition"
          >
            Cancel
          </button>
        </div>

      </div>
    </div>
  );
};
