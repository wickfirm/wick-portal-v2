"use client";

import { theme } from "@/lib/theme";

interface DataPoint {
  label: string;
  value: number;
}

type FormatType = "number" | "currency" | "percent";

function formatValue(value: number, formatType: FormatType = "number"): string {
  if (formatType === "currency") {
    return "$" + value.toLocaleString();
  }
  if (formatType === "percent") {
    return value.toFixed(1) + "%";
  }
  return value.toLocaleString();
}

interface MetricsChartProps {
  data: DataPoint[];
  color?: string;
  height?: number;
  showLabels?: boolean;
  format?: FormatType;
}

export default function MetricsChart({
  data,
  color = theme.colors.primary,
  height = 200,
  showLabels = true,
  format = "number",
}: MetricsChartProps) {
  if (data.length === 0) {
    return (
      <div style={{ height, display: "flex", alignItems: "center", justifyContent: "center", color: theme.colors.textMuted }}>
        No data available
      </div>
    );
  }

  var values = data.map(function(d) { return d.value; });
  var maxValue = Math.max.apply(null, values);
  var minValue = Math.min.apply(null, values);
  var range = maxValue - minValue || 1;

  var padding = { top: 20, right: 20, bottom: 40, left: 20 };
  var chartHeight = height - padding.top - padding.bottom;

  var points = data.map(function(d, i) {
    var x = (i / (data.length - 1)) * 100;
    var y = ((maxValue - d.value) / range) * chartHeight + padding.top;
    return { x: x, y: y, label: d.label, value: d.value };
  });

  var linePath = "";
  for (var i = 0; i < points.length; i++) {
    linePath += (i === 0 ? "M" : "L") + " " + points[i].x + " " + points[i].y + " ";
  }

  var areaPath = linePath + "L " + points[points.length - 1].x + " " + (chartHeight + padding.top) + " L " + points[0].x + " " + (chartHeight + padding.top) + " Z";

  var gradientId = "gradient-" + color.replace("#", "");

  return (
    <div style={{ position: "relative", width: "100%", height: height }}>
      <svg
        viewBox={"0 0 100 " + height}
        preserveAspectRatio="none"
        style={{ width: "100%", height: "100%" }}
      >
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.3} />
            <stop offset="100%" stopColor={color} stopOpacity={0.05} />
          </linearGradient>
        </defs>

        {[0, 0.25, 0.5, 0.75, 1].map(function(pct) {
          return (
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
          );
        })}

        <path
          d={areaPath}
          fill={"url(#" + gradientId + ")"}
        />

        <path
          d={linePath}
          fill="none"
          stroke={color}
          strokeWidth="2"
          vectorEffect="non-scaling-stroke"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {points.map(function(p, idx) {
          return (
            <circle
              key={idx}
              cx={p.x}
              cy={p.y}
              r="1.5"
              fill="white"
              stroke={color}
              strokeWidth="1.5"
              vectorEffect="non-scaling-stroke"
            />
          );
        })}
      </svg>

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
          {data.map(function(d, idx) {
            return (
              <span key={idx} style={{ fontSize: 10, color: theme.colors.textMuted }}>
                {d.label}
              </span>
            );
          })}
        </div>
      )}

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
        Latest: {formatValue(data[data.length - 1]?.value || 0, format)}
      </div>
    </div>
  );
}

interface BarChartProps {
  data: DataPoint[];
  color?: string;
  height?: number;
  format?: FormatType;
}

export function BarChart({
  data,
  color = theme.colors.primary,
  height = 200,
  format = "number",
}: BarChartProps) {
  if (data.length === 0) {
    return (
      <div style={{ height: height, display: "flex", alignItems: "center", justifyContent: "center", color: theme.colors.textMuted }}>
        No data available
      </div>
    );
  }

  var values = data.map(function(d) { return d.value; });
  var maxValue = Math.max.apply(null, values);

  return (
    <div style={{ height: height, display: "flex", flexDirection: "column" }}>
      <div style={{ flex: 1, display: "flex", alignItems: "flex-end", gap: 8, paddingBottom: 8 }}>
        {data.map(function(d, idx) {
          var barHeight = maxValue > 0 ? (d.value / maxValue) * 100 : 0;
          return (
            <div key={idx} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center" }}>
              <div style={{ fontSize: 10, color: theme.colors.textSecondary, marginBottom: 4 }}>
                {formatValue(d.value, format)}
              </div>
              <div
                style={{
                  width: "100%",
                  height: barHeight + "%",
                  minHeight: 4,
                  background: "linear-gradient(180deg, " + color + ", " + color + "99)",
                  borderRadius: "4px 4px 0 0",
                  transition: "height 300ms ease",
                }}
              />
            </div>
          );
        })}
      </div>
      <div style={{ display: "flex", gap: 8, borderTop: "1px solid " + theme.colors.borderLight, paddingTop: 8 }}>
        {data.map(function(d, idx) {
          return (
            <div key={idx} style={{ flex: 1, textAlign: "center", fontSize: 10, color: theme.colors.textMuted }}>
              {d.label}
            </div>
          );
        })}
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
  format?: FormatType;
}

export function MultiLineChart({
  datasets,
  height = 200,
  format = "number",
}: MultiLineChartProps) {
  if (datasets.length === 0 || datasets[0].data.length === 0) {
    return (
      <div style={{ height: height, display: "flex", alignItems: "center", justifyContent: "center", color: theme.colors.textMuted }}>
        No data available
      </div>
    );
  }

  var allValues: number[] = [];
  datasets.forEach(function(ds) {
    ds.data.forEach(function(d) {
      allValues.push(d.value);
    });
  });
  
  var maxValue = Math.max.apply(null, allValues);
  var minValue = Math.min.apply(null, allValues);
  var range = maxValue - minValue || 1;

  var padding = { top: 20, right: 20, bottom: 40, left: 20 };
  var chartHeight = height - padding.top - padding.bottom;

  return (
    <div style={{ position: "relative", width: "100%", height: height }}>
      <svg
        viewBox={"0 0 100 " + height}
        preserveAspectRatio="none"
        style={{ width: "100%", height: "100%" }}
      >
        {[0, 0.25, 0.5, 0.75, 1].map(function(pct) {
          return (
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
          );
        })}

        {datasets.map(function(dataset, dsIndex) {
          var points = dataset.data.map(function(d, i) {
            var x = (i / (dataset.data.length - 1)) * 100;
            var y = ((maxValue - d.value) / range) * chartHeight + padding.top;
            return { x: x, y: y };
          });

          var linePath = "";
          for (var i = 0; i < points.length; i++) {
            linePath += (i === 0 ? "M" : "L") + " " + points[i].x + " " + points[i].y + " ";
          }

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
              {points.map(function(p, idx) {
                return (
                  <circle
                    key={idx}
                    cx={p.x}
                    cy={p.y}
                    r="1.2"
                    fill="white"
                    stroke={dataset.color}
                    strokeWidth="1.5"
                    vectorEffect="non-scaling-stroke"
                  />
                );
              })}
            </g>
          );
        })}
      </svg>

      <div style={{
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
        display: "flex",
        justifyContent: "space-between",
        padding: "0 4px",
      }}>
        {datasets[0].data.map(function(d, idx) {
          return (
            <span key={idx} style={{ fontSize: 10, color: theme.colors.textMuted }}>
              {d.label}
            </span>
          );
        })}
      </div>

      <div style={{
        position: "absolute",
        top: 0,
        right: 0,
        display: "flex",
        gap: 12,
        fontSize: 11,
      }}>
        {datasets.map(function(ds, idx) {
          return (
            <div key={idx} style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <div style={{ width: 12, height: 3, background: ds.color, borderRadius: 2 }} />
              <span style={{ color: theme.colors.textSecondary }}>{ds.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
