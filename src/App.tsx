import React, { useState, useEffect, useCallback } from "react";
import { TrendingUp, Plus, BarChart3, History } from "lucide-react";
import { AnimatePresence } from "motion/react";
import { ParsedDocument, CompanyReport, ArchiveEntry, Financials } from "./types";
import { NavBtn } from "./components/NavBtn";
import { UploadView } from "./components/UploadView";
import { DashboardView } from "./components/DashboardView";
import { ArchiveView } from "./components/ArchiveView";
import { DocumentViewerOverlay } from "./components/DocumentViewerOverlay";

export default function App() {
  const [reports, setReports] = useState<CompanyReport[]>([]);
  const [year, setYear] = useState("2025");
  const [sector, setSector] = useState("TECHNOLOGY");
  const [view, setView] = useState<"upload" | "dashboard" | "archive">("upload");
  const [archive, setArchive] = useState<ArchiveEntry[]>([]);
  const [selectedReport, setSelectedReport] = useState<CompanyReport | null>(null);
  const [dragOver, setDragOver] = useState(false);

  // Upload workflow state
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [parsedDocuments, setParsedDocuments] = useState<ParsedDocument[]>([]);
  const [isParsing, setIsParsing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [uploadStep, setUploadStep] = useState<"select" | "review">("select");

  // AI insights
  const [aiInsight, setAiInsight] = useState<string | null>(null);
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);

  // Edit mode for dashboard
  const [editingReport, setEditingReport] = useState<CompanyReport | null>(null);

  const fetchArchive = useCallback(async () => {
    try {
      const res = await fetch("/api/archive");
      const data = await res.json();
      setArchive(data);
    } catch (err) {
      console.error(err);
    }
  }, []);

  useEffect(() => {
    fetchArchive();
  }, [fetchArchive]);

  // Paste handler
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      if (view !== "upload" || uploadStep !== "select") return;
      const items = e.clipboardData?.items;
      if (!items) return;
      const files: File[] = [];
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (item.type.startsWith("image/") || item.type === "application/pdf") {
          const blob = item.getAsFile();
          if (blob) {
            const ext = item.type.split("/")[1] || "png";
            files.push(new File([blob], `pasted-${Date.now()}.${ext}`, { type: item.type }));
          }
        }
      }
      if (files.length > 0) setPendingFiles((prev) => [...prev, ...files]);
    };
    window.addEventListener("paste", handlePaste);
    return () => window.removeEventListener("paste", handlePaste);
  }, [view, uploadStep]);

  const loadReports = async (y: string, s: string) => {
    try {
      setAiInsight(null);
      const res = await fetch(`/api/reports/${y}/${s}`);
      const data = await res.json();
      const arr = Array.isArray(data) ? data : [data];
      setReports(arr.filter(Boolean));
      setYear(y);
      setSector(s);
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
        body: JSON.stringify({ reports, sector, year }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setAiInsight(data.text);
    } catch (err: any) {
      setAiInsight(`[ERROR]: ${err.message}`);
    } finally {
      setIsGeneratingAi(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setPendingFiles((prev) => [...prev, ...Array.from(e.target.files!)]);
      e.target.value = "";
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const files = Array.from(e.dataTransfer.files).filter(
      (f: File) => f.type === "application/pdf" || f.type.startsWith("image/")
    );
    if (files.length > 0) setPendingFiles((prev) => [...prev, ...files]);
  };

  const handleParse = async () => {
    if (pendingFiles.length === 0) return;
    setIsParsing(true);

    const formData = new FormData();
    pendingFiles.forEach((f) => formData.append("reports", f));

    try {
      const res = await fetch("/api/parse", { method: "POST", body: formData });
      const data = await res.json();
      if (data.success) {
        const docs: ParsedDocument[] = data.parsed.map((p: any) => ({
          ...p,
          companyName: p.suggestedCompanyName,
          isExpanded: true,
        }));
        setParsedDocuments(docs);
        setPendingFiles([]);
        setUploadStep("review");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsParsing(false);
    }
  };

  const handleSaveAll = async () => {
    if (parsedDocuments.length === 0) return;
    setIsSaving(true);

    const reportsToSave = parsedDocuments.map((doc) => {
      const financials: Record<string, Record<string, string | null>> = {};
      for (const [category, fields] of Object.entries(doc.extractedData)) {
        financials[category] = {};
        for (const [fieldId, field] of Object.entries(fields)) {
          financials[category][fieldId] = field.value;
        }
      }
      return {
        companyName: doc.companyName,
        financials,
        storedFileName: doc.storedFileName,
        originalFileName: doc.originalFileName,
        docType: doc.docType,
      };
    });

    try {
      const res = await fetch("/api/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reports: reportsToSave, year, sector }),
      });
      const data = await res.json();
      if (data.success) {
        await fetchArchive();
        setParsedDocuments([]);
        setUploadStep("select");
        await loadReports(year, sector);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  const updateDocumentField = (docIndex: number, category: string, fieldId: string, value: string) => {
    setParsedDocuments((prev) =>
      prev.map((doc, i) => {
        if (i !== docIndex) return doc;
        return {
          ...doc,
          extractedData: {
            ...doc.extractedData,
            [category]: {
              ...doc.extractedData[category],
              [fieldId]: {
                ...doc.extractedData[category][fieldId],
                value: value || null,
              },
            },
          },
        };
      })
    );
  };

  const updateDocumentName = (docIndex: number, name: string) => {
    setParsedDocuments((prev) =>
      prev.map((doc, i) => (i === docIndex ? { ...doc, companyName: name } : doc))
    );
  };

  const toggleDocumentExpanded = (docIndex: number) => {
    setParsedDocuments((prev) =>
      prev.map((doc, i) => (i === docIndex ? { ...doc, isExpanded: !doc.isExpanded } : doc))
    );
  };

  const removeDocument = (docIndex: number) => {
    setParsedDocuments((prev) => prev.filter((_, i) => i !== docIndex));
  };

  const addMoreDocuments = () => {
    setUploadStep("select");
  };

  return (
    <div className="min-h-screen bg-hacker-bg text-hacker-green font-mono crt-flicker overflow-x-hidden">
      <div className="scanline" />

      {/* Grid background */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute inset-0 opacity-[0.07] bg-[linear-gradient(to_right,#00ff41_1px,transparent_1px),linear-gradient(to_bottom,#00ff41_1px,transparent_1px)] bg-[size:48px_48px]" />
      </div>

      {/* Sidebar */}
      <nav className="fixed left-0 top-0 bottom-0 w-[72px] bg-black/90 border-r border-hacker-border flex flex-col items-center py-8 gap-8 z-50">
        <div className="flex flex-col items-center mb-4">
          <div className="w-10 h-10 border border-hacker-green flex items-center justify-center shadow-[0_0_20px_rgba(0,255,65,0.3)] bg-black">
            <TrendingUp className="w-5 h-5 text-hacker-green" />
          </div>
          <span className="text-[8px] font-bold tracking-[0.3em] mt-2 text-hacker-green-dim">FIN</span>
        </div>
        <NavBtn
          icon={<Plus />}
          label="INGEST"
          active={view === "upload"}
          onClick={() => {
            setView("upload");
            setUploadStep("select");
            setParsedDocuments([]);
          }}
        />
        <NavBtn
          icon={<BarChart3 />}
          label="MATRIX"
          active={view === "dashboard"}
          onClick={() => setView("dashboard")}
        />
        <NavBtn
          icon={<History />}
          label="ARCHIVE"
          active={view === "archive"}
          onClick={() => setView("archive")}
        />

        <div className="mt-auto flex flex-col items-center gap-1">
          <div className="w-2 h-2 rounded-full bg-hacker-green animate-pulse" />
          <span className="text-[8px] text-hacker-green-dim tracking-widest">LIVE</span>
        </div>
      </nav>

      <main className="ml-[72px] min-h-screen p-8 lg:p-12 relative z-10">
        <AnimatePresence mode="wait">
          {view === "upload" && (
            <UploadView
              key="upload"
              uploadStep={uploadStep}
              year={year}
              setYear={setYear}
              sector={sector}
              setSector={setSector}
              dragOver={dragOver}
              setDragOver={setDragOver}
              pendingFiles={pendingFiles}
              setPendingFiles={setPendingFiles}
              isParsing={isParsing}
              isSaving={isSaving}
              parsedDocuments={parsedDocuments}
              handleDrop={handleDrop}
              handleFileChange={handleFileChange}
              handleParse={handleParse}
              handleSaveAll={handleSaveAll}
              setUploadStep={setUploadStep}
              updateDocumentName={updateDocumentName}
              updateDocumentField={updateDocumentField}
              toggleDocumentExpanded={toggleDocumentExpanded}
              removeDocument={removeDocument}
              addMoreDocuments={addMoreDocuments}
            />
          )}

          {view === "dashboard" && (
            <DashboardView
              key="dashboard"
              reports={reports}
              sector={sector}
              year={year}
              setView={setView}
              setSelectedReport={setSelectedReport}
              generateAIInsights={generateAIInsights}
              isGeneratingAi={isGeneratingAi}
              aiInsight={aiInsight}
            />
          )}

          {view === "archive" && (
            <ArchiveView
              key="archive"
              archive={archive}
              setView={setView}
              loadReports={loadReports}
            />
          )}
        </AnimatePresence>
      </main>

      <AnimatePresence>
        {selectedReport && (
          <DocumentViewerOverlay
            report={selectedReport}
            onClose={() => {
              setSelectedReport(null);
              setEditingReport(null);
            }}
            isEditing={editingReport !== null}
            onStartEdit={() => setEditingReport({ ...selectedReport })}
            editingReport={editingReport}
            onEditChange={(financials) => {
              if (editingReport) {
                setEditingReport({ ...editingReport, Financials: financials });
              }
            }}
            onSaveEdit={async () => {
              if (!editingReport) return;
              try {
                const res = await fetch("/api/save", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    reports: [{
                      companyName: editingReport.Metadata.CompanyName,
                      financials: editingReport.Financials,
                      storedFileName: editingReport.Metadata.StoredFileName,
                      originalFileName: editingReport.Metadata.OriginalFileName,
                      docType: editingReport.Metadata.DocType,
                    }],
                    year: editingReport.Metadata.FinancialYear,
                    sector: editingReport.Metadata.Sector,
                  }),
                });
                if (res.ok) {
                  await loadReports(editingReport.Metadata.FinancialYear, editingReport.Metadata.Sector);
                  setSelectedReport(null);
                  setEditingReport(null);
                }
              } catch (err) {
                console.error(err);
              }
            }}
            onCancelEdit={() => setEditingReport(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
