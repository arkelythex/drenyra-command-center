'use client';

import type { DroneDesign } from '@/types/drone';

function twrColor(twr: number): string {
  if (twr >= 2.0) return 'text-success';
  if (twr >= 1.5) return 'text-warning';
  return 'text-error';
}

function MetricRow({ label, value, unit, valueClassName = 'text-text-primary' }: {
  label: string; value: string; unit?: string; valueClassName?: string;
}) {
  return (
    <div className="flex items-center justify-between py-2.5 border-b border-border-subtle/50 last:border-b-0">
      <span className="text-sm text-text-secondary">{label}</span>
      <span className={`text-sm font-medium font-mono ${valueClassName}`}>
        {value}
        {unit && <span className="text-text-muted ml-1 text-xs">{unit}</span>}
      </span>
    </div>
  );
}

export default function MetricsPanel({ design }: { design: DroneDesign }) {
  return (
    <div className="bg-bg-surface border border-border-subtle rounded-[10px] p-4">
      <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-3">Design Metrics</h3>
      <MetricRow label="Frame Type" value={design.frameType.toUpperCase()} />
      <MetricRow label="Arm Length" value={design.armLength.toString()} unit="mm" />
      <MetricRow label="Motor Count" value={design.motorCount.toString()} />
      <MetricRow label="TWR" value={design.twr.toFixed(1)} unit=":1" valueClassName={twrColor(design.twr)} />
      <MetricRow label="Payload" value={design.payloadMass.toString()} unit="g" />
      <MetricRow label="Flight Time" value={design.flightTimeMin.toFixed(1)} unit="min" />
      <MetricRow label="Cost" value={`$${design.costUsd.toLocaleString()}`} />
      <MetricRow label="Battery" value={`${design.batteryCells}S ${design.batteryCapacity}mAh`} />
      <MetricRow label="Propeller" value={`${design.propellerDiameter}"x${design.propellerPitch}"`} />
      <MetricRow label="Material" value={design.frameMaterial.charAt(0).toUpperCase() + design.frameMaterial.slice(1)} />
    </div>
  );
}
