import { FileText } from "lucide-react";
import { type FormEvent, useId, useState } from "react";
import { Button } from "@/components/ui/button";
import type {
	AddEvidenceRequest,
	EvidenceType,
} from "../api/drenyra-command-center.api";

const EVIDENCE_TYPE_OPTIONS: Array<{
	value: EvidenceType;
	label: string;
	description: string;
}> = [
	{
		value: "DOCUMENT",
		label: "Documento",
		description: "Archivo o documento de soporte referenciado manualmente.",
	},
	{
		value: "SUNAT_RECORD",
		label: "Registro SUNAT",
		description:
			"Referencia a registro SUNAT/SIRE sin consumir servicios reales.",
	},
	{
		value: "LEDGER_ENTRY",
		label: "Asiento contable",
		description: "Referencia a asiento o lote contable del periodo.",
	},
	{
		value: "BANK_STATEMENT",
		label: "Extracto bancario",
		description: "Sustento bancario para conciliación fiscal.",
	},
	{
		value: "USER_NOTE",
		label: "Nota interna",
		description: "Nota de revisión humana para trazabilidad.",
	},
	{
		value: "AGENT_OUTPUT",
		label: "Salida de agente",
		description: "Resultado determinístico de un agente mock.",
	},
];

interface EvidenceAttachmentFormProps {
	onSubmit: (request: AddEvidenceRequest) => void;
	isPending: boolean;
	isDisabled: boolean;
	errorMessage?: string;
}

interface FormState {
	type: EvidenceType;
	title: string;
	summary: string;
	source: string;
	sourceRef: string;
}

const initialFormState: FormState = {
	type: "USER_NOTE",
	title: "",
	summary: "",
	source: "Drenyra Command Center",
	sourceRef: "",
};

function validateForm(state: FormState): string | null {
	if (state.title.trim().length < 3)
		return "El título de evidencia debe tener al menos 3 caracteres.";
	if (state.summary.trim().length < 10)
		return "El resumen debe explicar qué sustenta la evidencia.";
	if (state.source.trim().length < 3)
		return "La fuente debe identificar el origen de la evidencia.";
	return null;
}

export function EvidenceAttachmentForm({
	onSubmit,
	isPending,
	isDisabled,
	errorMessage,
}: EvidenceAttachmentFormProps) {
	const titleId = useId();
	const summaryId = useId();
	const sourceId = useId();
	const sourceRefId = useId();
	const errorId = useId();
	const [state, setState] = useState<FormState>(initialFormState);
	const [localError, setLocalError] = useState<string | null>(null);
	const selectedType = EVIDENCE_TYPE_OPTIONS.find(
		(option) => option.value === state.type,
	);

	const update = <Key extends keyof FormState>(
		key: Key,
		value: FormState[Key],
	) => {
		setState((current) => ({ ...current, [key]: value }));
		setLocalError(null);
	};

	const submit = (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		if (isDisabled) {
			setLocalError("Seleccioná un caso fiscal antes de adjuntar evidencia.");
			return;
		}

		const validationError = validateForm(state);
		if (validationError) {
			setLocalError(validationError);
			return;
		}

		onSubmit({
			type: state.type,
			title: state.title.trim(),
			summary: state.summary.trim(),
			source: state.source.trim(),
			...(state.sourceRef.trim() ? { sourceRef: state.sourceRef.trim() } : {}),
		});
	};

	return (
		<form
			onSubmit={submit}
			className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-1)] p-4"
			aria-label="Adjuntar evidencia fiscal"
		>
			<div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
				<div>
					<p className="text-2xs font-bold uppercase tracking-[0.22em] text-[var(--color-info)]">
						Evidencia fiscal
					</p>
					<h4 className="mt-1 flex items-center gap-2 text-sm font-bold">
						<FileText size={16} />
						Adjuntar sustento al caso
					</h4>
					<p className="mt-1 text-xs text-[var(--text-tertiary)]">
						Registrá referencias y notas auditables; no se cargan archivos ni se
						consulta SUNAT en esta fase.
					</p>
				</div>
				<Button
					size="sm"
					type="submit"
					variant="outline"
					disabled={isPending || isDisabled}
				>
					{isPending ? "Adjuntando…" : "Adjuntar evidencia"}
				</Button>
			</div>

			<div className="mt-4 grid gap-3 md:grid-cols-2">
				<label className="space-y-1 text-xs font-semibold">
					Tipo
					<select
						value={state.type}
						onChange={(event) =>
							update("type", event.target.value as EvidenceType)
						}
						disabled={isDisabled || isPending}
						className="w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-2)] px-3 py-2 text-sm font-normal outline-none transition focus:border-[var(--color-info)]"
					>
						{EVIDENCE_TYPE_OPTIONS.map((option) => (
							<option key={option.value} value={option.value}>
								{option.label}
							</option>
						))}
					</select>
				</label>
				<label className="space-y-1 text-xs font-semibold" htmlFor={titleId}>
					Título
					<input
						id={titleId}
						value={state.title}
						onChange={(event) => update("title", event.target.value)}
						disabled={isDisabled || isPending}
						aria-describedby={localError ? errorId : undefined}
						placeholder="Ej. Sustento SIRE ventas"
						className="w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-2)] px-3 py-2 text-sm font-normal outline-none transition focus:border-[var(--color-info)]"
					/>
				</label>
				<label className="space-y-1 text-xs font-semibold" htmlFor={sourceId}>
					Fuente
					<input
						id={sourceId}
						value={state.source}
						onChange={(event) => update("source", event.target.value)}
						disabled={isDisabled || isPending}
						placeholder="Ej. SIRE, ERP, banco"
						className="w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-2)] px-3 py-2 text-sm font-normal outline-none transition focus:border-[var(--color-info)]"
					/>
				</label>
				<label
					className="space-y-1 text-xs font-semibold"
					htmlFor={sourceRefId}
				>
					Referencia opcional
					<input
						id={sourceRefId}
						value={state.sourceRef}
						onChange={(event) => update("sourceRef", event.target.value)}
						disabled={isDisabled || isPending}
						placeholder="Ej. SIRE-2026-05-ventas"
						className="w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-2)] px-3 py-2 text-sm font-normal outline-none transition focus:border-[var(--color-info)]"
					/>
				</label>
				<label
					className="space-y-1 text-xs font-semibold md:col-span-2"
					htmlFor={summaryId}
				>
					Resumen
					<textarea
						id={summaryId}
						value={state.summary}
						onChange={(event) => update("summary", event.target.value)}
						disabled={isDisabled || isPending}
						rows={3}
						placeholder="Qué demuestra esta evidencia y qué decisión fiscal soporta."
						className="w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-2)] px-3 py-2 text-sm font-normal outline-none transition focus:border-[var(--color-info)]"
					/>
				</label>
			</div>

			<div className="mt-3 rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-2)] p-3 text-xs text-[var(--text-secondary)]">
				<strong className="text-[var(--text-primary)]">
					{selectedType?.label}:
				</strong>{" "}
				{selectedType?.description}
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
