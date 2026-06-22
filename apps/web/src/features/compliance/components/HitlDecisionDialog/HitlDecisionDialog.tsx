/**
 * HitlDecisionDialog — Modal for human-in-the-loop approve/reject/escalate decisions.
 *
 * @example
 * ```tsx
 * <HitlDecisionDialog
 *   action={selectedAction}
 *   decision="APPROVE"
 *   open={dialogOpen}
 *   onOpenChange={setDialogOpen}
 *   onDecide={handleDecide}
 *   isDeciding={isDeciding}
 * />
 * ```
 */

import { ArrowUpCircle, CheckCircle, Loader2, XCircle } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { confidenceBadgeClasses } from "../shared/confidence";
import type { RoadmapDecisionType, RoadmapMvpAction } from "../shared/types";

interface HitlDecisionDialogProps {
	action: RoadmapMvpAction | null;
	decision: RoadmapDecisionType | null;
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onDecide: (
		action: RoadmapMvpAction,
		decision: RoadmapDecisionType,
		reason: string,
	) => Promise<void>;
	isDeciding: boolean;
}

type DecisionConfig = {
	label: string;
	icon: typeof CheckCircle;
	variant: "primary" | "destructive" | "outline";
	color: string;
	description: string;
};

const DECISION_MAP: Record<RoadmapDecisionType, DecisionConfig> = {
	APPROVE: {
		label: "Aprobar",
		icon: CheckCircle,
		variant: "primary",
		color: "text-[var(--color-success)]",
		description: "La acción se ejecutará tras pasar el gate de aprobación.",
	},
	REJECT: {
		label: "Rechazar",
		icon: XCircle,
		variant: "destructive",
		color: "text-red-500",
		description: "La acción será cancelada y no se ejecutará.",
	},
	ESCALATE: {
		label: "Escalar",
		icon: ArrowUpCircle,
		variant: "outline",
		color: "text-amber-500",
		description: "La acción se transferirá a un aprobador senior.",
	},
};

export function HitlDecisionDialog({
	action,
	decision,
	open,
	onOpenChange,
	onDecide,
	isDeciding,
}: HitlDecisionDialogProps) {
	const [reason, setReason] = useState("");

	if (!action || !decision) return null;

	const config = DECISION_MAP[decision];
	const Icon = config.icon;

	const handleConfirm = async () => {
		await onDecide(action, decision, reason.trim());
		setReason("");
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-w-md">
				<DialogHeader>
					<DialogTitle className="flex items-center gap-2">
						<Icon className={`h-5 w-5 ${config.color}`} />
						{config.label} acción del Copilot
					</DialogTitle>
					<DialogDescription>
						Estás a punto de{" "}
						<span className={config.color}>{config.label.toLowerCase()}</span>{" "}
						la siguiente recomendación:
					</DialogDescription>
				</DialogHeader>

				{/* Action summary */}
				<div className="space-y-3 rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-2)]/60 p-4">
					<p className="text-sm font-semibold text-[var(--text-primary)]">
						{action.title}
					</p>
					<p className="text-sm text-[var(--text-secondary)]">
						{action.description}
					</p>
					<p className="text-xs text-[var(--text-tertiary)]">
						Trace ID: <span className="font-mono">{action.traceId}</span>
					</p>
					<div className="flex flex-wrap items-center gap-2">
						<span className={confidenceBadgeClasses(action.confidence)}>
							{(action.confidence * 100).toFixed(0)}% confianza
						</span>
						<span className="rounded-full border border-[var(--border-subtle)] bg-[var(--surface-1)] px-2 py-0.5 text-label font-medium text-[var(--text-tertiary)]">
							{action.impact}
						</span>
					</div>
				</div>

				<p className="text-sm text-[var(--text-secondary)]">
					{config.description}
				</p>

				{/* Reason input */}
				<div className="space-y-1.5">
					<label
						htmlFor="hitl-reason"
						className="text-sm font-medium text-[var(--text-primary)]"
					>
						Motivo de la decisión <span className="text-red-400">*</span>
					</label>
					<Textarea
						id="hitl-reason"
						placeholder="Describe la razón de tu decisión (mínimo 3 caracteres)..."
						value={reason}
						onChange={(e) => setReason(e.target.value)}
						className="min-h-[80px] resize-none"
						disabled={isDeciding}
					/>
					{reason.length > 0 && reason.length < 3 && (
						<p className="text-xs text-red-400">
							El motivo debe tener al menos 3 caracteres
						</p>
					)}
				</div>

				<DialogFooter>
					<Button
						variant="outline"
						onClick={() => onOpenChange(false)}
						disabled={isDeciding}
					>
						Cancelar
					</Button>
					<Button
						variant={config.variant}
						disabled={reason.trim().length < 3 || isDeciding}
						onClick={handleConfirm}
					>
						{isDeciding ? (
							<Loader2 className="mr-2 h-4 w-4 animate-spin" />
						) : (
							<Icon className="mr-2 h-4 w-4" />
						)}
						{isDeciding ? "Registrando..." : config.label}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
