import React from "react";

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
}

export function GlassCard({ children, className = "" }: GlassCardProps) {
  return (
    <div className={`relative overflow-hidden rounded-2xl border border-white/10 bg-slate-950/40 p-6 backdrop-blur-xl transition-all duration-300 hover:border-white/20 hover:shadow-[0_0_30px_rgba(255,255,255,0.03)] ${className}`}>
      {children}
    </div>
  );
}
