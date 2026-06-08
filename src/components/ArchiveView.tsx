import React from "react";
import { Database, ChevronRight } from "lucide-react";
import { motion } from "motion/react";
import { ArchiveEntry } from "../types";

interface ArchiveViewProps {
  key?: string;
  archive: ArchiveEntry[];
  setView: (v: "upload" | "dashboard" | "archive") => void;
  loadReports: (y: string, s: string) => Promise<void>;
}

export function ArchiveView({ archive, setView, loadReports }: ArchiveViewProps) {
  return (
    <motion.div
      key="archive"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className="font-mono"
    >
      <header className="mb-10 border-b border-hacker-border pb-8">
        <p className="text-[10px] tracking-[0.5em] text-hacker-green-dim mb-2">PERSISTENT_XML_STORE</p>
        <h1 className="text-4xl font-serif tracking-tight glow-text">FILESYSTEM_ARCHIVE</h1>
      </header>

      {archive.length === 0 ? (
        <div className="h-[50vh] flex flex-col items-center justify-center text-hacker-green-dim gap-4">
          <Database className="w-12 h-12 opacity-10" />
          <p className="text-xs tracking-[0.5em] opacity-40">FS_EMPTY // NO_RECORDS</p>
          <button
            onClick={() => setView("upload")}
            className="text-xs border border-hacker-border px-6 py-2 hover:border-hacker-green transition-all cursor-pointer"
          >
            → INGEST_FIRST_DOCUMENT
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 text-white">
          {archive.map((yItem, i) => (
            <div key={i} className="space-y-3">
              <h2 className="text-2xl font-serif text-white flex items-center gap-3">
                <span className="text-hacker-green-dim text-sm font-mono">/</span>
                {yItem.year}
              </h2>
              {yItem.sectors.map((s: string, j: number) => (
                <button
                  key={j}
                  onClick={() => loadReports(yItem.year, s)}
                  className="w-full bg-black border border-hacker-border px-5 py-4 flex items-center justify-between hover:border-hacker-green hover:bg-hacker-green/5 transition-all group text-left cursor-pointer"
                >
                  <span className="text-xs font-bold tracking-widest text-hacker-green">{s.replace(/_/g, " ")}</span>
                  <ChevronRight className="w-4 h-4 text-hacker-green-dim group-hover:text-hacker-green group-hover:translate-x-1 transition-all" />
                </button>
              ))}
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
}
