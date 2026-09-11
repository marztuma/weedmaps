"use client";

import { useMemo } from "react";

export default function DonutChart({ data, total }) {
  const COLORS = ["#4f46e5", "#8b5cf6", "#06b6d4", "#f59e0b", "#6366f1"];

  const chartData = useMemo(() => {
    let currentAngle = 0;
    return data.map((item, idx) => {
      const sliceAngle = (item.value / total) * 360;
      const startAngle = currentAngle;
      const endAngle = currentAngle + sliceAngle;
      currentAngle = endAngle;

      const startRad = (startAngle * Math.PI) / 180;
      const endRad = (endAngle * Math.PI) / 180;
      const radius = 45;
      const innerRadius = 30;

      const x1 = 50 + radius * Math.cos(startRad);
      const y1 = 50 + radius * Math.sin(startRad);
      const x2 = 50 + radius * Math.cos(endRad);
      const y2 = 50 + radius * Math.sin(endRad);

      const largeArc = sliceAngle > 180 ? 1 : 0;

      const ix1 = 50 + innerRadius * Math.cos(startRad);
      const iy1 = 50 + innerRadius * Math.sin(startRad);
      const ix2 = 50 + innerRadius * Math.cos(endRad);
      const iy2 = 50 + innerRadius * Math.sin(endRad);

      const path = `
        M ${x1} ${y1}
        A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2}
        L ${ix2} ${iy2}
        A ${innerRadius} ${innerRadius} 0 ${largeArc} 0 ${ix1} ${iy1}
        Z
      `;

      return {
        ...item,
        path,
        color: COLORS[idx % COLORS.length],
        percentage: Math.round((item.value / total) * 100),
      };
    });
  }, [data, total]);

  return (
    <div className="flex gap-8 items-center">
      <svg viewBox="0 0 100 100" className="w-32 h-32">
        {chartData.map((item, idx) => (
          <path key={idx} d={item.path} fill={item.color} />
        ))}
        <circle cx="50" cy="50" r="30" fill="white" />
        <text x="50" y="52" textAnchor="middle" className="text-xs font-bold fill-gray-900">
          {Math.round(total).toLocaleString()}
        </text>
      </svg>

      <div className="space-y-2 flex-1">
        {chartData.map((item, idx) => (
          <div key={idx} className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
              <span className="text-gray-700">{item.label}</span>
            </div>
            <span className="font-semibold text-gray-900">{item.percentage}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}
