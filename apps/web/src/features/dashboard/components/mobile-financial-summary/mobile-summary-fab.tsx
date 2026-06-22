import { Plus } from "lucide-react";

interface MobileSummaryFabProps {
	onClick: () => void;
}

export function MobileSummaryFab({ onClick }: MobileSummaryFabProps) {
	return (
		<div className="fixed bottom-8 right-8 z-[100]">
			<button
				onClick={onClick}
				className="group flex h-16 w-16 items-center justify-center rounded-full border border-[rgba(var(--premium-info-rgb),0.18)] bg-[linear-gradient(145deg,var(--premium-action-cyan),var(--accent))] text-[var(--premium-text-primary)] shadow-[0_16px_28px_rgba(var(--premium-action-blue-rgb),0.32),0_6px_14px_rgba(0,0,0,0.3)] transition-[box-shadow] duration-150 active:scale-95 motion-reduce:transition-none motion-reduce:active:scale-100"
				aria-label="Nuevo movimiento"
			>
				<Plus size={30} strokeWidth={2.6} />
			</button>
		</div>
	);
}
