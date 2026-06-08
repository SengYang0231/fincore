import React from "react";
import { Upload, FileText, X, Loader2, FileSearch, ChevronRight, Plus, Save } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { ParsedDocument } from "../types";
import { BURSA_SECTORS } from "../constants";
import { StepIndicator } from "./StepIndicator";
import { DocumentCard } from "./DocumentCard";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: any[]) {
  return twMerge(clsx(inputs));
}

interface UploadViewProps {
  key?: string;
  uploadStep: "select" | "review";
  year: string;
  setYear: (y: string) => void;
  sector: string;
  setSector: (s: string) => void;
  dragOver: boolean;
  setDragOver: (b: boolean) => void;
  pendingFiles: File[];
  setPendingFiles: React.Dispatch<React.SetStateAction<File[]>>;
  isParsing: boolean;
  isSaving: boolean;
  parsedDocuments: ParsedDocument[];
  handleDrop: (e: React.DragEvent) => void;
  handleFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleParse: () => void;
  handleSaveAll: () => void;
  setUploadStep: (step: "select" | "review") => void;
  updateDocumentName: (index: number, name: string) => void;
  updateDocumentField: (index: number, category: string, fieldId: string, value: string) => void;
  toggleDocumentExpanded: (index: number) => void;
  removeDocument: (index: number) => void;
  addMoreDocuments: () => void;
}

export function UploadView({
  uploadStep,
  year,
  setYear,
  sector,
  setSector,
  dragOver,
  setDragOver,
  pendingFiles,
  setPendingFiles,
  isParsing,
  isSaving,
  parsedDocuments,
  handleDrop,
  handleFileChange,
  handleParse,
  handleSaveAll,
  setUploadStep,
  updateDocumentName,
  updateDocumentField,
  toggleDocumentExpanded,
  removeDocument,
  addMoreDocuments,
}: UploadViewProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className="max-w-5xl font-mono"
    >
      <header className="mb-10">
        <p className="text-[10px] tracking-[0.5em] text-hacker-green-dim mb-3">BURSA MALAYSIA // FINANCIAL INTELLIGENCE SYSTEM</p>
        <h1 className="text-4xl font-serif tracking-tight text-hacker-green glow-text">
          INGESTION_PROTOCOL
        </h1>
        <p className="text-xs text-hacker-green-dim mt-2 opacity-70">
          Upload annual reports → Review & edit extracted data → Save to database
        </p>
      </header>

      {/* Step indicator */}
      <div className="flex items-center gap-4 mb-8">
        <StepIndicator step={1} label="UPLOAD" active={uploadStep === "select"} completed={uploadStep === "review"} />
        <div className="flex-1 h-px bg-hacker-border" />
        <StepIndicator step={2} label="REVIEW & EDIT" active={uploadStep === "review"} completed={false} />
      </div>

      {uploadStep === "select" && (
        <div className="space-y-6">
          {/* Parameters */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] uppercase tracking-[0.4em] text-hacker-green-dim mb-2 font-bold">FY_YEAR</label>
              <select
                value={year}
                onChange={(e) => setYear(e.target.value)}
                className="w-full bg-black border border-hacker-border px-4 py-3 text-sm text-white focus:outline-none focus:border-hacker-green transition-colors cursor-pointer"
              >
                {["2025", "2024", "2023", "2022", "2021"].map((y) => (
                  <option key={y} value={y} className="bg-black">{y}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[10px] uppercase tracking-[0.4em] text-hacker-green-dim mb-2 font-bold">SECTOR</label>
              <select
                value={sector}
                onChange={(e) => setSector(e.target.value)}
                className="w-full bg-black border border-hacker-border px-4 py-3 text-sm text-white focus:outline-none focus:border-hacker-green transition-colors cursor-pointer"
              >
                {BURSA_SECTORS.map((s) => (
                  <option key={s} value={s} className="bg-black">{s.replace(/_/g, " ")}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Drop zone */}
          <div>
            <label className="block text-[10px] uppercase tracking-[0.4em] text-hacker-green-dim mb-2 font-bold">
              DOCUMENTS <span className="opacity-50 normal-case tracking-normal">(ctrl+v to paste)</span>
            </label>
            <div
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              className={cn(
                "relative border-2 border-dashed p-12 flex flex-col items-center gap-4 transition-all",
                dragOver ? "border-hacker-green bg-hacker-green/10" : "border-hacker-border hover:border-hacker-green/50 hover:bg-white/[0.01]"
              )}
            >
              <input
                type="file"
                multiple
                accept=".pdf,image/*"
                onChange={handleFileChange}
                className="absolute inset-0 opacity-0 cursor-pointer z-10"
              />
              <Upload className={cn("w-8 h-8 transition-all", dragOver ? "text-hacker-green scale-110" : "text-hacker-green-dim")} />
              <div className="text-center pointer-events-none">
                <p className="text-sm font-bold text-white">DRAG & DROP or CLICK</p>
                <p className="text-[10px] text-hacker-green-dim mt-1 tracking-widest">PDF // PNG // JPG // JPEG // SCREENSHOT</p>
              </div>
            </div>
          </div>

          {/* Pending files */}
          <AnimatePresence>
            {pendingFiles.length > 0 && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0 }} className="space-y-2">
                <p className="text-[10px] tracking-widest text-hacker-green-dim">QUEUE ({pendingFiles.length})</p>
                {pendingFiles.map((f, i) => (
                  <div key={i} className="flex items-center justify-between bg-black border border-hacker-border px-4 py-2 text-xs">
                    <div className="flex items-center gap-3">
                      <FileText className="w-3 h-3 text-hacker-green-dim" />
                      <span className="truncate max-w-[320px]">{f.name}</span>
                      <span className="text-hacker-green-dim opacity-50 text-[10px]">{(f.size / 1024).toFixed(0)}KB</span>
                    </div>
                    <button type="button" onClick={() => setPendingFiles((p) => p.filter((_, j) => j !== i))} className="cursor-pointer">
                      <X className="w-3 h-3 text-hacker-green-dim hover:text-red-400 transition-colors" />
                    </button>
                  </div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>

          <button
            onClick={handleParse}
            disabled={isParsing || pendingFiles.length === 0}
            className="w-full bg-hacker-green text-black font-bold py-4 text-sm tracking-[0.3em] flex items-center justify-center gap-3 hover:bg-hacker-green-bright transition-all disabled:opacity-30 disabled:cursor-not-allowed shadow-[0_0_30px_rgba(0,255,65,0.2)] cursor-pointer"
          >
            {isParsing ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> PARSING_DOCUMENTS...</>
            ) : (
              <><FileSearch className="w-4 h-4" /> PARSE & EXTRACT ({pendingFiles.length} FILE{pendingFiles.length !== 1 ? "S" : ""})</>
            )}
          </button>

          {/* Show existing parsed documents if any */}
          {parsedDocuments.length > 0 && (
            <button
              onClick={() => setUploadStep("review")}
              className="w-full border border-hacker-green text-hacker-green py-3 text-xs tracking-widest flex items-center justify-center gap-2 hover:bg-hacker-green/10 transition-all cursor-pointer"
            >
              <ChevronRight className="w-3 h-3" />
              CONTINUE_TO_REVIEW ({parsedDocuments.length} DOCUMENTS)
            </button>
          )}
        </div>
      )}

      {uploadStep === "review" && (
        <div className="space-y-6">
          {/* Add more button */}
          <div className="flex items-center justify-between">
            <p className="text-[10px] tracking-[0.5em] text-hacker-green-dim">
              {parsedDocuments.length} DOCUMENT{parsedDocuments.length !== 1 ? "S" : ""} READY FOR REVIEW
            </p>
            <button
              onClick={addMoreDocuments}
              className="text-xs border border-hacker-border px-4 py-2 flex items-center gap-2 hover:border-hacker-green hover:text-hacker-green transition-all cursor-pointer"
            >
              <Plus className="w-3 h-3" /> ADD_MORE
            </button>
          </div>

          {/* Document cards */}
          {parsedDocuments.map((doc, docIndex) => (
            <DocumentCard
              key={doc.fileId}
              doc={doc}
              docIndex={docIndex}
              onUpdateName={updateDocumentName}
              onUpdateField={updateDocumentField}
              onToggleExpanded={toggleDocumentExpanded}
              onRemove={removeDocument}
            />
          ))}

          {/* Save button */}
          <div className="flex gap-4">
            <button
              onClick={addMoreDocuments}
              className="flex-1 border border-hacker-border text-hacker-green-dim py-4 text-sm tracking-widest flex items-center justify-center gap-3 hover:border-hacker-green hover:text-hacker-green transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" /> ADD_MORE_DOCUMENTS
            </button>
            <button
              onClick={handleSaveAll}
              disabled={isSaving || parsedDocuments.length === 0}
              className="flex-1 bg-hacker-green text-black font-bold py-4 text-sm tracking-[0.3em] flex items-center justify-center gap-3 hover:bg-hacker-green-bright transition-all disabled:opacity-30 disabled:cursor-not-allowed shadow-[0_0_30px_rgba(0,255,65,0.2)] cursor-pointer"
            >
              {isSaving ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> SAVING...</>
              ) : (
                <><Save className="w-4 h-4" /> SAVE_ALL_TO_DATABASE</>
              )}
            </button>
          </div>
        </div>
      )}
    </motion.div>
  );
}
