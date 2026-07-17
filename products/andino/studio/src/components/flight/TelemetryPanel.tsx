import type { Telemetry } from "@/types/drone";

export default function TelemetryPanel({ telemetry }: { telemetry: Telemetry }) {
  const batteryBars = Math.round(telemetry.batteryPercent / 10);

  return (
    <div className="w-[260px] border-r border-border-subtle p-3 flex flex-col gap-3 overflow-y-auto bg-bg-void/50">
      {/* Position */}
      <div className="bg-bg-surface rounded-[10px] p-3">
        <div className="text-xs text-text-muted font-medium uppercase tracking-wider mb-1">Position</div>
        <div className="text-sm font-mono text-text-primary leading-relaxed">
          <div>Lat: {telemetry.lat.toFixed(4)}</div>
          <div>Lon: {telemetry.lon.toFixed(4)}</div>
          <div>Alt: {Math.round(telemetry.altitude).toLocaleString()} m</div>
        </div>
      </div>

      {/* Speed */}
      <div className="bg-bg-surface rounded-[10px] p-3">
        <div className="text-xs text-text-muted font-medium uppercase tracking-wider mb-1">Speed</div>
        <div className="text-sm font-mono text-text-primary leading-relaxed">
          <div>Ground: {telemetry.speed.toFixed(1)} m/s</div>
          <div>Vertical: 0.3 m/s</div>
        </div>
      </div>

      {/* Battery */}
      <div className="bg-bg-surface rounded-[10px] p-3">
        <div className="text-xs text-text-muted font-medium uppercase tracking-wider mb-1">Battery</div>
        <div className="text-sm font-mono text-text-primary leading-relaxed">
          <div>{telemetry.voltage.toFixed(1)}V | {telemetry.current.toFixed(1)}A</div>
          <div className="mt-1 flex items-center gap-1">
            <span className="text-accent-400 text-sm font-mono">
              {'█'.repeat(batteryBars)}{'░'.repeat(10 - batteryBars)}
            </span>
            <span className="text-xs text-text-muted">{Math.round(telemetry.batteryPercent)}%</span>
          </div>
        </div>
      </div>

      {/* GPS */}
      <div className="bg-bg-surface rounded-[10px] p-3">
        <div className="text-xs text-text-muted font-medium uppercase tracking-wider mb-1">GPS</div>
        <div className="text-sm font-mono text-text-primary leading-relaxed">
          <div>{telemetry.gpsSats} sats | 3D Fix</div>
          <div>HDOP: 0.8</div>
        </div>
      </div>

      {/* Flight Mode */}
      <div className="mt-auto">
        <span className="inline-block px-3 py-1 rounded-lg bg-accent-400/20 text-accent-400 text-sm font-bold font-mono">
          {telemetry.flightMode}
        </span>
      </div>
    </div>
  );
}
