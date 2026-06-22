/**
 * TrendChart — inline SVG line chart for latency trend over time.
 */

"use client";

import { TrendingUp } from "lucide-react";
import { formatMs, formatDate } from "./helpers";
import type { LatencyTrendItem } from "../../types";

// ─── Constants ───────────────────────────────────────────────────────────────

const TREND_CHART_HEIGHT = 220;
const TREND_CHART_PADDING = { top: 16, right: 16, bottom: 32, left: 48 };

// ─── Component ───────────────────────────────────────────────────────────────

function TrendChart({ data }: { data: LatencyTrendItem[] }) {
  if (!data || data.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 px-4 py-12 text-center">
        <TrendingUp className="h-8 w-8 text-[var(--text-tertiary)]" />
        <p className="text-xs text-[var(--text-secondary)]">
          No trend data available yet
        </p>
      </div>
    );
  }

  const width = 800; // viewBox width, scales responsively
  const chartW = width - TREND_CHART_PADDING.left - TREND_CHART_PADDING.right;
  const chartH = TREND_CHART_HEIGHT - TREND_CHART_PADDING.top - TREND_CHART_PADDING.bottom;

  // Find max value across avg and p95
  const maxVal = Math.max(...data.flatMap((d) => [d.avgLatencyMs, d.p95LatencyMs]), 1);
  // Round up to nice number
  const yMax = Math.ceil(maxVal / 100) * 100 || 100;

  const xScale = (i: number) =>
    TREND_CHART_PADDING.left + (i / Math.max(data.length - 1, 1)) * chartW;
  const yScale = (v: number) =>
    TREND_CHART_PADDING.top + chartH - (v / yMax) * chartH;

  // Generate Y-axis ticks
  const yTicks = 4;
  const yStep = yMax / yTicks;

  // Polylines
  const avgLine = data
    .map((d, i) => `${xScale(i)},${yScale(d.avgLatencyMs)}`)
    .join(" ");
  const p95Line = data
    .map((d, i) => `${xScale(i)},${yScale(d.p95LatencyMs)}`)
    .join(" ");

  // Area under avg (gradient fill)
  const avgArea =
    `${avgLine} ${xScale(data.length - 1)},${yScale(0)} ${xScale(0)},${yScale(0)}`;

  // P95 area
  const p95Area =
    `${p95Line} ${xScale(data.length - 1)},${yScale(0)} ${xScale(0)},${yScale(0)}`;

  return (
    <svg
      viewBox={`0 0 ${width} ${TREND_CHART_HEIGHT}`}
      className="w-full h-auto"
      preserveAspectRatio="xMidYMid meet"
      role="img"
      aria-label="Latency trend chart"
    >
      {/* Grid lines */}
      {Array.from({ length: yTicks + 1 }).map((_, i) => {
        const y = yScale(i * yStep);
        return (
          <g key={i}>
            <line
              x1={TREND_CHART_PADDING.left}
              y1={y}
              x2={width - TREND_CHART_PADDING.right}
              y2={y}
              stroke="var(--border-subtle)"
              strokeWidth={1}
            />
            <text
              x={TREND_CHART_PADDING.left - 6}
              y={y + 3}
              textAnchor="end"
              className="fill-[var(--text-tertiary)]"
              fontSize={10}
              fontFamily="ui-monospace, monospace"
            >
              {formatMs(i * yStep)}
            </text>
          </g>
        );
      })}

      {/* P95 area */}
      <defs>
        <linearGradient id="p95-gradient" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--color-warning)" stopOpacity={0.2} />
          <stop offset="100%" stopColor="var(--color-warning)" stopOpacity={0.02} />
        </linearGradient>
        <linearGradient id="avg-gradient" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--color-info)" stopOpacity={0.2} />
          <stop offset="100%" stopColor="var(--color-info)" stopOpacity={0.02} />
        </linearGradient>
      </defs>

      <polygon points={p95Area} fill="url(#p95-gradient)" />
      <polygon points={avgArea} fill="url(#avg-gradient)" />

      {/* P95 line */}
      <polyline
        points={p95Line}
        fill="none"
        stroke="var(--color-warning)"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        className="drop-shadow-sm"
      />

      {/* Avg line */}
      <polyline
        points={avgLine}
        fill="none"
        stroke="var(--color-info)"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        className="drop-shadow-sm"
      />

      {/* X-axis labels */}
      {data.map((d, i) => {
        // Show at most ~8 labels
        if (data.length > 8 && i % Math.ceil(data.length / 8) !== 0 && i !== data.length - 1) return null;
        return (
          <text
            key={d.date}
            x={xScale(i)}
            y={TREND_CHART_HEIGHT - 6}
            textAnchor="middle"
            className="fill-[var(--text-tertiary)]"
            fontSize={10}
          >
            {formatDate(d.date)}
          </text>
        );
      })}

      {/* Legend */}
      <g transform={`translate(${width - 120}, 8)`}>
        <rect x={0} y={0} width={10} height={10} rx={2} fill="var(--color-info)" />
        <text x={14} y={9} className="fill-[var(--text-secondary)]" fontSize={10}>
          Avg
        </text>
        <rect x={60} y={0} width={10} height={10} rx={2} fill="var(--color-warning)" />
        <text x={74} y={9} className="fill-[var(--text-secondary)]" fontSize={10}>
          P95
        </text>
      </g>
    </svg>
  );
}

export { TrendChart };
