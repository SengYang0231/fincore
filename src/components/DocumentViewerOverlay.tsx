import React from "react";
import { Edit3, Save, X, Sparkles, Loader2, FilePlus2 } from "lucide-react";
import { motion } from "motion/react";
import { CompanyReport, Financials } from "../types";
import { FIELD_LABELS, CATEGORY_LABELS, formatNum, FINANCIAL_DICTIONARY } from "../constants";

interface DocumentViewerOverlayProps {
  report: CompanyReport;
  onClose: () => void;
  isEditing: boolean;
  onStartEdit: () => void;
  editingReport: CompanyReport | null;
  onEditChange: (financials: Financials) => void;
  onCompanyNameChange: (companyName: string) => void;
  onSaveEdit: () => void;
  onCancelEdit: () => void;
  onAppendDocuments: (files: File[]) => Promise<void>;
  isAppendingDocuments?: boolean;
  onAiReanalyze?: (storedFileName: string, docType: string, markdown?: string) => Promise<void>;
  isReanalyzing?: boolean;
}

export function DocumentViewerOverlay({
  report,
  onClose,
  isEditing,
  onStartEdit,
  editingReport,
  onEditChange,
  onCompanyNameChange,
  onSaveEdit,
  onCancelEdit,
  onAppendDocuments,
  isAppendingDocuments,
  onAiReanalyze,
  isReanalyzing,
}: DocumentViewerOverlayProps) {
  const displayReport = editingReport || report;

  const updateField = (category: keyof Financials, fieldId: string, value: string) => {
    if (!editingReport) return;
    const newFinancials = { ...editingReport.Financials };
    if (!newFinancials[category]) {
      (newFinancials as any)[category] = {};
    }
    (newFinancials[category] as any)[fieldId] = value || null;
    onEditChange(newFinancials);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-[200] flex flex-col font-sans"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-8 py-4 border-b border-slate-200 bg-white flex-shrink-0 shadow-xs">
        <div>
          {isEditing ? (
            <input
              type="text"
              value={displayReport.Metadata.CompanyName}
              onChange={(e) => onCompanyNameChange(e.target.value)}
              className="w-full min-w-[260px] max-w-[520px] bg-white border border-slate-200 rounded-lg px-3 py-2 text-lg font-extrabold text-slate-800 focus:outline-none focus:border-hacker-green focus:ring-1 focus:ring-hacker-green/25"
              placeholder="Company name"
            />
          ) : (
            <h2 className="text-lg font-extrabold text-slate-800">{displayReport.Metadata.CompanyName}</h2>
          )}
          <p className="text-[10px] text-slate-400 mt-1 font-semibold tracking-wide">
            {displayReport.Metadata.OriginalFileName} // {displayReport.Metadata.DocType} // FY{displayReport.Metadata.FinancialYear}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {!isEditing ? (
            <>
              {displayReport.Metadata.StoredFileName && onAiReanalyze && (
                <button
                  type="button"
                  disabled={isReanalyzing}
                  onClick={() =>
                    onAiReanalyze(
                      displayReport.Metadata.StoredFileName!,
                      displayReport.Metadata.DocType || "DIGITAL_PDF",
                      displayReport.Markdown?.pureMarkdown || ""
                    )
                  }
                  className="text-[11px] font-bold border border-emerald-200 bg-emerald-50/50 rounded-lg px-4 py-2 flex items-center gap-2 hover:bg-hacker-green hover:text-white hover:border-hacker-green transition-all tracking-wide cursor-pointer disabled:opacity-50 shadow-3xs"
                >
                  {isReanalyzing ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                      Gemini AI Re-extract
                    </>
                  )}
                </button>
              )}
              <button
                onClick={onStartEdit}
                className="text-[11px] font-bold border border-slate-200 rounded-lg px-4 py-2 flex items-center gap-2 hover:bg-slate-50 text-slate-700 transition-all tracking-wide cursor-pointer shadow-3xs"
              >
                <Edit3 className="w-3.5 h-3.5 text-slate-500" /> Edit Data Values
              </button>
            </>
          ) : (
            <>
              <button
                onClick={onCancelEdit}
                className="text-[11px] font-bold border border-slate-200 bg-white rounded-lg px-4 py-2 hover:bg-slate-50 hover:border-red-200 text-slate-600 hover:text-red-600 transition-all cursor-pointer shadow-3xs"
              >
                Cancel
              </button>
              <button
                onClick={onSaveEdit}
                className="text-[11px] font-bold bg-hacker-green text-white rounded-lg px-4 py-2 flex items-center gap-2 hover:bg-teal-800 transition-all cursor-pointer shadow-xs"
              >
                <Save className="w-3.5 h-3.5" /> Save Changes
              </button>
            </>
          )}
          {displayReport.Metadata.StoredFileName && (
            <a
              href={`/reports/${displayReport.Metadata.StoredFileName}`}
              target="_blank"
              rel="noreferrer"
              className="text-[11px] font-bold border border-slate-200 bg-white rounded-lg px-4 py-2 hover:bg-slate-50 hover:border-slate-300 text-slate-600 transition-all tracking-wide cursor-pointer shadow-3xs"
            >
              Open in Tab
            </a>
          )}
          <button
            onClick={onClose}
            className="w-9 h-9 border border-slate-200 bg-white rounded-lg flex items-center justify-center hover:bg-slate-50 hover:border-slate-300 transition-all text-slate-500 cursor-pointer shadow-3xs"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar with editable financials */}
        <div className="w-80 flex-shrink-0 border-r border-slate-200 bg-slate-50/70 overflow-y-auto p-6 space-y-6">
          {isReanalyzing && (
            <div className="bg-emerald-50 border border-emerald-100 p-3 rounded-lg text-[10px] leading-relaxed text-emerald-800 flex items-center gap-2 font-medium">
              <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-600 flex-shrink-0" />
              <span>Analyzing document with Gemini AI... This can take 5-10 seconds.</span>
            </div>
          )}
          {isEditing && !isReanalyzing && displayReport && (
            <div className="bg-emerald-50/80 border border-emerald-100 p-3 rounded-lg text-[10px] leading-relaxed text-emerald-800 flex items-start gap-2 font-medium">
              <Sparkles className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0 mt-0.5" />
              <span>You are viewing newly extracted or edited values. Review and click "Save Changes" to commit.</span>
            </div>
          )}
          {isEditing && (
            <label className="border border-dashed border-slate-300 bg-white rounded-lg p-3 flex items-center gap-3 text-slate-600 hover:border-hacker-green hover:text-hacker-green transition-all cursor-pointer">
              {isAppendingDocuments ? (
                <Loader2 className="w-4 h-4 animate-spin flex-shrink-0" />
              ) : (
                <FilePlus2 className="w-4 h-4 flex-shrink-0" />
              )}
              <span className="text-[10px] font-bold tracking-wide">
                {isAppendingDocuments ? "Parsing added documents..." : "Add missed pages or documents"}
              </span>
              <input
                type="file"
                multiple
                accept="application/pdf,image/*"
                disabled={isAppendingDocuments}
                className="hidden"
                onChange={async (e) => {
                  const files = Array.from(e.target.files || []);
                  e.target.value = "";
                  if (files.length > 0) {
                    await onAppendDocuments(files);
                  }
                }}
              />
            </label>
          )}
          <div className="flex items-center justify-between">
            <p className="text-[10px] tracking-wider text-slate-500 font-extrabold uppercase">
              {isEditing ? "Editing Report Fields" : "Extracted Values"}
            </p>
            {isEditing && (
              <span className="text-[9px] font-extrabold px-2 py-0.5 bg-amber-100 border border-amber-200/50 text-amber-800 rounded">EDITING</span>
            )}
          </div>

          {(["incomeStatement", "balanceSheet", "cashFlow", "ratios", "growth", "advanced"] as const).map((category) => {
            const data = (displayReport.Financials as any)[category];
            if (!data) return null;
            const entries = Object.entries(data).filter(([, v]) => v !== null && v !== undefined);
            if (entries.length === 0 && !isEditing) return null;

            return (
              <div key={category} className="space-y-2">
                <p className="text-[9px] tracking-wider text-slate-400 font-extrabold border-b border-slate-200 pb-1 uppercase">
                  {CATEGORY_LABELS[category] || category.toUpperCase()}
                </p>
                {isEditing ? (
                  <div className="space-y-2 font-sans">
                    {Object.keys(FIELD_LABELS)
                      .filter((fieldId) => {
                        const dictEntry = Object.entries(FINANCIAL_DICTIONARY).find(([id]) => id === fieldId);
                        return dictEntry && (dictEntry[1] as any).category === category;
                      })
                      .slice(0, 10) // Show top 10 fields per category in edit mode
                      .map((fieldId) => (
                        <div key={fieldId} className="flex justify-between items-center gap-2">
                          <span className="text-[10px] text-slate-500 font-medium truncate flex-1">
                            {FIELD_LABELS[fieldId]}
                          </span>
                          <input
                            type="text"
                            value={data[fieldId] || ""}
                            onChange={(e) => updateField(category, fieldId, e.target.value)}
                            className="w-24 bg-white border border-slate-200 rounded px-2.5 py-1 text-[10px] font-mono text-right focus:outline-none focus:border-hacker-green focus:ring-1 focus:ring-hacker-green/25 text-slate-800 font-semibold"
                            placeholder="—"
                          />
                        </div>
                      ))}
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    {entries.map(([k, v]) => (
                      <div key={k} className="flex justify-between text-[10px] font-sans">
                        <span className="text-slate-500 font-medium">{FIELD_LABELS[k] || k}</span>
                        <span className="font-bold text-slate-800 font-mono">{formatNum(v as any)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Document preview */}
        <div className="flex-1 overflow-hidden bg-slate-100">
          {displayReport.Metadata.StoredFileName ? (
            displayReport.Metadata.DocType === "IMAGE" ? (
              <div className="w-full h-full overflow-auto flex items-start justify-center p-8 bg-slate-50/50">
                <img
                  src={`/reports/${displayReport.Metadata.StoredFileName}`}
                  alt={displayReport.Metadata.CompanyName}
                  referrerPolicy="no-referrer"
                  className="max-w-full shadow-lg border border-slate-200 rounded-lg"
                />
              </div>
            ) : (
              <iframe
                src={`/reports/${displayReport.Metadata.StoredFileName}#toolbar=0&navpanes=0`}
                className="w-full h-full bg-white animate-none"
                title="Source Document"
              />
            )
          ) : (
            <div className="flex items-center justify-center h-full text-slate-400">
              <p className="text-xs font-semibold opacity-60">Source file not linked</p>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
