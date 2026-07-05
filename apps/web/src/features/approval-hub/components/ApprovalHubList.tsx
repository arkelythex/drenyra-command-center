import { CheckCircle2, Loader2 } from "lucide-react";
import type { ApprovalItem } from "../ApprovalHubPage.types";
import { ApprovalHubCard } from "./ApprovalHubCard";

interface ApprovalHubListProps {
	items: ApprovalItem[];
	isLoading: boolean;
	onApprove: (id: string) => void;
	onReject: (id: string) => void;
}

export function ApprovalHubList({
	items,
	isLoading,
	onApprove,
	onReject,
}: ApprovalHubListProps) {
	if (isLoading && items.length === 0) {
		return (
			<div className="rounded-2xl border border-[var(--border-subtle)] py-12 text-center space-y-2">
				<Loader2
					size={32}
					className="mx-auto animate-spin text-[var(--text-tertiary)]"
				/>
				<p className="text-xs font-bold text-[var(--text-tertiary)]">
					Cargando aprobaciones...
				</p>
			</div>
		);
	}

	if (items.length === 0) {
		return (
			<div className="rounded-2xl border border-[var(--border-subtle)] py-12 text-center space-y-2">
				<CheckCircle2
					size={32}
					className="mx-auto text-[var(--color-success)]"
				/>
				<p className="text-xs font-bold text-[var(--text-primary)]">
					Sin aprobaciones pendientes
				</p>
				<p className="text-2xs text-[var(--text-tertiary)]">
					Todas las acciones han sido revisadas.
				</p>
			</div>
		);
	}

	return (
		<div className="space-y-2">
			{items.map((approval) => (
				<ApprovalHubCard
					key={approval.id}
					approval={approval}
					onApprove={onApprove}
					onReject={onReject}
				/>
			))}
		</div>
	);
}
