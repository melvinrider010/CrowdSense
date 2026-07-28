import React from "react";

interface StatusBadgeProps {
  status: string;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const normalized = status.trim().toUpperCase();
  
  let styles = "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
  let label = "SAFE";

  if (normalized === "CROWD") {
    styles = "bg-amber-500/10 text-amber-400 border-amber-500/20";
    label = "CROWD DETECTED";
  } else if (normalized === "STAMPEDE_RISK" || normalized === "RISK") {
    styles = "bg-orange-500/10 text-orange-400 border-orange-500/20 animate-pulse";
    label = "STAMPEDE RISK";
  } else if (normalized === "STAMPEDE_WARNING" || normalized === "WARNING") {
    styles = "bg-rose-500/20 text-rose-400 border-rose-500/30 animate-bounce";
    label = "CRITICAL ALERT";
  }

  return (
    <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-bold tracking-wider ${styles}`}>
      <span className="mr-1.5 h-1.5 w-1.5 rounded-full bg-current animate-ping" />
      {label}
    </span>
  );
}
