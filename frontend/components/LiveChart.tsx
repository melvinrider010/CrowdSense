import React from "react";

interface LiveChartProps {
  data: number[];
  color?: string;
  height?: number;
}

export function LiveChart({ data, color = "#3b82f6", height = 80 }: LiveChartProps) {
  if (!data || data.length < 2) {
    return (
      <div className="h-full flex items-center justify-center text-xs text-slate-500 py-6">
        Awaiting telemetry feeds...
      </div>
    );
  }

  const maxVal = Math.max(...data, 100);
  const minVal = Math.min(...data, 0);
  const range = maxVal - minVal || 1;

  const points = data
    .map((val, index) => {
      const x = (index / (data.length - 1)) * 300;
      const y = height - ((val - minVal) / range) * (height - 10);
      return `${x},${y}`;
    })
    .join(" ");

  const fillPoints = `0,${height} ${points} 300,${height}`;

  return (
    <svg className="w-full h-full overflow-visible" viewBox={`0 0 300 ${height}`} preserveAspectRatio="none">
      <defs>
        <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity={0.25} />
          <stop offset="100%" stopColor={color} stopOpacity={0.0} />
        </linearGradient>
      </defs>
      <polygon points={fillPoints} fill="url(#chartGradient)" />
      <polyline fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" points={points} />
    </svg>
  );
}
