import React from "react";

interface ChartBoxProps {
  title: string;
  children: React.ReactNode;
}

export function ChartBox({ title, children }: ChartBoxProps) {
  return (
    <div className="bg-black border border-hacker-border p-6 hover:border-hacker-green/50 transition-colors">
      <p className="text-[9px] tracking-[0.5em] text-hacker-green-dim mb-5 font-bold">{title}</p>
      {children}
    </div>
  );
}
