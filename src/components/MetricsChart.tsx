"use client";

import { theme } from "@/lib/theme";

interface DataPoint {
  label: string;
  value: number;
}

interface MetricsChartProps {
  data: DataPoint[];
  color?: string;
  height?: number;
  showLabels?: boolean;
  formatValue?: (value: number) => string;
}

export default function MetricsChart({
  data,
  color = theme.colors.primary,
  height = 200,
  showLabels = true,
  formatValue = (v) => v.toLocaleString(),
}: MetricsChartProps) {
  if (data.length === 0) {
    return (
      <div style={{ height, display: "flex", alignItems: "center", justifyContent: "center", color: theme.colors.textMuted }}>
        No data available
      </div>
    );
  }

  const values = data.map((d) => d.value);
  const maxValue = Math.max(...values);
  const minValue = Math.min(...values);
  const range = maxValue - minValue || 1;

  const padding = { top: 20, right: 20, bottom: 40, left: 20 };
  const chartWidth = 100;
  const chartHeight = height - padding.top - padding.bottom;

  const points = data.map((d, i) => {
    const x = (i / (data.length - 1)) * 100;
    const y = ((maxValue - d.value) / range) * chartHeight + padding.top;
    return { x, y, ...d };
  });

  const linePath = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");
  
  const areaPath = `${linePath} L ${points[points.length - 1].x} ${chartHeight + padding.top} L ${points[0].x} ${chartHeight + padding.top} Z`;

  return (
    <div style={{ position: "relative", width: "100%", height }}>
      <svg
        viewBox={`0 0 100 ${height}`}
        preserveAspectRatio="none"
        style={{ width: "100%", height: "100%" }}
      >
        <defs>
          <linearGradient id={`gradient-${color.replace("#", "")}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.3" />
            <stop offset="100%" stopColor={color} stopOpacity="0.05" />
          </linearGradient>
        </defs>

        {/* Grid lines */}
        {[0, 0.25, 0.5, 0.75, 1].map((pct) => (
          <line
            key={pct}
            x1="0"
            y1={padding.top + chartHeight * pct}
            x2="100"
            y2={padding.top + chartHeight * pct}
            stroke={theme.colors.borderLight}
            strokeWidth="0.5"
            vectorEffect="non-scaling-stroke"
          />
        ))}

        {/* Area fill */}
        <path
          d={areaPath}
          fill={`url(#gradient-${color.replace("#", "")})`}
        />

        {/* Line */}
        <path
          d={linePath}
          fill="none"
          stroke={color}
          strokeWidth="2"
          vectorEffect="non-scaling-stroke"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Data points */}
        {points.map((p, i) => (
          <circle
            key={i}
            cx={p.x}
            cy={p.y}
            r="1.5"
            fill="white"
            stroke={color}
            strokeWidth="1.5"
            vectorEffect="non-scaling-stroke"
          />
        ))}
      </svg>

      {/* Labels */}
      {showLabels && (
        <div style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          display: "flex",
          justifyContent: "space-between",
          padding: "0 4px",
        }}>
          {data.map((d, i) => (
            <span key={i} style={{ fontSize: 10, color: theme.colors.textMuted }}>
              {d.label}
            </span>
          ))}
        </div>
      )}

      {/* Hover tooltip area - simplified */}
      <div style={{
        position: "absolute",
        top: 8,
        right: 8,
        background: theme.colors.bgSecondary,
        padding: "4px 8px",
        borderRadius: 4,
        fontSize: 11,
        color: theme.colors.textSecondary,
        border: "1px solid " + theme.colors.borderLight,
      }}>
        Latest: {formatValue(data[data.length - 1]?.value || 0)}
      </div>
    </div>
  );
}

interface BarChartProps {
  data: DataPoint[];
  color?: string;
  height?: number;
  formatValue?: (value: number) => string;
}

export function BarChart({
  data,
  color = theme.colors.primary,
  height = 200,
  formatValue = (v) => v.toLocaleString(),
}: BarChartProps) {
  if (data.length === 0) {
    return (
      <div style={{ height, display: "flex", alignItems: "center", justifyContent: "center", color: theme.colors.textMuted }}>
        No data available
      </div>
    );
  }

  const maxValue = Math.max(...data.map((d) => d.value));

  return (
    <div style={{ height, display: "flex", flexDirection: "column" }}>
      <div style={{ flex: 1, display: "flex", alignItems: "flex-end", gap: 8, paddingBottom: 8 }}>
        {data.map((d, i) => {
          const barHeight = maxValue > 0 ? (d.value / maxValue) * 100 : 0;
          return (
            <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center" }}>
              <div style={{ fontSize: 10, color: theme.colors.textSecondary, marginBottom: 4 }}>
                {formatValue(d.value)}
              </div>
              <div
                style={{
                  width: "100%",
                  height: `${barHeight}%`,
                  minHeight: 4,
                  background: `linear-gradient(180deg, ${color}, ${color}99)`,
                  borderRadius: "4px 4px 0 0",
                  transition: "height 300ms ease",
                }}
              />
            </div>
          );
        })}
      </div>
      <div style={{ display: "flex", gap: 8, borderTop: "1px solid " + theme.colors.borderLight, paddingTop: 8 }}>
        {data.map((d, i) => (
          <div key={i} style={{ flex: 1, textAlign: "center", fontSize: 10, color: theme.colors.textMuted }}>
            {d.label}
          </div>
        ))}
      </div>
    </div>
  );
}

interface MultiLineChartProps {
  datasets: {
    label: string;
    data: DataPoint[];
    color: string;
  }[];
  height?: number;
  formatValue?: (value: number) => string;
}

export function MultiLineChart({
  datasets,
  height = 200,
  formatValue = (v) => v.toLocaleString(),
}: MultiLineChartProps) {
  if (datasets.length === 0 || datasets[0].data.length === 0) {
    return (
      <div style={{ height, display: "flex", alignItems: "center", justifyContent: "center", color: theme.colors.textMuted }}>
        No data available
      </div>
    );
  }

  const allValues = datasets.flatMap((ds) => ds.data.map((d) => d.value));
  const maxValue = Math.max(...allValues);
  const minValue = Math.min(...allValues);
  const range = maxValue - minValue || 1;

  const padding = { top: 20, right: 20, bottom: 40, left: 20 };
  const chartHeight = height - padding.top - padding.bottom;

  return (
    <div style={{ position: "relative", width: "100%", height }}>
      <svg
        viewBox={`0 0 100 ${height}`}
        preserveAspectRatio="none"
        style={{ width: "100%", height: "100%" }}
      >
        {/* Grid lines */}
        {[0, 0.25, 0.5, 0.75, 1].map((pct) => (
          <line
            key={pct}
            x1="0"
            y1={padding.top + chartHeight * pct}
            x2="100"
            y2={padding.top + chartHeight * pct}
            stroke={theme.colors.borderLight}
            strokeWidth="0.5"
            vectorEffect="non-scaling-stroke"
          />
        ))}

        {datasets.map((dataset, dsIndex) => {
          const points = dataset.data.map((d, i) => {
            const x = (i / (dataset.data.length - 1)) * 100;
            const y = ((maxValue - d.value) / range) * chartHeight + padding.top;
            return { x, y };
          });

          const linePath = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");

          return (
            <g key={dsIndex}>
              <path
                d={linePath}
                fill="none"
                stroke={dataset.color}
                strokeWidth="2"
                vectorEffect="non-scaling-stroke"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              {points.map((p, i) => (
                <circle
                  key={i}
                  cx={p.x}
                  cy={p.y}
                  r="1.2"
                  fill="white"
                  stroke={dataset.color}
                  strokeWidth="1.5"
                  vectorEffect="non-scaling-stroke"
                />
              ))}
            </g>
          );
        })}
      </svg>

      {/* Labels */}
      <div style={{
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
        display: "flex",
        justifyContent: "space-between",
        padding: "0 4px",
      }}>
        {datasets[0].data.map((d, i) => (
          <span key={i} style={{ fontSize: 10, color: theme.colors.textMuted }}>
            {d.label}
          </span>
        ))}
      </div>

      {/* Legend */}
      <div style={{
        position: "absolute",
        top: 0,
        right: 0,
        display: "flex",
        gap: 12,
        fontSize: 11,
      }}>
        {datasets.map((ds, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <div style={{ width: 12, height: 3, background: ds.color, borderRadius: 2 }} />
            <span style={{ color: theme.colors.textSecondary }}>{ds.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
