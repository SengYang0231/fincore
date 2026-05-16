import React, { useState, useEffect } from "react";
import { 
  Upload, 
  BarChart3, 
  Table as TableIcon, 
  Search, 
  History, 
  AlertTriangle, 
  ChevronRight,
  Loader2,
  FileText,
  Plus,
  Sparkles,
  RefreshCw,
  X,
  Maximize2,
  FileSearch
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  Cell
} from "recharts";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

// --- Utilities ---
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// --- Types ---
interface Metadata {
  CompanyName: string;
  FinancialYear: string;
  Sector: string;
  Currency: string;
  OriginalFileName?: string;
  StoredFileName?: string;
  DocType?: string;
}

interface Financials {
  incomeStatement: Record<string, string | number | null>;
  balanceSheet: Record<string, string | number | null>;
  cashFlow: Record<string, string | number | null>;
}

interface CompanyReport {
  Metadata: Metadata;
  Financials: Financials;
}

const BURSA_SECTORS = [
  "TECHNOLOGY",
  "PLANTATION",
  "FINANCIAL_SERVICES",
  "CONSUMER_PRODUCTS",
  "INDUSTRIAL_PRODUCTS",
  "REITS",
  "ENERGY",
  "HEALTHCARE",
  "CONSTRUCTION",
];

export default function App() {
  const [reports, setReports] = useState<CompanyReport[]>([]);
  const [year, setYear] = useState("2025");
  const [sector, setSector] = useState("TECHNOLOGY");
  const [isUploading, setIsUploading] = useState(false);
  const [analysisResults, setAnalysisResults] = useState<any[]>([]);
  const [view, setView] = useState<"dashboard" | "archive" | "upload">("upload");
  const [archive, setArchive] = useState<any[]>([]);
  const [selectedReport, setSelectedReport] = useState<CompanyReport | null>(null);
  const [pastedFiles, setPastedFiles] = useState<File[]>([]);
  
  // AI State
  const [aiInsight, setAiInsight] = useState<string | null>(null);
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);

  useEffect(() => {
    fetchArchive();
    
    const handlePaste = (e: ClipboardEvent) => {
      if (view !== "upload") return;
      const items = e.clipboardData?.items;
      if (!items) return;
      
      const files: File[] = [];
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf("image") !== -1 || items[i].type === "application/pdf") {
          const blob = items[i].getAsFile();
          if (blob) {
            const file = new File([blob], `pasted-asset-${Date.now()}.${blob.type.split('/')[1]}`, { type: blob.type });
            files.push(file);
          }
        }
      }
      if (files.length > 0) {
        setPastedFiles(prev => [...prev, ...files]);
      }
    };

    window.addEventListener("paste", handlePaste);
    return () => window.removeEventListener("paste", handlePaste);
  }, [view]);

  const fetchArchive = async () => {
    try {
      const res = await fetch("/api/archive");
      const data = await res.json();
      setArchive(data);
    } catch (err) {
      console.error(err);
    }
  };

  const loadReports = async (y: string, s: string) => {
    try {
      setAiInsight(null);
      const res = await fetch(`/api/reports/${y}/${s}`);
      const data = await res.json();
      setReports(data);
      setView("dashboard");
    } catch (err) {
      console.error(err);
    }
  };

  const generateAIInsights = async () => {
    if (reports.length === 0) return;
    setIsGeneratingAi(true);
    try {
      const res = await fetch("/api/ai-insights", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reports,
          sector,
          year
        }),
      });
      
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setAiInsight(data.text);
    } catch (err: any) {
      console.error("AI Insight Error:", err);
      setAiInsight(`[ERROR]: Analysis Failure - ${err.message}. VERIFY API_KEY.`);
    } finally {
      setIsGeneratingAi(false);
    }
  };

  const handleUpload = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsUploading(true);
    const formData = new FormData(e.currentTarget);
    formData.append("year", year);
    formData.append("sector", sector);
    
    // Add pasted files
    pastedFiles.forEach(file => {
      formData.append("reports", file);
    });

    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      setAnalysisResults(data.results);
      setPastedFiles([]);
      loadReports(year, sector);
      fetchArchive();
    } catch (err) {
      console.error(err);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-hacker-bg text-hacker-green font-mono selection:bg-hacker-green selection:text-hacker-bg overflow-x-hidden">
      <div className="scanline" />
      
      {/* Background Grid Animation */}
      <div className="fixed inset-0 pointer-events-none opacity-20 z-0 overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#003b00_1px,transparent_1px),linear-gradient(to_bottom,#003b00_1px,transparent_1px)] bg-[size:40px_40px]" />
        <div className="absolute inset-0 bg-radial-gradient from-transparent via-hacker-bg to-hacker-bg" />
      </div>

      {/* Sidebar Navigation */}
      <nav className="fixed left-0 top-0 bottom-0 w-20 bg-black/80 backdrop-blur-md border-r border-hacker-border flex flex-col items-center py-10 gap-10 z-50">
        <div className="w-12 h-12 border-2 border-hacker-green rounded flex items-center justify-center text-hacker-green mb-6 shadow-[0_0_15px_rgba(0,255,65,0.3)] bg-black">
          <span className="font-bold text-2xl tracking-tighter">FIN</span>
        </div>
        <NavItem 
          icon={<Plus className="w-6 h-6" />} 
          active={view === "upload"} 
          onClick={() => setView("upload")} 
          label="INGEST"
        />
        <NavItem 
          icon={<BarChart3 className="w-6 h-6" />} 
          active={view === "dashboard"} 
          onClick={() => setView("dashboard")} 
          label="DATA_MATRIX"
        />
        <NavItem 
          icon={<History className="w-6 h-6" />} 
          active={view === "archive"} 
          onClick={() => setView("archive")} 
          label="FILESYSTEM"
        />
      </nav>

      <main className="ml-20 p-10 max-w-7xl mx-auto relative z-10">
        <AnimatePresence mode="wait">
          {view === "upload" && (
            <motion.div
              key="upload"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="max-w-3xl"
            >
              <header className="mb-12">
                <h1 className="text-5xl font-serif mb-4 tracking-tighter">FINCORE // INGESTION_PROTOCOL</h1>
                <p className="text-hacker-green-dim text-xs tracking-[0.3em] opacity-80">BURSA MALAYSIA : SECTORIAL_COMPILATION_V1.0</p>
              </header>

              <div className="bg-black/50 backdrop-blur-sm rounded border border-hacker-border p-10 shadow-[0_0_30px_rgba(0,59,0,0.2)] relative">
                <div className="absolute -top-4 -right-4 bg-hacker-bg border border-hacker-green px-3 py-1 text-[10px] font-bold z-20">
                  CTRL+V SUPPORT ENABLED
                </div>
                <form onSubmit={handleUpload} className="space-y-8">
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <label className="text-xs uppercase tracking-widest text-hacker-green-bright block font-bold border-b border-hacker-border pb-2 glow-text">PARAM_YEAR</label>
                      <select 
                        value={year}
                        onChange={(e) => setYear(e.target.value)}
                        className="w-full bg-black border border-hacker-border rounded-none px-5 py-4 focus:outline-none focus:border-hacker-green text-sm transition-all text-white font-bold"
                      >
                        {["2025", "2024", "2023", "2022"].map(y => (
                          <option key={y} value={y} className="bg-black">{y}</option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-4">
                      <label className="text-xs uppercase tracking-widest text-hacker-green-bright block font-bold border-b border-hacker-border pb-2 glow-text">PARAM_SECTOR</label>
                      <select 
                        value={sector}
                        onChange={(e) => setSector(e.target.value)}
                        className="w-full bg-black border border-hacker-border rounded-none px-5 py-4 focus:outline-none focus:border-hacker-green text-sm transition-all text-white font-bold"
                      >
                        {BURSA_SECTORS.map(s => (
                          <option key={s} value={s} className="bg-black">{s.replace("_", " ")}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <label className="text-xs uppercase tracking-widest text-hacker-green-bright block font-bold border-b border-hacker-border pb-2 glow-text">DOC_SOURCE</label>
                    <div className="relative group">
                      <input 
                        type="file" 
                        name="reports" 
                        multiple 
                        accept=".pdf,image/*"
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                      />
                      <div className="border border-hacker-border border-dashed rounded-none p-16 flex flex-col items-center justify-center gap-6 group-hover:bg-hacker-green/5 transition-all text-center">
                        <Upload className="w-10 h-10 text-hacker-green-dim group-hover:text-hacker-green animate-pulse" />
                        <div className="space-y-1">
                          <span className="text-sm tracking-wide text-white">INITIALIZE_FILE_DROP</span>
                          <p className="text-[10px] text-hacker-green-dim uppercase">PDF // IMAGE // SCREENSHOT_PASTE</p>
                        </div>
                      </div>
                    </div>
                    
                    {pastedFiles.length > 0 && (
                      <div className="grid grid-cols-4 gap-2 mt-4">
                        {pastedFiles.map((f, idx) => (
                          <div key={idx} className="border border-hacker-green p-2 text-[10px] flex items-center justify-between bg-hacker-green/10">
                            <span className="truncate max-w-[80%]">{f.name}</span>
                            <X className="w-3 h-3 cursor-pointer" onClick={() => setPastedFiles(prev => prev.filter((_, i) => i !== idx))} />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <button 
                    type="submit"
                    disabled={isUploading}
                    className="w-full bg-hacker-green text-black rounded-none py-5 font-bold flex items-center justify-center gap-3 hover:bg-[#00cc33] transition-all disabled:opacity-30 group shadow-[0_0_20px_rgba(0,255,65,0.2)]"
                  >
                    {isUploading ? (
                      <>
                        <Loader2 className="w-6 h-6 animate-spin" />
                        <span className="tracking-[0.2em]">PARSING_COORDINATES...</span>
                      </>
                    ) : (
                      <>
                        <RefreshCw className="w-6 h-6 group-hover:rotate-180 transition-transform duration-500" />
                        <span className="tracking-[0.2em]">EXECUTE_ANALYSIS</span>
                      </>
                    )}
                  </button>
                </form>
              </div>

              {analysisResults.length > 0 && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="mt-12 space-y-4"
                >
                  <h3 className="text-xs uppercase tracking-widest text-hacker-green-dim font-bold underline underline-offset-8">LOG_OUTPUT:</h3>
                  <div className="space-y-2 font-mono">
                    {analysisResults.map((res, i) => (
                      <div key={i} className="bg-black/30 border border-hacker-border p-5 flex items-center justify-between text-xs tracking-tighter">
                        <div className="flex items-center gap-4">
                          <FileText className="w-4 h-4" />
                          <div>
                            <p className="uppercase">{res.companyName}</p>
                            <p className="text-hacker-green-dim opacity-60">SRCH_MATCH: {res.detectedSector}</p>
                          </div>
                        </div>
                        {res.isConflict ? (
                          <div className="flex items-center gap-2 text-red-500 font-bold border border-red-900 px-3 py-1 bg-red-950/20">
                            <AlertTriangle className="w-3 h-3" />
                            <span>CONFL_WARN</span>
                          </div>
                        ) : (
                          <div className="text-hacker-green font-bold border border-hacker-green px-3 py-1 bg-hacker-green/10">
                            OK
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                  <button 
                    onClick={() => setView("dashboard")}
                    className="w-full flex items-center justify-center gap-3 text-xs font-bold text-hacker-green hover:underline py-6 tracking-widest group"
                  >
                    ACCESS_DASHBOARD <ChevronRight className="w-4 h-4 group-hover:translate-x-2 transition-transform" />
                  </button>
                </motion.div>
              )}
            </motion.div>
          )}

          {view === "dashboard" && reports.length > 0 && (
            <motion.div
              key="dashboard"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-12"
            >
              <header className="flex items-end justify-between border-b border-hacker-border pb-10">
                <div>
                  <h1 className="text-5xl font-serif mb-4 tracking-tighter uppercase underline decoration-double decoration-hacker-green/30 offset-8">DATA_MATRIX_OVERLAY</h1>
                  <p className="text-hacker-green-dim text-xs tracking-[0.4em] opacity-80">
                    TARGET: {sector} // FY: {year}
                  </p>
                </div>
                <div className="flex items-center gap-6">
                  <div className="text-right">
                    <p className="text-[10px] text-hacker-green-dim uppercase tracking-widest mb-3 font-bold">DETECTED_PEERS</p>
                    <div className="flex gap-3">
                      {reports.map((r, i) => (
                        <div key={i} title={r.Metadata.CompanyName} className="w-10 h-10 border border-hacker-green flex items-center justify-center text-xs font-bold bg-hacker-green/5 shadow-[0_0_10px_rgba(0,255,65,0.1)]">
                          {r.Metadata.CompanyName.charAt(0)}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </header>

              {/* ZAI Insights Section */}
              <section className="bg-black border border-hacker-border p-10 overflow-hidden relative group shadow-[inset_0_0_50px_rgba(0,255,65,0.05)]">
                <div className="absolute top-0 right-0 p-10 opacity-5 group-hover:opacity-10 transition-opacity">
                  <Sparkles className="w-48 h-48" />
                </div>
                <div className="relative z-10 space-y-8">
                  <div className="flex items-center justify-between border-b border-hacker-border pb-6">
                    <div className="flex items-center gap-4">
                      <div className="w-2 h-2 bg-hacker-green rounded-full animate-ping" />
                      <h2 className="text-sm uppercase tracking-[0.5em] font-bold text-hacker-green">ZAI_CORE_ANALYTIC</h2>
                    </div>
                    <button 
                      onClick={generateAIInsights}
                      disabled={isGeneratingAi}
                      className="border border-hacker-green hover:bg-hacker-green hover:text-black px-6 py-2 text-xs font-bold flex items-center gap-3 transition-all disabled:opacity-30 tracking-[0.2em] shadow-[0_0_15px_rgba(0,255,65,0.1)]"
                    >
                      {isGeneratingAi ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                      {aiInsight ? "REGEN_STREAM" : "INITIALIZE_SMART_SYNC"}
                    </button>
                  </div>

                  {aiInsight ? (
                    <motion.div 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="border-l-2 border-hacker-green pl-8"
                    >
                      <div className="whitespace-pre-wrap font-mono leading-relaxed text-sm tracking-tighter opacity-90">
                        <span className="text-hacker-green-dim">[ZAI://OUT]: </span>
                        {aiInsight}
                      </div>
                    </motion.div>
                  ) : (
                    <div className="text-hacker-green-dim text-sm italic font-serif py-4 opacity-50 tracking-widest">
                      {isGeneratingAi ? "PENDING: SYMBOLIC_SYNTHESIS_IN_PROGRESS..." : "INFO: STANDBY_FOR_QUALITATIVE_DATA_INTERPRETATION"}
                    </div>
                  )}
                </div>
              </section>

              {/* Charts Section */}
              <section className="grid grid-cols-1 md:grid-cols-2 gap-10">
                <ChartContainer title="REVENUE_MAP (MYR'000)">
                  <ResponsiveContainer width="100%" height={350}>
                    <BarChart data={reports.map(r => ({ name: r.Metadata.CompanyName.split(" ")[0], value: parseFloat(String(r.Financials.incomeStatement.revenue || 0)) }))}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#003b00" />
                      <XAxis dataKey="name" fontSize={10} axisLine={{ stroke: '#003b00' }} tickLine={false} tick={{ fill: '#008f11' }} />
                      <YAxis fontSize={10} axisLine={{ stroke: '#003b00' }} tickLine={false} tick={{ fill: '#008f11' }} />
                      <Tooltip contentStyle={{ backgroundColor: '#0d0208', border: '1px solid #003b00', color: '#00ff41' }} cursor={{ fill: 'rgba(0,255,65,0.05)' }} />
                      <Bar dataKey="value" fill="#00ff41" radius={[0, 0, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </ChartContainer>

                <ChartContainer title="NET_PROFIT_SIG (MYR'000)">
                  <ResponsiveContainer width="100%" height={350}>
                    <BarChart data={reports.map(r => ({ name: r.Metadata.CompanyName.split(" ")[0], value: parseFloat(String(r.Financials.incomeStatement.netProfit || 0)) }))}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#003b00" />
                      <XAxis dataKey="name" fontSize={10} axisLine={{ stroke: '#003b00' }} tickLine={false} tick={{ fill: '#008f11' }} />
                      <YAxis fontSize={10} axisLine={{ stroke: '#003b00' }} tickLine={false} tick={{ fill: '#008f11' }} />
                      <Tooltip contentStyle={{ backgroundColor: '#0d0208', border: '1px solid #003b00', color: '#00ff41' }} cursor={{ fill: 'rgba(0,255,65,0.05)' }} />
                      <Bar dataKey="value" fill="#008f11" radius={[0, 0, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </section>

              {/* Matrix Table */}
              <section className="overflow-x-auto bg-black border border-hacker-border shadow-[0_0_40px_rgba(0,59,0,0.1)]">
                <table className="w-full text-left border-collapse min-w-[800px]">
                  <thead>
                    <tr className="bg-hacker-green text-black border-b border-hacker-border">
                      <th className="p-6 text-[11px] font-bold uppercase tracking-[0.3em]">INDICATOR_ID</th>
                      {reports.map((r, i) => (
                        <th key={i} className="p-6 text-xs font-bold border-l border-hacker-bg uppercase tracking-widest text-center">
                          <div className="flex flex-col items-center gap-2">
                            <span className="truncate max-w-[120px]">{r.Metadata.CompanyName}</span>
                            <button 
                              onClick={() => setSelectedReport(r)}
                              className="text-[9px] border border-black px-2 py-0.5 hover:bg-black hover:text-hacker-green transition-all"
                            >
                              VIEW_ORIGINAL
                            </button>
                          </div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="text-xs">
                    <MatrixRow label="REVENUE_TOTAL" id="revenue" category="incomeStatement" reports={reports} />
                    <MatrixRow label="EXPENDITURE_COGS" id="costOfSales" category="incomeStatement" reports={reports} />
                    <MatrixRow label="MARGIN_GROSS" id="grossProfit" category="incomeStatement" reports={reports} />
                    <MatrixRow label="MARGIN_NET" id="netProfit" category="incomeStatement" reports={reports} />
                    <tr className="bg-black border-y border-hacker-border/50">
                      <td colSpan={reports.length + 1} className="px-6 py-3 text-[10px] uppercase tracking-[0.5em] font-bold text-hacker-green/40">REF://BALANCE_SHEET</td>
                    </tr>
                    <MatrixRow label="ASSETS_AGGREGATE" id="totalAssets" category="balanceSheet" reports={reports} />
                    <MatrixRow label="LIABILITIES_AGGREGATE" id="totalLiabilities" category="balanceSheet" reports={reports} />
                    <tr className="bg-black border-y border-hacker-border/50">
                      <td colSpan={reports.length + 1} className="px-6 py-3 text-[10px] uppercase tracking-[0.5em] font-bold text-hacker-green/40">REF://CASH_FLOW</td>
                    </tr>
                    <MatrixRow label="FLOW_OPERATING" id="operatingCashFlow" category="cashFlow" reports={reports} />
                  </tbody>
                </table>
              </section>
            </motion.div>
          )}

          {view === "dashboard" && reports.length === 0 && (
            <div className="h-96 flex flex-col items-center justify-center text-hacker-green-dim gap-6">
              <TableIcon className="w-16 h-16 opacity-10 animate-pulse" />
              <p className="text-xs font-bold uppercase tracking-[0.6em] opacity-40">NULL_QUERY_RESULT</p>
              <button 
                onClick={() => setView("upload")}
                className="text-xs text-hacker-green border-b border-hacker-green pb-1 hover:text-white transition-colors"
              >
                RETRIEVE_SOURCE_DATA
              </button>
            </div>
          )}

          {view === "archive" && (
            <motion.div
              key="archive"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
            >
              <header className="mb-16 border-b border-hacker-border pb-10">
                <h1 className="text-5xl font-serif mb-4 tracking-tighter italic">FILESYSTEM_REPOSITORY</h1>
                <p className="text-hacker-green-dim text-xs tracking-[0.3em] opacity-80">LOCAL_STORAGE // PERSISTED_XML_NODES</p>
              </header>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                {archive.length > 0 ? archive.map((yItem, i) => (
                  <div key={i} className="space-y-6">
                    <h2 className="text-3xl font-serif text-white flex items-center gap-4">
                      <span className="text-hacker-green text-sm opacity-50 font-mono">/</span>
                      {yItem.year}
                    </h2>
                    <div className="space-y-3">
                      {yItem.sectors.map((s: string, j: number) => (
                        <button
                          key={j}
                          onClick={() => {
                            setYear(yItem.year);
                            setSector(s);
                            loadReports(yItem.year, s);
                          }}
                          className="w-full bg-black/40 p-6 border border-hacker-border flex items-center justify-between group hover:border-hacker-green hover:bg-black transition-all shadow-sm"
                        >
                          <span className="text-xs font-bold uppercase tracking-widest">{s.replace("_", " ")}</span>
                          <ChevronRight className="w-5 h-5 text-hacker-green-dim group-hover:text-hacker-green group-hover:translate-x-1 transition-all" />
                        </button>
                      ))}
                    </div>
                  </div>
                )) : (
                  <div className="col-span-full h-80 flex flex-col items-center justify-center text-hacker-green-dim gap-6">
                    <History className="w-16 h-16 opacity-10" />
                    <p className="text-xs font-bold uppercase tracking-[0.6em] opacity-40">FS_EMPTY_STATE</p>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Doc Viewer Overlay */}
        <AnimatePresence>
          {selectedReport && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/90 backdrop-blur-md z-[100] flex flex-col p-10"
            >
              <div className="flex items-center justify-between mb-6 border-b border-hacker-border pb-6">
                <div>
                  <h2 className="text-2xl font-bold tracking-tighter text-hacker-green glow-text">SOURCE_DOCUMENT_VIEWER</h2>
                  <p className="text-xs text-hacker-green-dim">FILE: {selectedReport.Metadata.OriginalFileName} // TYPE: {selectedReport.Metadata.DocType}</p>
                </div>
                <button 
                  onClick={() => setSelectedReport(null)}
                  className="w-12 h-12 border border-hacker-green flex items-center justify-center hover:bg-hacker-green hover:text-black transition-all"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              
              <div className="flex-1 bg-neutral-900 border border-hacker-border overflow-hidden relative">
                {selectedReport.Metadata.DocType === "IMAGE" ? (
                  <div className="w-full h-full overflow-auto p-10 flex justify-center bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]">
                    <img 
                      src={`/reports/${selectedReport.Metadata.StoredFileName}`} 
                      alt="Source Financial" 
                      className="max-w-none shadow-2xl border border-hacker-border" 
                    />
                  </div>
                ) : (
                  <iframe 
                    src={`/reports/${selectedReport.Metadata.StoredFileName}#toolbar=0`} 
                    className="w-full h-full filter invert hue-rotate-180 brightness-90 contrast-110"
                    title="Financial Report"
                  />
                )}
                
                <div className="absolute bottom-6 right-6 flex gap-4">
                  <a 
                    href={`/reports/${selectedReport.Metadata.StoredFileName}`} 
                    target="_blank" 
                    className="bg-hacker-green text-black px-6 py-2 text-xs font-bold shadow-[0_0_20px_rgba(0,255,65,0.3)] hover:scale-105 transition-transform"
                  >
                    OPEN_IN_NEW_TAB
                  </a>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}

function NavItem({ icon, active, onClick, label }: any) {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "relative w-14 h-14 flex items-center justify-center transition-all group",
        active 
          ? "bg-hacker-green text-black shadow-[0_0_20px_rgba(0,255,65,0.4)]" 
          : "text-hacker-green-dim hover:text-hacker-green hover:bg-hacker-green/10"
      )}
    >
      {icon}
      <span className="absolute left-full ml-5 px-3 py-1 bg-hacker-green text-black font-bold text-[10px] rounded-none opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50 tracking-[0.2em]">
        {label}
      </span>
    </button>
  );
}

function ChartContainer({ title, children }: any) {
  return (
    <div className="bg-black/50 p-10 border border-hacker-border shadow-inner space-y-8 group hover:border-hacker-green transition-colors">
      <h3 className="text-xs uppercase tracking-[0.5em] font-bold text-hacker-green-bright border-b border-hacker-border pb-4 glow-text">{title}</h3>
      {children}
    </div>
  );
}

function MatrixRow({ label, id, category, reports }: any) {
  return (
    <tr className="border-b border-hacker-border/20 hover:bg-hacker-green/10 transition-all group">
      <td className="p-6 text-xs font-bold text-hacker-green group-hover:text-hacker-green-bright tracking-tighter glow-text">{label}</td>
      {reports.map((r: CompanyReport, i: number) => {
        const val = r.Financials[category as keyof Financials][id];
        return (
          <td key={i} className="p-6 text-sm font-mono border-l border-hacker-border/20 text-center">
            {val ? (
              <span className="text-hacker-green-bright font-bold glow-text">
                {Number(val).toLocaleString()}
              </span>
            ) : (
              <span className="text-hacker-green-dim/20">NULL</span>
            )}
          </td>
        )
      })}
    </tr>
  );
}

