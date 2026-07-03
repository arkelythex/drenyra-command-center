import { useState } from "react";
import { X, Sparkles, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

export interface AutomationWizardData {
	name: string;
	description: string;
	triggerType: "schedule" | "event" | "manual";
	triggerConfig: Record<string, unknown>;
	skillIds: string[];
	autonomy: "suggest" | "auto-approve" | "execute";
}

interface AutomationCreateWizardProps {
	open: boolean;
	onClose: () => void;
	onCreate: (data: AutomationWizardData) => void;
	availableSkills: Array<{ id: string; name: string; category: string }>;
	isCreating?: boolean;
}

type WizardStep = "name" | "trigger" | "skills" | "autonomy" | "review";

export function AutomationCreateWizard({
	open,
	onClose,
	onCreate,
	availableSkills,
	isCreating,
}: AutomationCreateWizardProps) {
	const [step, setStep] = useState<WizardStep>("name");
	const [data, setData] = useState<AutomationWizardData>({
		name: "",
		description: "",
		triggerType: "manual",
		triggerConfig: {},
		skillIds: [],
		autonomy: "suggest",
	});

	if (!open) return null;

	const canNext = (): boolean => {
		switch (step) {
			case "name":
				return data.name.trim().length > 0;
			case "trigger":
				return true;
			case "skills":
				return data.skillIds.length > 0;
			case "autonomy":
				return true;
			default:
				return true;
		}
	};

	const next = () => {
		const order: WizardStep[] = ["name", "trigger", "skills", "autonomy", "review"];
		const idx = order.indexOf(step);
		if (idx < order.length - 1) setStep(order[idx + 1]);
	};

	const back = () => {
		const order: WizardStep[] = ["name", "trigger", "skills", "autonomy", "review"];
		const idx = order.indexOf(step);
		if (idx > 0) setStep(order[idx - 1]);
	};

	const toggleSkill = (id: string) => {
		setData((prev) => ({
			...prev,
			skillIds: prev.skillIds.includes(id)
				? prev.skillIds.filter((s) => s !== id)
				: [...prev.skillIds, id],
		}));
	};

	const handleCreate = () => {
		onCreate(data);
	};

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
			<div className="w-full max-w-lg rounded-2xl border border-[var(--border-default)] bg-[var(--surface-1)] shadow-2xl">
				{/* Header */}
				<div className="flex items-center justify-between border-b border-[var(--border-subtle)] px-6 py-4">
					<div className="flex items-center gap-2">
						<Sparkles size={18} className="text-[var(--color-primary)]" />
						<h2 className="text-base font-bold text-[var(--text-primary)]">
							Nueva Automatización
						</h2>
					</div>
					<button
						type="button"
						onClick={onClose}
						className="rounded-lg p-1.5 text-[var(--text-muted)] hover:bg-[var(--surface-2)]"
					>
						<X size={16} />
					</button>
				</div>

				{/* Steps indicator */}
				<div className="flex items-center gap-1 border-b border-[var(--border-subtle)] px-6 py-3">
					{(["name", "trigger", "skills", "autonomy", "review"] as const).map(
						(s, i) => (
							<div key={s} className="flex items-center gap-1">
								<span
									className={cn(
										"flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold",
										step === s
											? "bg-[var(--color-primary)] text-white"
											: ["name", "trigger", "skills", "autonomy"].indexOf(step) >
													i
												? "bg-[var(--color-success)]/20 text-[var(--color-success)]"
												: "bg-[var(--surface-2)] text-[var(--text-muted)]",
									)}
								>
									{i + 1}
								</span>
								{i < 4 && (
									<ArrowRight size={10} className="text-[var(--text-muted)]" />
								)}
							</div>
						),
					)}
				</div>

				{/* Content */}
				<div className="px-6 py-6 space-y-4">
					{step === "name" && (
						<div className="space-y-4">
							<div>
								<label htmlFor="wiz-name" className="block text-sm font-medium text-[var(--text-primary)] mb-1">
									Nombre
								</label>
								<input
									id="wiz-name"
									type="text"
									value={data.name}
									onChange={(e) =>
										setData((d) => ({ ...d, name: e.target.value }))
									}
									placeholder="Ej: Cierre mensual asistido"
									className="w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-2)] px-4 py-2.5 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--border-default)]"
								/>
							</div>
							<div>
								<label htmlFor="wiz-desc" className="block text-sm font-medium text-[var(--text-primary)] mb-1">
									Descripción
								</label>
								<textarea
									id="wiz-desc"
									value={data.description}
									onChange={(e) =>
										setData((d) => ({ ...d, description: e.target.value }))
									}
									placeholder="¿Qué hace esta automatización?"
									rows={3}
									className="w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-2)] px-4 py-2.5 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--border-default)] resize-none"
								/>
							</div>
						</div>
					)}

					{step === "trigger" && (
						<fieldset className="space-y-3">
							<legend className="block text-sm font-medium text-[var(--text-primary)] mb-1">
								¿Cuándo se ejecuta?
							</legend>
							{([
								{ value: "manual", label: "Manual", desc: "Solo cuando vos lo iniciás" },
								{
									value: "schedule",
									label: "Programado",
									desc: "En un horario fijo (cada día, semana, mes)",
								},
								{
									value: "event",
									label: "Por evento",
									desc: "Cuando ocurre algo (nuevo CPE, diff, etc.)",
								},
							] as const).map((opt) => (
								<button
									key={opt.value}
									type="button"
									onClick={() =>
										setData((d) => ({ ...d, triggerType: opt.value }))
									}
									className={cn(
										"w-full rounded-xl border p-4 text-left transition-all",
										data.triggerType === opt.value
											? "border-[var(--color-primary)] bg-[var(--color-primary)]/5"
											: "border-[var(--border-subtle)] hover:border-[var(--border-default)]",
									)}
								>
									<span className="text-sm font-bold text-[var(--text-primary)]">
										{opt.label}
									</span>
									<p className="text-xs text-[var(--text-secondary)] mt-0.5">
										{opt.desc}
									</p>
								</button>
							))}
						</fieldset>
					)}

					{step === "skills" && (
						<fieldset className="space-y-3">
							<legend className="block text-sm font-medium text-[var(--text-primary)] mb-1">
								Skills a ejecutar
							</legend>
							{availableSkills.length === 0 ? (
								<p className="text-sm text-[var(--text-muted)]">
									No hay skills disponibles. Instalá skills primero.
								</p>
							) : (
								<div className="max-h-48 space-y-2 overflow-y-auto">
									{availableSkills.map((skill) => (
										<button
											key={skill.id}
											type="button"
											onClick={() => toggleSkill(skill.id)}
											className={cn(
												"flex w-full items-center justify-between rounded-xl border p-3 text-left transition-all",
												data.skillIds.includes(skill.id)
													? "border-[var(--color-primary)] bg-[var(--color-primary)]/5"
													: "border-[var(--border-subtle)] hover:border-[var(--border-default)]",
											)}
										>
											<div>
												<span className="text-sm font-medium text-[var(--text-primary)]">
													{skill.name}
												</span>
												<p className="text-xs text-[var(--text-muted)]">
													{skill.category}
												</p>
											</div>
											{data.skillIds.includes(skill.id) && (
												<span className="text-xs font-bold text-[var(--color-primary)]">
													Seleccionado
												</span>
											)}
										</button>
									))}
								</div>
							)}
						</fieldset>
					)}

					{step === "autonomy" && (
						<fieldset className="space-y-3">
							<legend className="block text-sm font-medium text-[var(--text-primary)] mb-1">
								¿Qué nivel de autonomía tiene?
							</legend>
							{([
								{
									value: "suggest",
									label: "Sugerir",
									desc: "Propone cambios y espera tu aprobación",
								},
								{
									value: "auto-approve",
									label: "Auto-aprobar",
									desc: "Ejecuta y aprueba cambios de bajo riesgo",
								},
								{
									value: "execute",
									label: "Ejecutar",
									desc: "Ejecuta todo automáticamente, deja registro",
								},
							] as const).map((opt) => (
								<button
									key={opt.value}
									type="button"
									onClick={() =>
										setData((d) => ({ ...d, autonomy: opt.value }))
									}
									className={cn(
										"w-full rounded-xl border p-4 text-left transition-all",
										data.autonomy === opt.value
											? "border-[var(--color-primary)] bg-[var(--color-primary)]/5"
											: "border-[var(--border-subtle)] hover:border-[var(--border-default)]",
									)}
								>
									<span className="text-sm font-bold text-[var(--text-primary)]">
										{opt.label}
									</span>
									<p className="text-xs text-[var(--text-secondary)] mt-0.5">
										{opt.desc}
									</p>
								</button>
							))}
						</fieldset>
					)}

					{step === "review" && (
						<div className="space-y-3">
							<p className="text-sm font-medium text-[var(--text-primary)]">
								Resumen
							</p>
							<div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-2)] p-4 space-y-2">
								<div className="flex justify-between text-sm">
									<span className="text-[var(--text-muted)]">Nombre</span>
									<span className="font-medium text-[var(--text-primary)]">
										{data.name}
									</span>
								</div>
								<div className="flex justify-between text-sm">
									<span className="text-[var(--text-muted)]">Trigger</span>
									<span className="font-medium text-[var(--text-primary)]">
										{data.triggerType}
									</span>
								</div>
								<div className="flex justify-between text-sm">
									<span className="text-[var(--text-muted)]">Skills</span>
									<span className="font-medium text-[var(--text-primary)]">
										{data.skillIds.length}
									</span>
								</div>
								<div className="flex justify-between text-sm">
									<span className="text-[var(--text-muted)]">Autonomía</span>
									<span className="font-medium text-[var(--text-primary)]">
										{data.autonomy}
									</span>
								</div>
							</div>
						</div>
					)}
				</div>

				{/* Footer */}
				<div className="flex items-center justify-between border-t border-[var(--border-subtle)] px-6 py-4">
					<button
						type="button"
						onClick={step === "name" ? onClose : back}
						className="rounded-lg px-4 py-2 text-sm font-medium text-[var(--text-secondary)] hover:bg-[var(--surface-2)]"
					>
						{step === "name" ? "Cancelar" : "Atrás"}
					</button>

					{step === "review" ? (
						<button
							type="button"
							onClick={handleCreate}
							disabled={isCreating}
							className="rounded-xl bg-[var(--color-primary)] px-6 py-2.5 text-sm font-bold text-white hover:opacity-90 disabled:opacity-50"
						>
							{isCreating ? "Creando..." : "Crear automatización"}
						</button>
					) : (
						<button
							type="button"
							onClick={next}
							disabled={!canNext()}
							className="rounded-xl bg-[var(--color-primary)] px-6 py-2.5 text-sm font-bold text-white hover:opacity-90 disabled:opacity-50"
						>
							Siguiente
						</button>
					)}
				</div>
			</div>
		</div>
	);
}
