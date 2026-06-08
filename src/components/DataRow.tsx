import React from "react";
import { CompanyReport } from "../types";
import { safeNum, formatNum } from "../constants";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: any[]) {
  return twMerge(clsx(inputs));
}

interface DataRowProps {
  label: string;
  id: string;
  cat: string;
  reports: CompanyReport[];
  highlight?: boolean;
  tooltip?: string;
}

export function DataRow({
  label,
  id,
  cat,
  reports,
  highlight,
  tooltip
}: DataRowProps) {
  return (
    <tr className={cn("hover:bg-hacker-green/5 transition-colors", highlight && "bg-hacker-green/[0.02]")}>
      <td className={cn("px-6 py-4 text-xs font-bold tracking-tight relative group", highlight ? "text-hacker-green glow-text" : "text-hacker-green-dim")}>
        <span className={cn(tooltip && "cursor-help border-b border-dotted border-hacker-green/40")}>
          {label}
        </span>

        {tooltip && (
          <div className="absolute left-6 bottom-full mb-1 hidden group-hover:block z-30 max-w-xs bg-black border border-hacker-border text-hacker-green-bright text-[10px] p-2 rounded shadow-lg pointer-events-none font-mono">
            {tooltip}
          </div>
        )}
      </td>

      {reports.map((r: CompanyReport, i: number) => {
        const val = (r.Financials as any)[cat]?.[id];
        const n = safeNum(val);
        return (
          <td key={i} className="px-6 py-4 text-sm border-l border-hacker-border/20 text-center font-mono">
            {n !== 0 ? (
              <span className={cn("font-bold", n < 0 ? "text-red-400" : highlight ? "text-hacker-green-bright glow-text" : "text-hacker-green")}>
                {formatNum(val)}
              </span>
            ) : (
              <span className="text-hacker-green-dim/20 text-xs">—</span>
            )}
          </td>
        );
      })}
    </tr>
  );
}
