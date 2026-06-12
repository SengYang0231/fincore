import React from "react";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: any[]) {
  return twMerge(clsx(inputs));
}

interface FieldInputProps {
  key?: string;
  label: string;
  value: string;
  confidence: string;
  onChange: (val: string) => void;
}

export function FieldInput({
  label,
  value,
  confidence,
  onChange,
}: FieldInputProps) {
  const confidenceColor = confidence === "high" ? "text-emerald-600" : confidence === "medium" ? "text-amber-500" : "text-slate-400";

  return (
    <div className="space-y-1 font-sans">
      <div className="flex items-center justify-between">
        <label className="text-[9px] font-bold text-slate-500 uppercase tracking-wider truncate">{label}</label>
        {value && (
          <span className={cn("text-[9px] font-bold", confidenceColor)} title={`Confidence: ${confidence}`}>
            {confidence === "high" ? "High" : confidence === "medium" ? "Med" : "Low"}
          </span>
        )}
      </div>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={cn(
          "w-full bg-slate-50/50 border px-3 py-2 text-xs font-mono rounded-lg focus:bg-white focus:outline-none transition-all focus:ring-1 focus:ring-hacker-green/20",
          value ? "border-slate-200 text-slate-800 font-semibold" : "border-slate-200/50 text-slate-400",
          "focus:border-hacker-green"
        )}
        placeholder="—"
      />
    </div>
  );
}
