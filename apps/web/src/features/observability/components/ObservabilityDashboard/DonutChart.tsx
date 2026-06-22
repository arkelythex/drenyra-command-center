import type { RunSummary } from "../../types";
import {
  DONUT_CIRCUMFERENCE,
  DONUT_RADIUS,
  DONUT_SEGMENT_ORDER,
  DONUT_SIZE,
  DONUT_STROKE,
} from "./constants";

export function DonutChart({ summary }: { summary: RunSummary }) {
  const total = summary.total || 1;

  // Compute stroke-dashoffset for each segment via reduce
  const segments = DONUT_SEGMENT_ORDER.reduce<
    Array<
      (typeof DONUT_SEGMENT_ORDER)[number] & {
        value: number;
        fraction: number;
        length: number;
        offset: number;
      }
    >
  >((acc, seg) => {
    const raw = (summary[seg.key] as number) || 0;
    const fraction = raw / total;
    const length = fraction * DONUT_CIRCUMFERENCE;
    const prevOffset =
      acc.length > 0
        ? acc[acc.length - 1].offset + acc[acc.length - 1].length
        : 0;
    acc.push({ ...seg, value: raw, fraction, length, offset: prevOffset });
    return acc;
  }, []);

  return (
    <div className="flex flex-col items-center gap-4">
      <svg
        width={DONUT_SIZE}
        height={DONUT_SIZE}
        viewBox={`0 0 ${DONUT_SIZE} ${DONUT_SIZE}`}
        className="rotate-[-90deg]"
      >
        {/* Background ring */}
        <circle
          cx={DONUT_SIZE / 2}
          cy={DONUT_SIZE / 2}
          r={DONUT_RADIUS}
          fill="none"
          stroke="var(--border-subtle)"
          strokeWidth={DONUT_STROKE}
        />
        {/* Data segments */}
        {segments.map((seg) =>
          seg.fraction > 0 ? (
            <circle
              key={seg.key}
              cx={DONUT_SIZE / 2}
              cy={DONUT_SIZE / 2}
              r={DONUT_RADIUS}
              fill="none"
              stroke={seg.color}
              strokeWidth={DONUT_STROKE}
              strokeDasharray={`${seg.length} ${DONUT_CIRCUMFERENCE - seg.length}`}
              strokeDashoffset={-seg.offset}
              strokeLinecap="round"
              className="transition-all duration-500"
            />
          ) : null,
        )}
      </svg>

      {/* Center total */}
      <div className="relative mt-[-148px] mb-8 flex flex-col items-center justify-center">
        <span className="font-mono tabular-nums text-3xl font-bold text-[var(--text-primary)]">
          {summary.total}
        </span>
        <span className="text-xs font-medium uppercase tracking-wider text-[var(--text-secondary)]">
          Total
        </span>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap justify-center gap-4">
        {segments.map((seg) => (
          <div key={seg.key} className="flex items-center gap-1.5 text-xs">
            <span
              className="inline-block h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: seg.color }}
            />
            <span className="text-[var(--text-secondary)]">{seg.label}</span>
            <span className="font-mono tabular-nums text-[var(--text-primary)]">
              {seg.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
