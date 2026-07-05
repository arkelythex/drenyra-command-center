import { createFileRoute } from "@tanstack/react-router";
import { Cpu } from "lucide-react";

export const Route = createFileRoute("/skills")({
	component: SkillsPage,
});

function SkillsPage() {
	return (
		<div className="flex h-full flex-col items-center justify-center px-6 text-center">
			<div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--surface-2)]">
				<Cpu size={22} className="text-[var(--text-muted)]" />
			</div>
			<h2 className="mt-4 text-base font-bold text-[var(--text-primary)]">
				Skills
			</h2>
			<p className="mt-1.5 text-sm text-[var(--text-tertiary)] max-w-sm">
				Catálogo de capacidades de los agentes fiscales. Seleccioná un skill
				para ver su descripción, triggers y casos de uso.
			</p>
		</div>
	);
}
