"use client";

export default function EmergencyControls({
	onAction,
}: {
	onAction: (action: string) => void;
}) {
	return (
		<div className="p-3 bg-bg-void/50">
			<h3 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-3">
				Emergency Controls
			</h3>
			<div className="flex gap-3">
				<button
					onClick={() => onAction("arm")}
					className="flex-1 px-3 py-2 bg-accent-400 hover:bg-accent-500 text-bg-void rounded-lg text-xs font-bold font-mono uppercase transition-colors duration-200"
				>
					Arm
				</button>
				<button
					onClick={() => onAction("emergency_stop")}
					className="flex-1 px-3 py-2 bg-error hover:bg-error/80 text-white rounded-lg text-xs font-bold font-mono uppercase transition-colors duration-200"
				>
					Emergency Stop
				</button>
			</div>
		</div>
	);
}
