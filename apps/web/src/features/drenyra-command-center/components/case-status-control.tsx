import { type FormEvent, useId, useState } from "react";
import { Button } from "@/components/ui/button";
import type { FiscalCaseStatus } from "../api/drenyra-command-center.api";

const MANUAL_STATUS_OPTIONS: Array<{ value: FiscalCaseStatus; label: string }> =
	[
		{ value: "OPEN", label: "Abierto" },
		{ value: "IN_REVIEW", label: "En revisión" },
		{ value: "RESOLVED", label: "Resuelto" },
		{ value: "ARCHIVED", label: "Archivado" },
	];

export function CaseStatusControl({
	currentStatus,
	onSubmit,
	isPending,
	errorMessage,
}: {
	currentStatus: FiscalCaseStatus;
	onSubmit: (status: FiscalCaseStatus, reason?: string) => void;
	isPending: boolean;
	errorMessage?: string;
}) {
	const statusId = useId();
	const reasonId = useId();
	const errorId = useId();
	const [status, setStatus] = useState<FiscalCaseStatus>(
		currentStatus === "APPROVAL_PENDING" ? "IN_REVIEW" : currentStatus,
	);
	const [reason, setReason] = useState("");
	const [localError, setLocalError] = useState<string | null>(null);

	const submit = (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		if (status === currentStatus) {
			setLocalError(
				"Elegí un estado distinto para registrar una transición auditada.",
			);
			return;
		}
		onSubmit(status, reason.trim() || undefined);
	};

	return (
		<form
			onSubmit={submit}
			aria-label="Actualizar estado fiscal"
			className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-1)] p-4"
		>
			<div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
				<div>
					<p className="text-2xs font-bold uppercase tracking-[0.22em] text-[var(--color-info)]">
						Estado del caso
					</p>
					<h4 className="mt-1 text-sm font-bold">Transición manual auditada</h4>
					<p className="mt-1 text-xs text-[var(--text-tertiary)]">
						Estado actual: <strong>{currentStatus}</strong>. No ejecuta acciones
						fiscales reales.
					</p>
				</div>
				<Button size="sm" type="submit" variant="outline" disabled={isPending}>
					{isPending ? "Actualizando…" : "Actualizar estado"}
				</Button>
			</div>
			<div className="mt-4 grid gap-3 md:grid-cols-[220px_minmax(0,1fr)]">
				<label className="space-y-1 text-xs font-semibold" htmlFor={statusId}>
					Nuevo estado
					<select
						id={statusId}
						value={status}
						onChange={(event) => {
							setStatus(event.target.value as FiscalCaseStatus);
							setLocalError(null);
						}}
						disabled={isPending}
						className="w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-2)] px-3 py-2 text-sm font-normal outline-none transition focus:border-[var(--color-info)]"
					>
						{MANUAL_STATUS_OPTIONS.map((option) => (
							<option key={option.value} value={option.value}>
								{option.label}
							</option>
						))}
					</select>
				</label>
				<label className="space-y-1 text-xs font-semibold" htmlFor={reasonId}>
					Motivo opcional
					<input
						id={reasonId}
						value={reason}
						onChange={(event) => setReason(event.target.value)}
						disabled={isPending}
						placeholder="Ej. Evidencia completa para revisión"
						className="w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-2)] px-3 py-2 text-sm font-normal outline-none transition focus:border-[var(--color-info)]"
					/>
				</label>
			</div>
			{(localError || errorMessage) && (
				<p
					id={errorId}
					role="alert"
					aria-live="polite"
					className="mt-3 rounded-xl border border-[var(--color-danger)]/30 bg-[var(--color-danger)]/10 p-3 text-xs font-semibold text-[var(--color-danger)]"
				>
					{localError ?? errorMessage}
				</p>
			)}
		</form>
	);
}
