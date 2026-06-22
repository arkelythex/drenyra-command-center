import { useId, useState, type FormEvent } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import type {
	AutonomyLevel,
	CreateFiscalCaseRequest,
	FiscalCaseType,
	FiscalRiskLevel,
} from "../api/drenyra-command-center.api";

const CASE_TYPE_OPTIONS: Array<{ value: FiscalCaseType; label: string; description: string }> = [
	{ value: "MONTHLY_CLOSE", label: "Cierre mensual", description: "Cierre mensual con evidencia y aprobaciones." },
	{ value: "CPE_REVIEW", label: "Revisión CPE", description: "Revisión de comprobantes, CDR y UBL." },
	{ value: "SIRE_REVIEW", label: "Revisión SIRE", description: "Validación de propuesta SIRE y periodo tributario." },
	{ value: "LEDGER_REVIEW", label: "Revisión contable", description: "Revisión de libro mayor y asientos contables." },
	{ value: "CONCILIATION", label: "Conciliación", description: "Cruce contable-bancario sin ejecución automática." },
	{ value: "EVIDENCE_REVIEW", label: "Revisión de evidencia", description: "Completar sustento fiscal antes de decidir." },
];

const RISK_OPTIONS: Array<{ value: FiscalRiskLevel; label: string }> = [
	{ value: "LOW", label: "Bajo" },
	{ value: "MEDIUM", label: "Medio" },
	{ value: "HIGH", label: "Alto" },
	{ value: "CRITICAL", label: "Crítico" },
];

const AUTONOMY_OPTIONS: Array<{ value: AutonomyLevel; label: string }> = [
	{ value: "ADVISORY", label: "Solo asesoría" },
	{ value: "DRAFT_ONLY", label: "Solo borrador" },
	{ value: "PREPARE_WITH_APPROVAL", label: "Preparar con aprobación" },
];

interface FiscalCaseCreationFormProps {
	onSubmit: (request: CreateFiscalCaseRequest) => void;
	isPending: boolean;
	errorMessage?: string;
}

interface FormState {
	type: FiscalCaseType;
	title: string;
	description: string;
	riskLevel: FiscalRiskLevel;
	riskScore: string;
	autonomyLevel: AutonomyLevel;
}

const initialFormState: FormState = {
	type: "MONTHLY_CLOSE",
	title: "",
	description: "",
	riskLevel: "MEDIUM",
	riskScore: "48",
	autonomyLevel: "PREPARE_WITH_APPROVAL",
};

function validateForm(state: FormState): string | null {
	const riskScore = Number(state.riskScore);
	if (state.title.trim().length < 3) return "El título debe tener al menos 3 caracteres.";
	if (state.description.trim().length < 10) return "La descripción debe explicar el objetivo fiscal del caso.";
	if (!Number.isInteger(riskScore) || riskScore < 0 || riskScore > 100) return "El score de riesgo debe ser un entero entre 0 y 100.";
	return null;
}

export function FiscalCaseCreationForm({ onSubmit, isPending, errorMessage }: FiscalCaseCreationFormProps) {
	const titleId = useId();
	const descriptionId = useId();
	const errorId = useId();
	const [state, setState] = useState<FormState>(initialFormState);
	const [localError, setLocalError] = useState<string | null>(null);
	const selectedType = CASE_TYPE_OPTIONS.find((option) => option.value === state.type);

	const update = <Key extends keyof FormState>(key: Key, value: FormState[Key]) => {
		setState((current) => ({ ...current, [key]: value }));
		setLocalError(null);
	};

	const submit = (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		const validationError = validateForm(state);
		if (validationError) {
			setLocalError(validationError);
			return;
		}

		onSubmit({
			type: state.type,
			title: state.title.trim(),
			description: state.description.trim(),
			riskLevel: state.riskLevel,
			riskScore: Number(state.riskScore),
			autonomyLevel: state.autonomyLevel,
		});
	};

	return (
		<form onSubmit={submit} className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-2)]/70 p-4 shadow-2xl shadow-black/10" aria-label="Create fiscal case">
			<div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
				<div>
					<p className="text-2xs font-bold uppercase tracking-[0.22em] text-[var(--color-info)]">Nuevo caso fiscal</p>
					<h3 className="mt-1 text-base font-bold">Abrí un workspace con evidencia y aprobación</h3>
					<p className="mt-1 text-xs text-[var(--text-tertiary)]">El caso no ejecuta acciones fiscales reales; prepara trazabilidad para revisión humana.</p>
				</div>
				<Button size="sm" type="submit" disabled={isPending}>
					<Plus size={14} className="mr-1" />{isPending ? "Creando…" : "Crear caso"}
				</Button>
			</div>

			<div className="mt-4 grid gap-3 xl:grid-cols-[1.1fr_1fr]">
				<label className="space-y-1 text-xs font-semibold" htmlFor={titleId}>
					Título
					<input id={titleId} value={state.title} onChange={(event) => update("title", event.target.value)} aria-describedby={localError ? errorId : undefined} placeholder="Ej. Cierre fiscal junio 2026" className="w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-1)] px-3 py-2 text-sm font-normal outline-none transition focus:border-[var(--color-info)]" />
				</label>
				<label className="space-y-1 text-xs font-semibold">
					Tipo fiscal
					<select value={state.type} onChange={(event) => update("type", event.target.value as FiscalCaseType)} className="w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-1)] px-3 py-2 text-sm font-normal outline-none transition focus:border-[var(--color-info)]">
						{CASE_TYPE_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
					</select>
				</label>
				<label className="space-y-1 text-xs font-semibold xl:col-span-2" htmlFor={descriptionId}>
					Descripción fiscal
					<textarea id={descriptionId} value={state.description} onChange={(event) => update("description", event.target.value)} placeholder="Qué se revisa, qué fuente fiscal se usará y por qué requiere trazabilidad." rows={3} className="w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-1)] px-3 py-2 text-sm font-normal outline-none transition focus:border-[var(--color-info)]" />
				</label>
			</div>

			<div className="mt-3 grid gap-3 md:grid-cols-3">
				<label className="space-y-1 text-xs font-semibold">
					Riesgo
					<select value={state.riskLevel} onChange={(event) => update("riskLevel", event.target.value as FiscalRiskLevel)} className="w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-1)] px-3 py-2 text-sm font-normal outline-none transition focus:border-[var(--color-info)]">
						{RISK_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
					</select>
				</label>
				<label className="space-y-1 text-xs font-semibold">
					Score
					<input value={state.riskScore} onChange={(event) => update("riskScore", event.target.value)} inputMode="numeric" className="w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-1)] px-3 py-2 text-sm font-normal outline-none transition focus:border-[var(--color-info)]" />
				</label>
				<label className="space-y-1 text-xs font-semibold">
					Autonomía
					<select value={state.autonomyLevel} onChange={(event) => update("autonomyLevel", event.target.value as AutonomyLevel)} className="w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-1)] px-3 py-2 text-sm font-normal outline-none transition focus:border-[var(--color-info)]">
						{AUTONOMY_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
					</select>
				</label>
			</div>

			<div className="mt-3 rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-1)] p-3 text-xs text-[var(--text-secondary)]">
				<strong className="text-[var(--text-primary)]">{selectedType?.label}:</strong> {selectedType?.description}
			</div>
			{(localError || errorMessage) && <p id={errorId} role="alert" aria-live="polite" className="mt-3 rounded-xl border border-[var(--color-danger)]/30 bg-[var(--color-danger)]/10 p-3 text-xs font-semibold text-[var(--color-danger)]">{localError ?? errorMessage}</p>}
		</form>
	);
}
