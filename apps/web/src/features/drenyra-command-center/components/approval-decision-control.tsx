import { Check, X } from "lucide-react";
import { useId, useState } from "react";
import { Button } from "@/components/ui/button";
import type { ApprovalRequest } from "../api/drenyra-command-center.api";
import { ApprovalDiff } from "./approval-diff";

export function ApprovalDecisionControl({
	approval,
	onApprove,
	onReject,
	isBusy,
	serverErrorMessage,
}: {
	approval: ApprovalRequest;
	onApprove: (id: string, decisionReason: string) => void;
	onReject: (id: string, decisionReason: string) => void;
	isBusy: boolean;
	serverErrorMessage?: string;
}) {
	const reasonId = useId();
	const errorId = useId();
	const [decisionReason, setDecisionReason] = useState("");
	const [localErrorMessage, setLocalErrorMessage] = useState<string | null>(
		null,
	);
	const trimmedReason = decisionReason.trim();
	const visibleErrorMessage = localErrorMessage ?? serverErrorMessage;

	const submitDecision = (decision: "approve" | "reject") => {
		if (trimmedReason.length < 8) {
			setLocalErrorMessage(
				"Ingresá un motivo de decisión auditable de al menos 8 caracteres.",
			);
			return;
		}
		setLocalErrorMessage(null);
		if (decision === "approve") onApprove(approval.id, trimmedReason);
		else onReject(approval.id, trimmedReason);
	};

	return (
		<div className="space-y-2">
			<ApprovalDiff approval={approval} />
			<label
				className="block space-y-1 text-xs font-semibold"
				htmlFor={reasonId}
			>
				{`Motivo de decisión para ${approval.title}`}
				<textarea
					id={reasonId}
					value={decisionReason}
					onChange={(event) => {
						setDecisionReason(event.target.value);
						setLocalErrorMessage(null);
					}}
					disabled={isBusy}
					rows={3}
					placeholder="Ej. Evidencia validada contra sustento interno"
					aria-describedby={visibleErrorMessage ? errorId : undefined}
					className="w-full resize-none rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-1)] px-3 py-2 text-sm font-normal outline-none transition focus:border-[var(--color-info)]"
				/>
			</label>
			{visibleErrorMessage && (
				<p
					id={errorId}
					role="alert"
					aria-live="polite"
					className="rounded-xl border border-[var(--color-danger)]/30 bg-[var(--color-danger)]/10 p-2 text-2xs font-semibold text-[var(--color-danger)]"
				>
					{visibleErrorMessage}
				</p>
			)}
			<div className="grid grid-cols-2 gap-2">
				<Button
					size="sm"
					onClick={() => submitDecision("approve")}
					disabled={isBusy}
				>
					<Check size={13} className="mr-1" />
					Aprobar
				</Button>
				<Button
					size="sm"
					variant="outline"
					onClick={() => submitDecision("reject")}
					disabled={isBusy}
				>
					<X size={13} className="mr-1" />
					Rechazar
				</Button>
			</div>
		</div>
	);
}
