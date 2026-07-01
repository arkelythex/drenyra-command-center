import { X } from "lucide-react";
import { useCallback, useEffect, useId } from "react";
import { cn } from "@/lib/utils";

const STORAGE_KEY = "drenyra:agent-config";

export interface AgentConfig {
	modelTier: "fast" | "balanced" | "reasoning";
	temperature: number;
	autoApproveLowRisk: boolean;
	systemInstructions: string;
}

export const DEFAULT_AGENT_CONFIG: AgentConfig = {
	modelTier: "fast",
	temperature: 0.3,
	autoApproveLowRisk: false,
	systemInstructions:
		"Eres un asistente fiscal especializado en normativa SUNAT Perú.",
};

const MODEL_OPTIONS = [
	{
		value: "fast",
		label: "DeepSeek V4 Flash",
		description: "Rápido — tareas simples y rápidas",
	},
	{
		value: "balanced",
		label: "Sonnet 4.6",
		description: "Balanceado — análisis general",
	},
	{
		value: "reasoning",
		label: "Opus 4.6",
		description: "Razonamiento profundo — fiscal complejo",
	},
] as const;

export interface AgentConfigPanelProps {
	isOpen: boolean;
	onClose: () => void;
	config: AgentConfig;
	onConfigChange: (patch: Partial<AgentConfig>) => void;
}

function Toggle({
	value,
	onChange,
}: {
	value: boolean;
	onChange: (v: boolean) => void;
}) {
	return (
		<button
			type="button"
			role="switch"
			aria-checked={value}
			onClick={() => onChange(!value)}
			className={cn(
				"relative inline-flex h-5 w-9 items-center rounded-full transition-colors",
				value ? "bg-[var(--color-info)]" : "bg-[var(--surface-3)]",
			)}
		>
			<span
				className={cn(
					"inline-block h-3.5 w-3.5 rounded-full bg-white transition-transform",
					value ? "translate-x-[18px]" : "translate-x-[3px]",
				)}
			/>
		</button>
	);
}

function Select({
	value,
	options,
	onChange,
}: {
	value: string;
	options: readonly {
		readonly value: string;
		readonly label: string;
		readonly description?: string;
	}[];
	onChange: (v: string) => void;
}) {
	const uid = useId();
	return (
		<div>
			<select
				id={uid}
				aria-label="Seleccionar modelo"
				value={value}
				onChange={(e) => onChange(e.target.value)}
				className="w-full rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-2)] px-3 py-2 text-xs text-[var(--text-primary)] outline-none transition-colors focus:border-[var(--color-info)]/50"
			>
				{options.map((opt) => (
					<option key={opt.value} value={opt.value}>
						{opt.label}
					</option>
				))}
			</select>
			{options.find((o) => o.value === value)?.description && (
				<p className="mt-1 text-2xs text-[var(--text-tertiary)]">
					{options.find((o) => o.value === value)?.description}
				</p>
			)}
		</div>
	);
}

export function AgentConfigPanel({
	isOpen,
	onClose,
	config,
	onConfigChange,
}: AgentConfigPanelProps) {
	useEffect(() => {
		if (!isOpen) return;
		const saved = localStorage.getItem(STORAGE_KEY);
		if (saved) {
			try {
				const parsed = JSON.parse(saved) as Partial<AgentConfig>;
				onConfigChange(parsed);
			} catch {
				// ignore invalid stored data
			}
		}
	}, [isOpen]);

	useEffect(() => {
		localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
	}, [config]);

	const update = useCallback(
		(patch: Partial<AgentConfig>) => onConfigChange(patch),
		[onConfigChange],
	);

	const temperaturePercent = Math.round(config.temperature * 100);

	return (
		<aside
			className={cn(
				"absolute right-0 top-0 z-40 h-full w-80 border-l border-[var(--border-subtle)] bg-[var(--surface-1)]/98  transition-all duration-300 ease-in-out",
				isOpen
					? "translate-x-0 opacity-100"
					: "translate-x-full opacity-0 pointer-events-none",
			)}
			aria-hidden={!isOpen}
		>
			<div className="flex h-full flex-col">
				{/* ── Header ── */}
				<div className="flex items-center justify-between border-b border-[var(--border-subtle)] px-5 py-4">
					<h2 className="text-sm font-bold text-[var(--text-primary)]">
						Configuración del Agente
					</h2>
					<button
						type="button"
						onClick={onClose}
						className="rounded-lg p-1.5 text-[var(--text-tertiary)] transition-colors hover:bg-[var(--surface-2)] hover:text-[var(--text-primary)]"
						aria-label="Cerrar configuración del agente"
					>
						<X size={16} />
					</button>
				</div>

				{/* ── Scrollable content ── */}
				<div className="flex-1 overflow-y-auto px-5 py-5">
					<div className="space-y-7">
						{/* ── Modelo ── */}
						<section>
							<h3 className="mb-3 text-2xs font-bold uppercase tracking-widest text-[var(--text-tertiary)]">
								Modelo
							</h3>
							<div className="space-y-4">
								<div>
									<label
										htmlFor="agent-model-select"
										className="mb-1.5 block text-xs font-medium text-[var(--text-secondary)]"
									>
										Tier del modelo
									</label>
									<Select
										value={config.modelTier}
										options={MODEL_OPTIONS}
										onChange={(v) =>
											update({
												modelTier: v as AgentConfig["modelTier"],
											})
										}
									/>
								</div>
							</div>
						</section>

						{/* ── Parámetros ── */}
						<section>
							<h3 className="mb-3 text-2xs font-bold uppercase tracking-widest text-[var(--text-tertiary)]">
								Parámetros
							</h3>
							<div className="space-y-5">
								{/* Temperature slider */}
								<div>
									<div className="mb-2 flex items-center justify-between">
										<span className="text-xs font-medium text-[var(--text-secondary)]">
											Temperatura
										</span>
										<span className="font-mono text-xs font-semibold tabular-nums text-[var(--text-primary)]">
											{temperaturePercent}%
										</span>
									</div>
									<input
										type="range"
										min="0"
										max="10"
										step="1"
										value={Math.round(config.temperature * 10)}
										onChange={(e) =>
											update({
												temperature: Number(e.target.value) / 10,
											})
										}
										className="w-full h-1.5 rounded-full appearance-none cursor-pointer bg-[var(--surface-3)] accent-[var(--color-info)] [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[var(--color-info)] [&::-webkit-slider-thumb]:shadow-sm [&::-webkit-slider-thumb]:transition-transform [&::-webkit-slider-thumb]:hover:scale-110"
										aria-label="Temperatura del modelo"
										aria-valuenow={temperaturePercent}
										aria-valuemin={0}
										aria-valuemax={100}
									/>
									<div className="mt-1 flex justify-between text-2xs text-[var(--text-tertiary)]">
										<span>Preciso</span>
										<span>Creativo</span>
									</div>
								</div>

								{/* Auto-approve toggle */}
								<div className="flex items-start justify-between gap-3">
									<div className="flex-1">
										<span className="text-xs font-medium text-[var(--text-secondary)]">
											Auto-aprobar riesgo bajo
										</span>
										<p className="text-2xs text-[var(--text-tertiary)] leading-relaxed">
											Permite automáticamente herramientas con riesgo LOW sin
											intervención humana
										</p>
									</div>
									<Toggle
										value={config.autoApproveLowRisk}
										onChange={(v) => update({ autoApproveLowRisk: v })}
									/>
								</div>
							</div>
						</section>

						{/* ── Instrucciones del sistema ── */}
						<section>
							<h3 className="mb-3 text-2xs font-bold uppercase tracking-widest text-[var(--text-tertiary)]">
								Instrucciones del Sistema
							</h3>
							<div>
								<label
									htmlFor="agent-system-instructions"
									className="mb-1.5 block text-xs font-medium text-[var(--text-secondary)]"
								>
									Prompt del sistema
								</label>
								<textarea
									id="agent-system-instructions"
									rows={4}
									value={config.systemInstructions}
									onChange={(e) =>
										update({ systemInstructions: e.target.value })
									}
									placeholder="Eres un asistente fiscal especializado en normativa SUNAT Perú."
									className="w-full resize-none rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-2)] px-3 py-2 text-xs text-[var(--text-primary)] placeholder-[var(--text-tertiary)] outline-none transition-colors focus:border-[var(--color-info)]/50"
								/>
								<p className="mt-1 text-2xs text-[var(--text-tertiary)]">
									Instrucciones base que guían el comportamiento del agente
								</p>
							</div>
						</section>
					</div>
				</div>
			</div>
		</aside>
	);
}
