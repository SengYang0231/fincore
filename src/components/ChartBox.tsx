import React from "react";

interface ChartBoxProps {
  title: string;
  children: React.ReactNode;
}

export function ChartBox({ title, children }: ChartBoxProps) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-6 hover:border-hacker-green/30 hover:shadow-2xs transition-all font-sans">
      <p className="text-[9px] tracking-wider text-slate-400 mb-5 font-bold uppercase">{title}</p>
      {children}
    </div>
  );
}
