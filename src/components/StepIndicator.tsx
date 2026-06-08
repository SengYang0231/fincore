import React from "react";
import { CheckCircle2 } from "lucide-react";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: any[]) {
  return twMerge(clsx(inputs));
}

interface StepIndicatorProps {
  step: number;
  label: string;
  active: boolean;
  completed: boolean;
}

export function StepIndicator({ step, label, active, completed }: StepIndicatorProps) {
  return (
    <div className={cn("flex items-center gap-3", active ? "text-hacker-green" : completed ? "text-hacker-green-dim" : "text-hacker-green-dim/50")}>
      <div className={cn(
        "w-8 h-8 flex items-center justify-center text-xs font-bold border transition-all",
        active ? "border-hacker-green bg-hacker-green text-black" : completed ? "border-hacker-green bg-transparent" : "border-hacker-border"
      )}>
        {completed ? <CheckCircle2 className="w-4 h-4" /> : step}
      </div>
      <span className="text-[10px] tracking-[0.3em] font-bold">{label}</span>
    </div>
  );
}
