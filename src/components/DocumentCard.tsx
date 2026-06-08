import React, { useState } from "react";
import { Eye, ChevronUp, ChevronDown, Trash2 } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { ParsedDocument } from "../types";
import { FIELD_LABELS, CATEGORY_LABELS } from "../constants";
import { FieldInput } from "./FieldInput";

interface DocumentCardProps {
  key?: string;
  doc: ParsedDocument;
  docIndex: number;
  onUpdateName: (index: number, name: string) => void;
  onUpdateField: (index: number, category: string, fieldId: string, value: string) => void;
  onToggleExpanded: (index: number) => void;
  onRemove: (index: number) => void;
}

export function DocumentCard({
  doc,
  docIndex,
  onUpdateName,
  onUpdateField,
  onToggleExpanded,
  onRemove,
}: DocumentCardProps) {
  const [previewVisible, setPreviewVisible] = useState(false);

  return (
    <div className="bg-black border border-hacker-border">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-hacker-border/50">
        <div className="flex items-center gap-4 flex-1">
          <div className="w-10 h-10 border border-hacker-green bg-hacker-green/10 flex items-center justify-center text-sm font-bold text-hacker-green">
            {docIndex + 1}
          </div>
          <div className="flex-1">
            <input
              type="text"
              value={doc.companyName}
              onChange={(e) => onUpdateName(docIndex, e.target.value)}
              className="w-full bg-transparent border-b border-hacker-border px-0 py-1 text-sm font-bold text-white focus:outline-none focus:border-hacker-green transition-colors"
              placeholder="Company Name"
            />
            <div className="flex items-center gap-3 mt-1">
              <span className="text-[10px] text-hacker-green-dim">{doc.originalFileName}</span>
              <span className="text-[10px] px-2 py-0.5 bg-hacker-green/10 text-hacker-green">{doc.docType}</span>
              <span className="text-[10px] text-hacker-green-dim opacity-50">{doc.rawTextLength} chars extracted</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setPreviewVisible(!previewVisible)}
            className="text-[10px] border border-hacker-border px-3 py-1.5 flex items-center gap-1.5 hover:border-hacker-green hover:text-hacker-green transition-all cursor-pointer"
          >
            <Eye className="w-3 h-3" /> {previewVisible ? "HIDE" : "VIEW"}_SOURCE
          </button>
          <button
            onClick={() => onToggleExpanded(docIndex)}
            className="w-8 h-8 flex items-center justify-center border border-hacker-border hover:border-hacker-green hover:text-hacker-green transition-all cursor-pointer"
          >
            {doc.isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
          <button
            onClick={() => onRemove(docIndex)}
            className="w-8 h-8 flex items-center justify-center border border-hacker-border hover:border-red-500 hover:text-red-400 transition-all cursor-pointer"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Preview Panel */}
      <AnimatePresence>
        {previewVisible && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 400, opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden border-b border-hacker-border/50"
          >
            {doc.docType === "IMAGE" ? (
              <div className="w-full h-full overflow-auto flex items-start justify-center p-4 bg-neutral-950">
                <img
                  src={`/reports/${doc.storedFileName}`}
                  alt={doc.companyName}
                  referrerPolicy="no-referrer"
                  className="max-w-full max-h-full object-contain"
                />
              </div>
            ) : (
              <iframe
                src={`/reports/${doc.storedFileName}#toolbar=0&navpanes=0`}
                className="w-full h-full"
                title="Source Document"
                style={{ filter: "invert(1) hue-rotate(180deg) brightness(0.9)" }}
              />
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Expandable Fields */}
      <AnimatePresence>
        {doc.isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="p-6 space-y-6">
              {Object.entries(doc.extractedData).map(([category, fields]) => {
                const hasValues = Object.values(fields).some((f) => f.value !== null);
                if (!hasValues && category !== "incomeStatement" && category !== "balanceSheet") return null;

                return (
                  <div key={category}>
                    <p className="text-[10px] tracking-[0.4em] text-hacker-green-dim font-bold mb-3 border-b border-hacker-border/30 pb-2">
                      {CATEGORY_LABELS[category] || category.toUpperCase()}
                    </p>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                      {Object.entries(fields).map(([fieldId, field]) => (
                        <FieldInput
                          key={fieldId}
                          label={FIELD_LABELS[fieldId] || fieldId}
                          value={field.value || ""}
                          confidence={field.confidence}
                          onChange={(val) => onUpdateField(docIndex, category, fieldId, val)}
                        />
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
