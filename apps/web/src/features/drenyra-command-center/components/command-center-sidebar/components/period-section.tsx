import { CalendarDays } from "lucide-react";

interface PeriodSectionProps {
	activePeriod: string;
	t: (key: string) => string;
}

export function PeriodSection({ activePeriod, t }: PeriodSectionProps) {
	return (
		<section
			className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-1)] p-4"
			role="region"
			aria-label={t("sidebar.period")}
		>
			<p className="flex items-center gap-2 text-xs font-bold">
				<CalendarDays size={14} aria-hidden="true" />
				{t("sidebar.period")}
			</p>
			<p className="mt-2 text-2xl font-bold">{activePeriod}</p>
			<div className="mt-4 space-y-2 text-2xs text-[var(--text-secondary)]">
				<p>Procesos: CPE, SIRE, Libro mayor, conciliación.</p>
				<p>Modo: asesoría y preparación con aprobación humana.</p>
			</div>
		</section>
	);
}
