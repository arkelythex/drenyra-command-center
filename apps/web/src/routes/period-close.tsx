import { createFileRoute } from "@tanstack/react-router";
import { CalendarCheck } from "lucide-react";

export const Route = createFileRoute("/period-close")({
	component: PeriodClosePage,
});

function PeriodClosePage() {
	return (
		<div className="flex h-full flex-col items-center justify-center px-6 text-center">
			<div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--surface-2)]">
				<CalendarCheck size={22} className="text-[var(--text-muted)]" />
			</div>
			<h2 className="mt-4 text-base font-bold text-[var(--text-primary)]">
				Cierre de Período
			</h2>
			<p className="mt-1.5 text-sm text-[var(--text-tertiary)] max-w-sm">
				Panel de cierre de período contable. Acá se gestionan los pasos
				restantes para cerrar el mes fiscal con respaldo SUNAT.
			</p>
		</div>
	);
}
