'use client';

import type { DroneDesign } from '@/types/drone';

interface ViewportProps {
  design: DroneDesign;
}

function getArmAngles(frameType: DroneDesign['frameType']): number[] {
  switch (frameType) {
    case 'quad': return [45, 135, 225, 315];
    case 'y6': return [0, 60, 120, 180, 240, 300];
    case 'x8': return [22.5, 67.5, 112.5, 157.5, 202.5, 247.5, 292.5, 337.5];
    case 'hexa': return [0, 60, 120, 180, 240, 300];
    case 'octo': return [22.5, 67.5, 112.5, 157.5, 202.5, 247.5, 292.5, 337.5];
  }
}

interface Point { x: number; y: number; }

function polarToCartesian(cx: number, cy: number, r: number, angleDeg: number): Point {
  const rad = (angleDeg * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

export default function Viewport({ design }: ViewportProps) {
  const cx = 200;
  const cy = 200;
  const armLength = 120;
  const motorRadius = 10;
  const frameRadius = 22;
  const angles = getArmAngles(design.frameType);

  return (
    <div className="flex-1 min-h-[400px] border border-border-subtle rounded-[10px] bg-bg-void grid-pattern relative overflow-hidden flex items-center justify-center">
      <svg viewBox="0 0 400 400" className="w-full h-full max-h-[600px] p-4">
        {/* Arms */}
        {angles.map((angle, i) => {
          const end = polarToCartesian(cx, cy, armLength, angle);
          return (
            <line
              key={`arm-${i}`}
              x1={cx} y1={cy} x2={end.x} y2={end.y}
              stroke="#e5e5e5" strokeWidth="3" strokeLinecap="round" opacity={0.7}
            />
          );
        })}

        {/* Frame center */}
        <circle cx={cx} cy={cy} r={frameRadius} fill="none" stroke="#fafafa" strokeWidth="2.5" opacity={0.6} />
        <circle cx={cx} cy={cy} r={6} fill="#fafafa" opacity={0.8} />

        {/* Motors */}
        {angles.map((angle, i) => {
          const pos = polarToCartesian(cx, cy, armLength, angle);
          return (
            <g key={`motor-${i}`}>
              <circle cx={pos.x} cy={pos.y} r={motorRadius} fill="#141414" stroke="#a3a3a3" strokeWidth="1.5" />
              <circle cx={pos.x} cy={pos.y} r={3} fill="#fafafa" opacity={0.5} />
            </g>
          );
        })}

        {/* Coaxial inner motors for Y6 and X8 */}
        {(design.frameType === 'y6' || design.frameType === 'x8') &&
          angles.map((angle, i) => {
            const pos = polarToCartesian(cx, cy, armLength * 0.55, angle);
            return (
              <g key={`coax-${i}`}>
                <circle cx={pos.x} cy={pos.y} r={motorRadius * 0.8} fill="none" stroke="#a3a3a3" strokeWidth="1" strokeDasharray="3 2" opacity={0.4} />
                <circle cx={pos.x} cy={pos.y} r={2.5} fill="#fafafa" opacity={0.25} />
              </g>
            );
          })}
      </svg>

      {/* Bottom label */}
      <div className="absolute bottom-3 left-4 text-sm text-text-muted">
        Current: <span className="text-text-primary font-medium font-mono uppercase">{design.frameType}</span>
      </div>
    </div>
  );
}
