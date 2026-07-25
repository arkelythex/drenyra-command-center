"use client";

import { useEffect, useState } from "react";
import type { Telemetry } from "@/types/drone";

export default function HUD({ telemetry }: { telemetry: Telemetry }) {
	const [roll, setRoll] = useState(0);

	useEffect(() => {
		const interval = setInterval(() => {
			setRoll(Math.sin(Date.now() / 2000) * 2);
		}, 50);
		return () => clearInterval(interval);
	}, []);

	const altitudeTicks = [4040, 4035, 4030, 4025, 4020];
	const speedTicks = [20, 15, 10, 5, 0];
	const headings = [
		{ label: "N", deg: 0 },
		{ label: "E", deg: 90 },
		{ label: "S", deg: 180 },
		{ label: "W", deg: 270 },
	];

	return (
		<div className="flex-1 min-h-[400px] m-3 bg-bg-void rounded-[10px] border border-border-subtle relative overflow-hidden grid-pattern">
			{/* Horizon */}
			<div
				className="absolute inset-0 flex items-center justify-center"
				style={{ transform: `rotate(${roll}deg)` }}
			>
				<div
					className="absolute inset-0 bg-accent-400/5"
					style={{ clipPath: "polygon(0 0, 100% 0, 100% 50%, 0 50%)" }}
				/>
				<div
					className="absolute inset-0 bg-warning/5"
					style={{ clipPath: "polygon(0 50%, 100% 50%, 100% 100%, 0 100%)" }}
				/>
				<div
					className="absolute left-0 right-0 h-px bg-text-muted/40 z-10"
					style={{ top: "50%" }}
				/>
			</div>

			{/* Center Crosshair */}
			<div className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none">
				<div className="relative w-12 h-12">
					<div className="absolute top-1/2 left-0 right-0 h-px bg-accent-400/60" />
					<div className="absolute left-1/2 top-0 bottom-0 w-px bg-accent-400/60" />
					<div className="absolute top-1/2 left-1/2 w-2 h-2 -translate-x-1/2 -translate-y-1/2 border border-accent-400/60 rounded-full" />
				</div>
			</div>

			{/* Data Readout */}
			<div className="absolute top-4 left-1/2 -translate-x-1/2 z-20">
				<div className="text-lg font-bold font-mono text-accent-400 tracking-wider glow-text">
					ALT {Math.round(telemetry.altitude)}m&nbsp;&nbsp;&nbsp;SPD{" "}
					{telemetry.speed.toFixed(1)}&nbsp;&nbsp;&nbsp;HDG 273
				</div>
			</div>

			{/* Compass Labels */}
			<div className="absolute top-12 left-1/2 -translate-x-1/2 z-20 flex gap-8">
				{headings.map((h) => (
					<span key={h.label} className="text-xs font-mono text-text-muted">
						{h.label}
					</span>
				))}
			</div>
			<div className="absolute top-[58px] left-1/2 -translate-x-1/2 z-20">
				<span className="text-accent-400 text-[10px]">▲</span>
			</div>

			{/* Altitude Ladder (right) */}
			<div className="absolute right-4 top-1/2 -translate-y-1/2 z-20 flex flex-col gap-3">
				{altitudeTicks.map((alt) => {
					const isCurrent = Math.abs(alt - Math.round(telemetry.altitude)) < 3;
					return (
						<div key={alt} className="flex items-center gap-2 justify-end">
							<span
								className={`text-xs font-mono ${isCurrent ? "text-accent-400 font-bold glow-text" : "text-text-muted"}`}
							>
								{alt}
							</span>
							<div
								className={`w-4 h-px ${isCurrent ? "bg-accent-400" : "bg-text-muted/40"}`}
							/>
						</div>
					);
				})}
			</div>

			{/* Speed Ladder (left) */}
			<div className="absolute left-4 top-1/2 -translate-y-1/2 z-20 flex flex-col gap-3">
				{speedTicks.map((spd) => {
					const isCurrent = Math.abs(spd - Math.round(telemetry.speed)) < 2;
					return (
						<div key={spd} className="flex items-center gap-2">
							<div
								className={`w-4 h-px ${isCurrent ? "bg-accent-400" : "bg-text-muted/40"}`}
							/>
							<span
								className={`text-xs font-mono ${isCurrent ? "text-accent-400 font-bold glow-text" : "text-text-muted"}`}
							>
								{spd}
							</span>
						</div>
					);
				})}
			</div>
		</div>
	);
}
