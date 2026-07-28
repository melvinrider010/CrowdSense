import React from "react";

// 1. Hourly Traffic Density Chart (Bar Chart)
export function HourlyDensityChart() {
  const hourlyData = [
    { hour: "00:00", val: 12 }, { hour: "02:00", val: 8 }, { hour: "04:00", val: 15 },
    { hour: "06:00", val: 35 }, { hour: "08:00", val: 78 }, { hour: "10:00", val: 92 },
    { hour: "12:00", val: 65 }, { hour: "14:00", val: 55 }, { hour: "16:00", val: 82 },
    { hour: "18:00", val: 98 }, { hour: "20:00", val: 85 }, { hour: "22:00", val: 40 }
  ];

  const height = 150;
  const width = 500;
  const padding = 30;

  return (
    <svg className="w-full h-full overflow-visible" viewBox={`0 0 ${width} ${height}`}>
      {/* Grid Lines */}
      <line x1={padding} y1={20} x2={width} y2={20} stroke="rgba(255,255,255,0.05)" />
      <line x1={padding} y1={height - padding} x2={width} y2={height - padding} stroke="rgba(255,255,255,0.1)" />
      
      {hourlyData.map((d, idx) => {
        const barWidth = 20;
        const spacing = (width - padding) / hourlyData.length;
        const x = padding + idx * spacing + (spacing - barWidth) / 2;
        const barHeight = (d.val / 100) * (height - padding - 20);
        const y = height - padding - barHeight;

        return (
          <g key={idx} className="group">
            {/* Hover tooltip hint */}
            <title>{`${d.hour}: ${d.val}% Density`}</title>
            
            {/* Gradient Bar */}
            <defs>
              <linearGradient id={`hourlyBarGrad-${idx}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={d.val > 80 ? "#f43f5e" : "#3b82f6"} />
                <stop offset="100%" stopColor="#6366f1" stopOpacity={0.2} />
              </linearGradient>
            </defs>

            <rect
              x={x}
              y={y}
              width={barWidth}
              height={barHeight}
              rx={4}
              fill={`url(#hourlyBarGrad-${idx})`}
              className="transition-all duration-300 hover:opacity-80 cursor-pointer"
            />
            
            {/* Label */}
            <text
              x={x + barWidth / 2}
              y={height - 10}
              fill="rgba(255,255,255,0.4)"
              fontSize={9}
              textAnchor="middle"
            >
              {d.hour.split(":")[0]}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

// 2. Daily Crowd Activity Chart (Spline Area Chart)
export function DailyActivityChart() {
  const dailyData = [
    { day: "Mon", val: 45 }, { day: "Tue", val: 50 }, { day: "Wed", val: 78 },
    { day: "Thu", val: 62 }, { day: "Fri", val: 80 }, { day: "Sat", val: 95 },
    { day: "Sun", val: 88 }
  ];

  const height = 150;
  const width = 500;
  const padding = 30;

  const points = dailyData
    .map((d, idx) => {
      const spacing = (width - padding - 20) / (dailyData.length - 1);
      const x = padding + idx * spacing + 10;
      const y = height - padding - (d.val / 100) * (height - padding - 20);
      return `${x},${y}`;
    })
    .join(" ");

  const fillPoints = `${padding + 10},${height - padding} ${points} ${width - 10},${height - padding}`;

  return (
    <svg className="w-full h-full overflow-visible" viewBox={`0 0 ${width} ${height}`}>
      <defs>
        <linearGradient id="dailyAreaGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#10b981" stopOpacity={0.3} />
          <stop offset="100%" stopColor="#10b981" stopOpacity={0.0} />
        </linearGradient>
      </defs>
      
      {/* Grid Lines */}
      <line x1={padding} y1={20} x2={width} y2={20} stroke="rgba(255,255,255,0.05)" />
      <line x1={padding} y1={height - padding} x2={width} y2={height - padding} stroke="rgba(255,255,255,0.1)" />

      {/* Polygon Area Fill */}
      <polygon points={fillPoints} fill="url(#dailyAreaGrad)" />

      {/* Line Spline */}
      <polyline
        fill="none"
        stroke="#10b981"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={points}
      />

      {/* Ticks & Points */}
      {dailyData.map((d, idx) => {
        const spacing = (width - padding - 20) / (dailyData.length - 1);
        const x = padding + idx * spacing + 10;
        const y = height - padding - (d.val / 100) * (height - padding - 20);

        return (
          <g key={idx}>
            <title>{`${d.day}: ${d.val}% Density`}</title>
            <circle cx={x} cy={y} r={4} fill="#ffffff" stroke="#10b981" strokeWidth={2} />
            <text x={x} y={height - 10} fill="rgba(255,255,255,0.4)" fontSize={9} textAnchor="middle">
              {d.day}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

// 3. Weekly Crowd Load Distribution (Horizontal Bar Chart)
export function WeeklyDistributionChart() {
  const weeklyData = [
    { week: "Week 1", val: 60 },
    { week: "Week 2", val: 75 },
    { week: "Week 3", val: 90 },
    { week: "Week 4", val: 82 }
  ];

  return (
    <div className="space-y-4 py-2">
      {weeklyData.map((d, idx) => (
        <div key={idx} className="space-y-1.5">
          <div className="flex justify-between text-xs font-semibold text-slate-300">
            <span>{d.week}</span>
            <span className="font-mono text-slate-400">{d.val}% Capacity</span>
          </div>
          <div className="h-2 w-full bg-slate-900 border border-white/5 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-indigo-500 to-blue-500 rounded-full transition-all duration-1000"
              style={{ width: `${d.val}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

// 4. Monthly Trend Chart (Line Chart)
export function MonthlyTrendChart() {
  const monthlyData = [
    { month: "Jan", val: 40 }, { month: "Feb", val: 35 }, { month: "Mar", val: 55 },
    { month: "Apr", val: 60 }, { month: "May", val: 70 }, { month: "Jun", val: 85 },
    { month: "Jul", val: 95 }
  ];

  const height = 150;
  const width = 500;
  const padding = 30;

  const points = monthlyData
    .map((d, idx) => {
      const spacing = (width - padding - 20) / (monthlyData.length - 1);
      const x = padding + idx * spacing + 10;
      const y = height - padding - (d.val / 100) * (height - padding - 20);
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <svg className="w-full h-full overflow-visible" viewBox={`0 0 ${width} ${height}`}>
      {/* Grid Lines */}
      <line x1={padding} y1={20} x2={width} y2={20} stroke="rgba(255,255,255,0.05)" />
      <line x1={padding} y1={height - padding} x2={width} y2={height - padding} stroke="rgba(255,255,255,0.1)" />

      {/* Line Spline */}
      <polyline
        fill="none"
        stroke="#8b5cf6"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={points}
      />

      {/* Points */}
      {monthlyData.map((d, idx) => {
        const spacing = (width - padding - 20) / (monthlyData.length - 1);
        const x = padding + idx * spacing + 10;
        const y = height - padding - (d.val / 100) * (height - padding - 20);

        return (
          <g key={idx}>
            <title>{`${d.month}: ${d.val}% Capacity`}</title>
            <circle cx={x} cy={y} r={4} fill="#ffffff" stroke="#8b5cf6" strokeWidth={2} />
            <text x={x} y={height - 10} fill="rgba(255,255,255,0.4)" fontSize={9} textAnchor="middle">
              {d.month}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
