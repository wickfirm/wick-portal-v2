"use client";

import { useState } from "react";
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
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

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

  var padding = { top: 30, right: 20, bottom: 40, left: 20 };
  var chartHeight = height - padding.top - padding.bottom;

  var points = data.map(function(d, i) {
    var x = data.length === 1 ? 50 : (i / (data.length - 1)) * 100;
    var y = ((maxValue - d.value) / range) * chartHeight + padding.top;
    return { x: x, y: y, label: d.label, value: d.value };
  });

  var linePath = "";
  for (var i = 0; i < points.length; i++) {
    linePath += (i === 0 ? "M" : "L") + " " + points[i].x + " " + points[i].y + " ";
  }

  var areaPath = linePath + "L " + points[points.length - 1].x + " " + (chartHeight + padding.top) + " L " + points[0].x + " " + (chartHeight + padding.top) + " Z";

  var gradientId = "gradient-" + color.replace("#", "") + "-" + Math.random().toString(36).substr(2, 9);

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
          var isHovered = hoveredIndex === idx;
          return (
            <circle
              key={idx}
              cx={p.x}
              cy={p.y}
              r={isHovered ? "2.5" : "1.5"}
              fill={isHovered ? color : "white"}
              stroke={color}
              strokeWidth="1.5"
              vectorEffect="non-scaling-stroke"
              style={{ cursor: "pointer", transition: "r 150ms ease" }}
              onMouseEnter={function() { setHoveredIndex(idx); }}
              onMouseLeave={function() { setHoveredIndex(null); }}
            />
          );
        })}
      </svg>

      {/* Hover zones for better touch targets */}
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 40, display: "flex" }}>
        {points.map(function(p, idx) {
          return (
            <div
              key={idx}
              style={{ flex: 1, cursor: "pointer" }}
              onMouseEnter={function() { setHoveredIndex(idx); }}
              onMouseLeave={function() { setHoveredIndex(null); }}
            />
          );
        })}
      </div>

      {/* Tooltip */}
      {hoveredIndex !== null && (
        <div style={{
          position: "absolute",
          top: Math.max(8, points[hoveredIndex].y * (height - 40) / height - 40),
          left: points[hoveredIndex].x + "%",
          transform: "translateX(-50%)",
          background: theme.colors.textPrimary,
          color: "white",
          padding: "6px 10px",
          borderRadius: 6,
          fontSize: 12,
          fontWeight: 500,
          whiteSpace: "nowrap",
          pointerEvents: "none",
          zIndex: 10,
          boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
        }}>
          <div style={{ fontWeight: 600 }}>{formatValue(points[hoveredIndex].value, format)}</div>
          <div style={{ fontSize: 10, opacity: 0.8 }}>{points[hoveredIndex].label}</div>
        </div>
      )}

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
              <span key={idx} style={{ fontSize: 10, color: hoveredIndex === idx ? theme.colors.textPrimary : theme.colors.textMuted, fontWeight: hoveredIndex === idx ? 600 : 400 }}>
                {d.label}
              </span>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* Sparkline - Mini inline chart for stat cards */
interface SparklineProps {
  data: number[];
  color?: string;
  width?: number;
  height?: number;
}

export function Sparkline({
  data,
  color = theme.colors.primary,
  width = 80,
  height = 24,
}: SparklineProps) {
  if (data.length < 2) {
    return <div style={{ width, height }} />;
  }

  var maxValue = Math.max.apply(null, data);
  var minValue = Math.min.apply(null, data);
  var range = maxValue - minValue || 1;

  var points = data.map(function(value, i) {
    var x = (i / (data.length - 1)) * width;
    var y = ((maxValue - value) / range) * (height - 4) + 2;
    return x + "," + y;
  });

  var isPositive = data[data.length - 1] >= data[0];
  var lineColor = color || (isPositive ? theme.colors.success : theme.colors.error);

  return (
    <svg width={width} height={height} style={{ display: "block" }}>
      <polyline
        points={points.join(" ")}
        fill="none"
        stroke={lineColor}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle
        cx={(data.length - 1) / (data.length - 1) * width}
        cy={((maxValue - data[data.length - 1]) / range) * (height - 4) + 2}
        r="2"
        fill={lineColor}
      />
    </svg>
  );
}

/* Bar Chart */
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
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

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
      <div style={{ flex: 1, display: "flex", alignItems: "flex-end", gap: 8, paddingBottom: 8, position: "relative" }}>
        {data.map(function(d, idx) {
          var barHeight = maxValue > 0 ? (d.value / maxValue) * 100 : 0;
          var isHovered = hoveredIndex === idx;
          return (
            <div
              key={idx}
              style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", position: "relative" }}
              onMouseEnter={function() { setHoveredIndex(idx); }}
              onMouseLeave={function() { setHoveredIndex(null); }}
            >
              {isHovered && (
                <div style={{
                  position: "absolute",
                  bottom: barHeight + "%",
                  marginBottom: 8,
                  background: theme.colors.textPrimary,
                  color: "white",
                  padding: "4px 8px",
                  borderRadius: 4,
                  fontSize: 11,
                  fontWeight: 500,
                  whiteSpace: "nowrap",
                  zIndex: 10,
                }}>
                  {formatValue(d.value, format)}
                </div>
              )}
              <div
                style={{
                  width: "100%",
                  height: barHeight + "%",
                  minHeight: 4,
                  background: isHovered
                    ? color
                    : "linear-gradient(180deg, " + color + ", " + color + "99)",
                  borderRadius: "4px 4px 0 0",
                  transition: "all 150ms ease",
                  cursor: "pointer",
                  transform: isHovered ? "scaleX(1.05)" : "scaleX(1)",
                }}
              />
            </div>
          );
        })}
      </div>
      <div style={{ display: "flex", gap: 8, borderTop: "1px solid " + theme.colors.borderLight, paddingTop: 8 }}>
        {data.map(function(d, idx) {
          return (
            <div key={idx} style={{ flex: 1, textAlign: "center", fontSize: 10, color: hoveredIndex === idx ? theme.colors.textPrimary : theme.colors.textMuted, fontWeight: hoveredIndex === idx ? 600 : 400 }}>
              {d.label}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* Multi-Line Chart */
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
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

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

  var allPoints = datasets.map(function(dataset) {
    return dataset.data.map(function(d, i) {
      var x = dataset.data.length === 1 ? 50 : (i / (dataset.data.length - 1)) * 100;
      var y = ((maxValue - d.value) / range) * chartHeight + padding.top;
      return { x: x, y: y, value: d.value, label: d.label };
    });
  });

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

        {/* Vertical hover line */}
        {hoveredIndex !== null && allPoints[0][hoveredIndex] && (
          <line
            x1={allPoints[0][hoveredIndex].x}
            y1={padding.top}
            x2={allPoints[0][hoveredIndex].x}
            y2={chartHeight + padding.top}
            stroke={theme.colors.borderLight}
            strokeWidth="1"
            vectorEffect="non-scaling-stroke"
            strokeDasharray="3,3"
          />
        )}

        {datasets.map(function(dataset, dsIndex) {
          var points = allPoints[dsIndex];
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
                var isHovered = hoveredIndex === idx;
                return (
                  <circle
                    key={idx}
                    cx={p.x}
                    cy={p.y}
                    r={isHovered ? "2" : "1.2"}
                    fill={isHovered ? dataset.color : "white"}
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

      {/* Hover zones */}
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 40, display: "flex" }}>
        {datasets[0].data.map(function(_, idx) {
          return (
            <div
              key={idx}
              style={{ flex: 1, cursor: "pointer" }}
              onMouseEnter={function() { setHoveredIndex(idx); }}
              onMouseLeave={function() { setHoveredIndex(null); }}
            />
          );
        })}
      </div>

      {/* Tooltip */}
      {hoveredIndex !== null && allPoints[0][hoveredIndex] && (
        <div style={{
          position: "absolute",
          top: 8,
          left: allPoints[0][hoveredIndex].x + "%",
          transform: "translateX(-50%)",
          background: theme.colors.textPrimary,
          color: "white",
          padding: "8px 12px",
          borderRadius: 6,
          fontSize: 11,
          whiteSpace: "nowrap",
          pointerEvents: "none",
          zIndex: 10,
          boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
        }}>
          <div style={{ fontWeight: 600, marginBottom: 4 }}>{allPoints[0][hoveredIndex].label}</div>
          {datasets.map(function(ds, i) {
            return (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 2 }}>
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: ds.color }} />
                <span>{ds.label}: {formatValue(allPoints[i][hoveredIndex].value, format)}</span>
              </div>
            );
          })}
        </div>
      )}

      {/* X-axis labels */}
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
            <span key={idx} style={{ fontSize: 10, color: hoveredIndex === idx ? theme.colors.textPrimary : theme.colors.textMuted, fontWeight: hoveredIndex === idx ? 600 : 400 }}>
              {d.label}
            </span>
          );
        })}
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

/* Donut Chart */
interface DonutSegment {
  label: string;
  value: number;
  color: string;
}

interface DonutChartProps {
  data: DonutSegment[];
  size?: number;
  thickness?: number;
  format?: FormatType;
}

export function DonutChart({
  data,
  size = 180,
  thickness = 32,
  format = "currency",
}: DonutChartProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  var total = data.reduce(function(sum, d) { return sum + d.value; }, 0);

  if (total === 0) {
    return (
      <div style={{ width: size, height: size, display: "flex", alignItems: "center", justifyContent: "center", color: theme.colors.textMuted }}>
        No data
      </div>
    );
  }

  var radius = size / 2;
  var innerRadius = radius - thickness;
  var centerX = radius;
  var centerY = radius;

  var segments: { path: string; color: string; label: string; value: number; percentage: number; midAngle: number }[] = [];
  var currentAngle = -90;

  data.forEach(function(d, idx) {
    var percentage = d.value / total;
    var angle = percentage * 360;
    var startAngle = currentAngle;
    var endAngle = currentAngle + angle;
    var midAngle = (startAngle + endAngle) / 2;

    var startRad = (startAngle * Math.PI) / 180;
    var endRad = (endAngle * Math.PI) / 180;

    var x1 = centerX + radius * Math.cos(startRad);
    var y1 = centerY + radius * Math.sin(startRad);
    var x2 = centerX + radius * Math.cos(endRad);
    var y2 = centerY + radius * Math.sin(endRad);

    var x3 = centerX + innerRadius * Math.cos(endRad);
    var y3 = centerY + innerRadius * Math.sin(endRad);
    var x4 = centerX + innerRadius * Math.cos(startRad);
    var y4 = centerY + innerRadius * Math.sin(startRad);

    var largeArc = angle > 180 ? 1 : 0;

    var path = [
      "M", x1, y1,
      "A", radius, radius, 0, largeArc, 1, x2, y2,
      "L", x3, y3,
      "A", innerRadius, innerRadius, 0, largeArc, 0, x4, y4,
      "Z"
    ].join(" ");

    segments.push({
      path: path,
      color: d.color,
      label: d.label,
      value: d.value,
      percentage: percentage * 100,
      midAngle: midAngle,
    });

    currentAngle = endAngle;
  });

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
      <div style={{ position: "relative", width: size, height: size }}>
        <svg width={size} height={size}>
          {segments.map(function(seg, idx) {
            var isHovered = hoveredIndex === idx;
            var scale = isHovered ? 1.05 : 1;
            return (
              <path
                key={idx}
                d={seg.path}
                fill={seg.color}
                opacity={hoveredIndex === null || isHovered ? 1 : 0.5}
                style={{
                  cursor: "pointer",
                  transition: "all 150ms ease",
                  transform: isHovered ? "scale(" + scale + ")" : "scale(1)",
                  transformOrigin: centerX + "px " + centerY + "px",
                }}
                onMouseEnter={function() { setHoveredIndex(idx); }}
                onMouseLeave={function() { setHoveredIndex(null); }}
              />
            );
          })}
        </svg>

        {/* Center text */}
        <div style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          textAlign: "center",
        }}>
          {hoveredIndex !== null ? (
            <>
              <div style={{ fontSize: 18, fontWeight: 700, color: theme.colors.textPrimary }}>
                {formatValue(segments[hoveredIndex].value, format)}
              </div>
              <div style={{ fontSize: 11, color: theme.colors.textMuted }}>
                {segments[hoveredIndex].percentage.toFixed(1)}%
              </div>
            </>
          ) : (
            <>
              <div style={{ fontSize: 18, fontWeight: 700, color: theme.colors.textPrimary }}>
                {formatValue(total, format)}
              </div>
              <div style={{ fontSize: 11, color: theme.colors.textMuted }}>Total</div>
            </>
          )}
        </div>
      </div>

      {/* Legend */}
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {data.map(function(d, idx) {
          var isHovered = hoveredIndex === idx;
          return (
            <div
              key={idx}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                cursor: "pointer",
                opacity: hoveredIndex === null || isHovered ? 1 : 0.5,
                transition: "opacity 150ms ease",
              }}
              onMouseEnter={function() { setHoveredIndex(idx); }}
              onMouseLeave={function() { setHoveredIndex(null); }}
            >
              <div style={{ width: 12, height: 12, borderRadius: 3, background: d.color }} />
              <span style={{ fontSize: 13, color: theme.colors.textPrimary, fontWeight: isHovered ? 600 : 400 }}>{d.label}</span>
              <span style={{ fontSize: 12, color: theme.colors.textMuted, marginLeft: "auto" }}>{formatValue(d.value, format)}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* Date Range Toggle */
interface DateRangeToggleProps {
  value: string;
  onChange: (value: string) => void;
}

export function DateRangeToggle({ value, onChange }: DateRangeToggleProps) {
  var options = [
    { label: "1M", value: "1" },
    { label: "3M", value: "3" },
    { label: "6M", value: "6" },
    { label: "12M", value: "12" },
    { label: "All", value: "all" },
  ];

  return (
    <div style={{
      display: "inline-flex",
      background: theme.colors.bgTertiary,
      borderRadius: theme.borderRadius.md,
      padding: 3,
    }}>
      {options.map(function(opt) {
        var isActive = value === opt.value;
        return (
          <button
            key={opt.value}
            onClick={function() { onChange(opt.value); }}
            style={{
              padding: "6px 12px",
              fontSize: 12,
              fontWeight: 500,
              border: "none",
              borderRadius: theme.borderRadius.sm,
              cursor: "pointer",
              background: isActive ? theme.colors.bgSecondary : "transparent",
              color: isActive ? theme.colors.textPrimary : theme.colors.textMuted,
              boxShadow: isActive ? "0 1px 3px rgba(0,0,0,0.1)" : "none",
              transition: "all 150ms ease",
            }}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
