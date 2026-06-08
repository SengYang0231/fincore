import React from "react";
import { Edit3, Save, X } from "lucide-react";
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
  onSaveEdit: () => void;
  onCancelEdit: () => void;
}

export function DocumentViewerOverlay({
  report,
  onClose,
  isEditing,
  onStartEdit,
  editingReport,
  onEditChange,
  onSaveEdit,
  onCancelEdit,
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
      className="fixed inset-0 bg-black/95 z-[200] flex flex-col font-mono"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-8 py-5 border-b border-hacker-border bg-black flex-shrink-0">
        <div>
          <h2 className="text-sm font-bold tracking-widest glow-text">{displayReport.Metadata.CompanyName}</h2>
          <p className="text-[10px] text-hacker-green-dim mt-1">
            {displayReport.Metadata.OriginalFileName} // {displayReport.Metadata.DocType} // FY{displayReport.Metadata.FinancialYear}
          </p>
        </div>
        <div className="flex items-center gap-4">
          {!isEditing ? (
            <button
              onClick={onStartEdit}
              className="text-[10px] font-bold border border-hacker-green px-4 py-2 flex items-center gap-2 hover:bg-hacker-green hover:text-black transition-all tracking-widest cursor-pointer"
            >
              <Edit3 className="w-3 h-3" /> EDIT_VALUES
            </button>
          ) : (
            <>
              <button
                onClick={onCancelEdit}
                className="text-[10px] font-bold border border-hacker-border px-4 py-2 hover:border-red-500 hover:text-red-400 transition-all tracking-widest cursor-pointer"
              >
                CANCEL
              </button>
              <button
                onClick={onSaveEdit}
                className="text-[10px] font-bold bg-hacker-green text-black px-4 py-2 flex items-center gap-2 hover:bg-hacker-green-bright transition-all tracking-widest cursor-pointer"
              >
                <Save className="w-3 h-3" /> SAVE_CHANGES
              </button>
            </>
          )}
          {displayReport.Metadata.StoredFileName && (
            <a
              href={`/reports/${displayReport.Metadata.StoredFileName}`}
              target="_blank"
              rel="noreferrer"
              className="text-[10px] font-bold border border-hacker-border px-4 py-2 hover:border-hacker-green hover:text-hacker-green transition-all tracking-widest cursor-pointer"
            >
              OPEN_IN_TAB
            </a>
          )}
          <button
            onClick={onClose}
            className="w-10 h-10 border border-hacker-border flex items-center justify-center hover:border-hacker-green hover:text-hacker-green transition-all cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar with editable financials */}
        <div className="w-80 flex-shrink-0 border-r border-hacker-border bg-black overflow-y-auto p-6 space-y-6">
          <div className="flex items-center justify-between">
            <p className="text-[10px] tracking-[0.4em] text-hacker-green-dim">
              {isEditing ? "EDITING_DATA" : "EXTRACTED_DATA"}
            </p>
            {isEditing && (
              <span className="text-[9px] px-2 py-0.5 bg-yellow-500/20 text-yellow-500">EDIT_MODE</span>
            )}
          </div>

          {(["incomeStatement", "balanceSheet", "cashFlow", "ratios", "growth", "advanced"] as const).map((category) => {
            const data = (displayReport.Financials as any)[category];
            if (!data) return null;
            const entries = Object.entries(data).filter(([, v]) => v !== null && v !== undefined);
            if (entries.length === 0 && !isEditing) return null;

            return (
              <div key={category} className="space-y-2">
                <p className="text-[9px] tracking-[0.4em] text-hacker-green-dim font-bold border-b border-hacker-border pb-1">
                  {CATEGORY_LABELS[category] || category.toUpperCase()}
                </p>
                {isEditing ? (
                  <div className="space-y-2">
                    {Object.keys(FIELD_LABELS)
                      .filter((fieldId) => {
                        const dictEntry = Object.entries(FINANCIAL_DICTIONARY).find(([id]) => id === fieldId);
                        return dictEntry && (dictEntry[1] as any).category === category;
                      })
                      .slice(0, 10) // Show top 10 fields per category in edit mode
                      .map((fieldId) => (
                        <div key={fieldId} className="flex justify-between items-center gap-2">
                          <span className="text-[10px] text-hacker-green-dim truncate flex-1">
                            {FIELD_LABELS[fieldId]}
                          </span>
                          <input
                            type="text"
                            value={data[fieldId] || ""}
                            onChange={(e) => updateField(category, fieldId, e.target.value)}
                            className="w-24 bg-black border border-hacker-border px-2 py-1 text-[10px] font-mono text-right focus:outline-none focus:border-hacker-green text-white"
                            placeholder="—"
                          />
                        </div>
                      ))}
                  </div>
                ) : (
                  entries.map(([k, v]) => (
                    <div key={k} className="flex justify-between text-[10px]">
                      <span className="text-hacker-green-dim">{FIELD_LABELS[k] || k}</span>
                      <span className="font-bold text-hacker-green">{formatNum(v as any)}</span>
                    </div>
                  ))
                )}
              </div>
            );
          })}
        </div>

        {/* Document preview */}
        <div className="flex-1 overflow-hidden bg-neutral-950">
          {displayReport.Metadata.StoredFileName ? (
            displayReport.Metadata.DocType === "IMAGE" ? (
              <div className="w-full h-full overflow-auto flex items-start justify-center p-8 bg-[repeating-linear-gradient(45deg,#111,#111_10px,#0d0d0d_10px,#0d0d0d_20px)]">
                <img
                  src={`/reports/${displayReport.Metadata.StoredFileName}`}
                  alt={displayReport.Metadata.CompanyName}
                  referrerPolicy="no-referrer"
                  className="max-w-full shadow-2xl border border-hacker-border"
                />
              </div>
            ) : (
              <iframe
                src={`/reports/${displayReport.Metadata.StoredFileName}#toolbar=0&navpanes=0`}
                className="w-full h-full"
                title="Source Document"
                style={{ filter: "invert(1) hue-rotate(180deg) brightness(0.9)" }}
              />
            )
          ) : (
            <div className="flex items-center justify-center h-full text-hacker-green-dim">
              <p className="text-xs opacity-40">NO_SOURCE_FILE_LINKED</p>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
