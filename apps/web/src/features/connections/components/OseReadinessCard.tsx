import { AlertTriangle, CheckCircle2, Settings2, Wrench } from "lucide-react";
import type { OseReadinessPayload } from "../hooks/useOseReadiness";

interface OseReadinessCardProps {
	readiness?: OseReadinessPayload;
	isLoading: boolean;
	isError: boolean;
}

export const OseReadinessCard = ({
	readiness,
	isLoading,
	isError,
}: OseReadinessCardProps) => {
	const state = buildOseReadinessState(readiness, isLoading, isError);
	const Icon = state.icon;

	return (
		<div className={state.cardClassName}>
			<div className="flex flex-col gap-4 p-5">
				<div className="flex items-start justify-between gap-4">
					<div className="space-y-1">
						<p className="text-3xs font-bold uppercase tracking-widest text-[var(--color-text-muted)]">
							OSE Readiness
						</p>
						<h3 className="text-sm font-bold text-[var(--color-text-primary)]">
							{state.title}
						</h3>
						<p className="text-xs text-[var(--color-text-muted)] leading-relaxed">
							{state.description}
						</p>
					</div>
					<span className={state.badgeClassName}>
						<Icon size={12} />
						{state.badgeLabel}
					</span>
				</div>

				<div className="grid gap-3 text-xs sm:grid-cols-3">
					<div>
						<p className="text-3xs font-bold uppercase tracking-widest text-[var(--color-text-muted)]">
							Proveedor
						</p>
						<p className="text-xs font-bold text-[var(--color-text-primary)]">
							{state.providerLabel}
						</p>
					</div>
					<div>
						<p className="text-3xs font-bold uppercase tracking-widest text-[var(--color-text-muted)]">
							Entorno
						</p>
						<p className="text-xs font-bold text-[var(--color-text-primary)]">
							{state.environmentLabel}
						</p>
					</div>
					<div>
						<p className="text-3xs font-bold uppercase tracking-widest text-[var(--color-text-muted)]">
							Diagnóstico
						</p>
						<p className="text-xs font-bold text-[var(--color-text-primary)]">
							{state.diagnosticLabel}
						</p>
					</div>
				</div>
			</div>
		</div>
	);
};

function buildOseReadinessState(
	readiness: OseReadinessPayload | undefined,
	isLoading: boolean,
	isError: boolean,
) {
	if (isLoading) {
		return {
			title: "Validando proveedor OSE",
			description:
				"Comprobando configuración, credenciales y disponibilidad del proveedor.",
			badgeLabel: "Sincronizando",
			providerLabel: "Cargando",
			environmentLabel: "Pendiente",
			diagnosticLabel: "En verificación",
			cardClassName:
				"rounded-2xl border border-[var(--color-stroke-1)] bg-[var(--color-surface-1)]",
			badgeClassName:
				"inline-flex items-center gap-1.5 rounded-full border border-[var(--color-stroke-2)] bg-[var(--color-surface-3)] px-3 py-1 text-2xs font-bold text-[var(--color-text-secondary)]",
			icon: Settings2,
		};
	}

	if (isError || !readiness) {
		return {
			title: "No se pudo verificar el proveedor OSE",
			description:
				"El diagnóstico operativo no está disponible. Revisa la API o intenta nuevamente en unos minutos.",
			badgeLabel: "Sin datos",
			providerLabel: "No disponible",
			environmentLabel: "No disponible",
			diagnosticLabel: "Sin respuesta",
			cardClassName:
				"rounded-2xl border border-[var(--color-warning)]/22 bg-[var(--color-warning)]/4",
			badgeClassName:
				"inline-flex items-center gap-1.5 rounded-full border border-[var(--color-warning)]/20 bg-[var(--color-warning)]/7 px-3 py-1 text-2xs font-bold text-[var(--color-warning)]",
			icon: AlertTriangle,
		};
	}

	if (readiness.status === "ready") {
		return {
			title: "Proveedor OSE listo para producción",
			description:
				"El proveedor respondió correctamente y la configuración mínima está completa para emisión automatizada.",
			badgeLabel: "Operativo",
			providerLabel: readability(readiness.provider),
			environmentLabel: readability(readiness.environment),
			diagnosticLabel: readiness.message,
			cardClassName:
				"rounded-2xl border border-[var(--color-success)]/22 bg-[var(--color-success)]/4",
			badgeClassName:
				"inline-flex items-center gap-1.5 rounded-full border border-[var(--color-success)]/20 bg-[var(--color-success)]/7 px-3 py-1 text-2xs font-bold text-[var(--color-success)]",
			icon: CheckCircle2,
		};
	}

	if (readiness.status === "simulation") {
		return {
			title: "Proveedor OSE en modo simulación",
			description:
				"El flujo automatizado funciona para demo y pruebas, pero no está enviando comprobantes al proveedor real.",
			badgeLabel: "Demo",
			providerLabel: "Simulation",
			environmentLabel: readability(readiness.environment),
			diagnosticLabel: readiness.message,
			cardClassName:
				"rounded-2xl border border-[var(--color-info)]/20 bg-[var(--color-info)]/4",
			badgeClassName:
				"inline-flex items-center gap-1.5 rounded-full border border-[var(--color-info)]/18 bg-[var(--color-info)]/6 px-3 py-1 text-2xs font-bold text-[var(--color-info)]",
			icon: Wrench,
		};
	}

	if (readiness.status === "config_invalid") {
		const missingSummary =
			readiness.configuration.missing.length > 0
				? `Faltan: ${readiness.configuration.missing.join(", ")}.`
				: "Revisa la configuración requerida.";

		return {
			title: "Proveedor OSE configurado de forma incompleta",
			description: missingSummary,
			badgeLabel: "Configurar",
			providerLabel: readability(readiness.provider),
			environmentLabel: readability(readiness.environment),
			diagnosticLabel: "Credenciales incompletas",
			cardClassName:
				"rounded-2xl border border-[var(--color-warning)]/22 bg-[var(--color-warning)]/4",
			badgeClassName:
				"inline-flex items-center gap-1.5 rounded-full border border-[var(--color-warning)]/20 bg-[var(--color-warning)]/7 px-3 py-1 text-2xs font-bold text-[var(--color-warning)]",
			icon: Settings2,
		};
	}

	return {
		title: "Proveedor OSE no disponible",
		description:
			"Las credenciales son válidas, pero el proveedor no respondió correctamente. Conviene reintentar antes de emitir.",
		badgeLabel: "Degradado",
		providerLabel: readability(readiness.provider),
		environmentLabel: readability(readiness.environment),
		diagnosticLabel: readiness.message,
		cardClassName:
			"rounded-2xl border border-[var(--color-warning)]/22 bg-[var(--color-warning)]/4",
		badgeClassName:
			"inline-flex items-center gap-1.5 rounded-full border border-[var(--color-warning)]/20 bg-[var(--color-warning)]/7 px-3 py-1 text-2xs font-bold text-[var(--color-warning)]",
		icon: AlertTriangle,
	};
}

function readability(value: string) {
	return value
		.split(/[_-]/g)
		.filter(Boolean)
		.map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
		.join(" ");
}
