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
  const confidenceColor = confidence === "high" ? "text-hacker-green" : confidence === "medium" ? "text-yellow-500" : "text-hacker-green-dim";

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <label className="text-[9px] text-hacker-green-dim truncate">{label}</label>
        {value && (
          <span className={cn("text-[8px]", confidenceColor)}>
            {confidence === "high" ? "●" : confidence === "medium" ? "◐" : "○"}
          </span>
        )}
      </div>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={cn(
          "w-full bg-black border px-3 py-2 text-xs font-mono focus:outline-none transition-colors",
          value ? "border-hacker-border text-white" : "border-hacker-border/30 text-hacker-green-dim",
          "focus:border-hacker-green"
        )}
        placeholder="—"
      />
    </div>
  );
}
