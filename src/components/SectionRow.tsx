import React from "react";

interface SectionRowProps {
  label: string;
  colSpan: number;
}

export function SectionRow({ label, colSpan }: SectionRowProps) {
  return (
    <tr className="bg-hacker-bg">
      <td colSpan={colSpan} className="px-6 py-2 text-[13px] tracking-[0.5em] text-hacker-green/100 font-bold uppercase italic">
        {label}
      </td>
    </tr>
  );
}
