import React from "react";
import { FileSearch, Sparkles, Loader2, Eye } from "lucide-react";
import { motion } from "motion/react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { CompanyReport } from "../types";
import { safeNum } from "../constants";
import { ChartBox } from "./ChartBox";
import { SectionRow } from "./SectionRow";
import { DataRow } from "./DataRow";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: any[]) {
  return twMerge(clsx(inputs));
}

interface DashboardViewProps {
  key?: string;
  reports: CompanyReport[];
  sector: string;
  year: string;
  setView: (view: "upload" | "dashboard" | "archive") => void;
  setSelectedReport: (report: CompanyReport | null) => void;
  generateAIInsights: () => void;
  isGeneratingAi: boolean;
  aiInsight: string | null;
}

export function DashboardView({
  reports,
  sector,
  year,
  setView,
  setSelectedReport,
  generateAIInsights,
  isGeneratingAi,
  aiInsight,
}: DashboardViewProps) {
  // Chart data
  const revenueData = reports.map((r) => ({
    name: r.Metadata.CompanyName.split(" ")[0].slice(0, 12),
    Revenue: safeNum(r.Financials.incomeStatement?.revenue),
    "Net Profit": safeNum(r.Financials.incomeStatement?.netProfit),
    "Gross Profit": safeNum(r.Financials.incomeStatement?.grossProfit),
  }));

  const balanceData = reports.map((r) => ({
    name: r.Metadata.CompanyName.split(" ")[0].slice(0, 12),
    Assets: safeNum(r.Financials.balanceSheet?.totalAssets),
    Liabilities: safeNum(r.Financials.balanceSheet?.totalLiabilities),
  }));

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="space-y-10 font-mono"
    >
      {reports.length === 0 ? (
        <div className="h-[60vh] flex flex-col items-center justify-center gap-6 text-hacker-green-dim">
          <FileSearch className="w-16 h-16 opacity-20" />
          <p className="text-xs tracking-[0.5em] opacity-50">NO_DATA_LOADED</p>
          <button
            onClick={() => setView("upload")}
            className="text-xs border border-hacker-border px-6 py-2 hover:border-hacker-green hover:text-hacker-green transition-all cursor-pointer"
          >
            → INGEST_DOCUMENTS
          </button>
        </div>
      ) : (
        <>
          {/* Header */}
          <header className="border-b border-hacker-border pb-8 flex items-end justify-between">
            <div>
              <p className="text-[10px] tracking-[0.5em] text-hacker-green-dim mb-2">{sector.replace(/_/g, " ")} // FY{year}</p>
              <h1 className="text-4xl font-serif tracking-tight glow-text">DATA_MATRIX</h1>
            </div>
            <div className="flex items-center gap-2">
              {reports.map((r, i) => (
                <div
                  key={i}
                  title={r.Metadata.CompanyName}
                  className="w-9 h-9 border border-hacker-green bg-hacker-green/10 flex items-center justify-center text-xs font-bold text-hacker-green cursor-pointer hover:bg-hacker-green hover:text-black transition-all"
                  onClick={() => setSelectedReport(r)}
                >
                  {r.Metadata.CompanyName.charAt(0)}
                </div>
              ))}
            </div>
          </header>

          {/* AI Insights */}
          <section className="bg-black border border-hacker-border p-8 relative overflow-hidden">
            <div className="absolute -top-8 -right-8 opacity-[0.03]">
              <Sparkles className="w-64 h-64" />
            </div>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-hacker-green animate-pulse" />
                <h2 className="text-[10px] tracking-[0.5em] font-bold">ZAI_CORE_ANALYTICS</h2>
              </div>
              <button
                onClick={generateAIInsights}
                disabled={isGeneratingAi}
                className="border border-hacker-green px-5 py-2 text-[11px] font-bold flex items-center gap-2 hover:bg-hacker-green hover:text-black transition-all disabled:opacity-40 tracking-widest cursor-pointer"
              >
                {isGeneratingAi ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                {aiInsight ? "REGENERATE" : "INITIALIZE"}
              </button>
            </div>
            {aiInsight ? (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="border-l-2 border-hacker-green pl-6 text-sm leading-relaxed whitespace-pre-wrap opacity-90">
                <span className="text-hacker-green-dim text-xs">[ZAI://ANALYSIS] </span>
                {aiInsight}
              </motion.div>
            ) : (
              <p className="text-hacker-green-dim text-xs italic opacity-40 tracking-widest">
                {isGeneratingAi ? "SYNTHESIZING_QUALITATIVE_INSIGHT..." : "STANDBY // AWAITING_INITIALIZATION"}
              </p>
            )}
          </section>

          {/* Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {reports.map((r, i) => {
              const rev = safeNum(r.Financials.incomeStatement?.revenue);
              const net = safeNum(r.Financials.incomeStatement?.netProfit);
              const margin = rev > 0 ? ((net / rev) * 100).toFixed(1) : "—";
              return (
                <div key={i} className="bg-black border border-hacker-border p-5 hover:border-hacker-green transition-colors cursor-pointer group" onClick={() => setSelectedReport(r)}>
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-7 h-7 border border-hacker-green bg-hacker-green/10 flex items-center justify-center text-xs font-bold group-hover:bg-hacker-green group-hover:text-black transition-all">
                      {r.Metadata.CompanyName.charAt(0)}
                    </div>
                    <Eye className="w-3 h-3 text-hacker-green-dim opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                  <p className="text-xs font-bold truncate mb-1">{r.Metadata.CompanyName}</p>
                  <p className="text-[10px] text-hacker-green-dim mb-3">{r.Metadata.DocType}</p>
                  <div className="space-y-1 text-[10px]">
                    <div className="flex justify-between">
                      <span className="text-hacker-green-dim">Revenue</span>
                      <span className="font-bold">{rev > 0 ? (rev / 1000).toFixed(0) + "M" : "—"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-hacker-green-dim">Net Margin</span>
                      <span className={cn("font-bold", net < 0 ? "text-red-400" : "text-hacker-green")}>{margin}{margin !== "—" ? "%" : ""}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ChartBox title="INCOME_STATEMENT_OVERLAY (MYR '000)">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={revenueData} barGap={4}>
                  <CartesianGrid strokeDasharray="2 4" vertical={false} stroke="#003b00" />
                  <XAxis dataKey="name" fontSize={9} tick={{ fill: "#008f11" }} axisLine={false} tickLine={false} />
                  <YAxis fontSize={9} tick={{ fill: "#008f11" }} axisLine={false} tickLine={false} tickFormatter={(v) => v >= 1000 ? `${(v / 1000).toFixed(0)}M` : v} />
                  <Tooltip contentStyle={{ background: "#0d0208", border: "1px solid #003b00", color: "#00ff41", fontSize: 11 }} />
                  <Legend wrapperStyle={{ fontSize: 10, color: "#008f11" }} />
                  <Bar dataKey="Revenue" fill="#00ff41" radius={[2, 2, 0, 0]} maxBarSize={40} />
                  <Bar dataKey="Gross Profit" fill="#008f11" radius={[2, 2, 0, 0]} maxBarSize={40} />
                  <Bar dataKey="Net Profit" fill="#003b00" radius={[2, 2, 0, 0]} maxBarSize={40} />
                </BarChart>
              </ResponsiveContainer>
            </ChartBox>

            <ChartBox title="BALANCE_SHEET_SIGNAL (MYR '000)">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={balanceData} barGap={4}>
                  <CartesianGrid strokeDasharray="2 4" vertical={false} stroke="#003b00" />
                  <XAxis dataKey="name" fontSize={9} tick={{ fill: "#008f11" }} axisLine={false} tickLine={false} />
                  <YAxis fontSize={9} tick={{ fill: "#008f11" }} axisLine={false} tickLine={false} tickFormatter={(v) => v >= 1000 ? `${(v / 1000).toFixed(0)}M` : v} />
                  <Tooltip contentStyle={{ background: "#0d0208", border: "1px solid #003b00", color: "#00ff41", fontSize: 11 }} />
                  <Legend wrapperStyle={{ fontSize: 10, color: "#008f11" }} />
                  <Bar dataKey="Assets" fill="#00ff41" radius={[2, 2, 0, 0]} maxBarSize={40} />
                  <Bar dataKey="Liabilities" fill="#39ff14" radius={[2, 2, 0, 0]} maxBarSize={40} />
                </BarChart>
              </ResponsiveContainer>
            </ChartBox>
          </div>

          {/* Data Matrix Table */}
          <div className="overflow-x-auto border border-hacker-border bg-black">
            <table className="w-full text-left border-collapse" style={{ minWidth: Math.max(600, reports.length * 200) }}>
              <thead>
                <tr className="bg-hacker-green text-black">
                  <th className="px-6 py-4 text-[10px] font-bold tracking-[0.3em] uppercase w-48 font-mono">INDICATOR</th>
                  {reports.map((r, i) => (
                    <th key={i} className="px-6 py-4 text-[10px] font-bold border-l border-black/20 text-center font-mono">
                      <div className="flex flex-col items-center gap-1.5">
                        <span className="truncate max-w-[160px] block">{r.Metadata.CompanyName}</span>
                        <button
                          onClick={() => setSelectedReport(r)}
                          className="text-[9px] border border-black/40 px-2 py-0.5 hover:bg-black hover:text-hacker-green transition-all rounded-none cursor-pointer"
                        >
                          VIEW_SOURCE
                        </button>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="text-xs divide-y divide-hacker-border/20">
                <SectionRow label="INCOME_STATEMENT" colSpan={reports.length + 1} />
                <DataRow label="Revenue (RM '000)" id="revenue" cat="incomeStatement" reports={reports} />
                <DataRow label="Operating Expenses (RM '000)" id="operatingExpenses" cat="incomeStatement" reports={reports} />
                <DataRow label="Operating Profit (RM '000)" id="operatingProfit" cat="incomeStatement" reports={reports} />
                <tr>
                  <td colSpan={reports.length + 1} className="py-2">
                    <div className="h-[1px] bg-hacker-border/20 w-full"></div>
                  </td>
                </tr>

                <DataRow label="EBIT" id="ebit" cat="incomeStatement" reports={reports} tooltip="Earning Before Interest & Taxes"/>
                <DataRow label="EBITDA" id="ebitda" cat="incomeStatement" reports={reports} tooltip="Earning Before Interest, Taxes, Depreciation & Amortilization"/>
                <DataRow label="Gross Profit" id="grossProfit" cat="incomeStatement" reports={reports} tooltip="Revenue - Cost of Goods Sold (COGS)"/>
                <DataRow label="Tax Expense" id="taxExpense" cat="incomeStatement" reports={reports} />
                <DataRow label="Net Profit" id="netProfit" cat="incomeStatement" reports={reports} tooltip="EBIT - COGS"/>
                <tr>
                  <td colSpan={reports.length + 1} className="py-2">
                    <div className="h-[1px] bg-hacker-border/20 w-full"></div>
                  </td>
                </tr>

                <SectionRow label="ASSETS" colSpan={reports.length + 1} />
                <DataRow label="Non-Current Assets" id="currentAssets" cat="balanceSheet" reports={reports} />
                <DataRow label="PPE" id="ppe" cat="balanceSheet" reports={reports} tooltip="Property, Plant, Equipment"/>
                <DataRow label="Intangible Assets" id="intangibleAssets" cat="balanceSheet" reports={reports} tooltip="Valued assets but not physical"/>
                <tr>
                  <td colSpan={reports.length + 1} className="py-2">
                    <div className="h-[1px] bg-hacker-border/20 w-full"></div>
                  </td>
                </tr>
                <DataRow label="Current Assets" id="currentAssets" cat="balanceSheet" reports={reports} />
                <tr>
                  <td colSpan={reports.length + 1} className="py-2">
                    <div className="h-[1px] bg-hacker-border/20 w-full"></div>
                  </td>
                </tr>
                <DataRow label="Total Assets" id="totalAssets" cat="balanceSheet" reports={reports} />

                <SectionRow label="LIABILITY" colSpan={reports.length + 1} />
                <DataRow label="Total Liabilities" id="totalLiabilities" cat="balanceSheet" reports={reports} />
                
                <DataRow label="Cash & Equivalents" id="cashAndEquivalents" cat="balanceSheet" reports={reports} />
                <DataRow label="Total Equity" id="totalEquity" cat="balanceSheet" reports={reports} />
                <tr>
                  <td colSpan={reports.length + 1} className="py-2">
                    <div className="h-[1px] bg-hacker-border/20 w-full"></div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </>
      )}
    </motion.div>
  );
}
