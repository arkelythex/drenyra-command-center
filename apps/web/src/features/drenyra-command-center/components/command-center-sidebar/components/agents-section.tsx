import { Bot } from "lucide-react";
import { cn } from "@/lib/utils";
import { SIDEBAR_AGENTS } from "../command-center-sidebar.data";

interface AgentsSectionProps {
	t: (key: string) => string;
}

export function AgentsSection({ t }: AgentsSectionProps) {
	return (
		<section
			className="space-y-2"
			role="region"
			aria-label={t("sidebar.agents")}
		>
			<p className="text-2xs font-bold uppercase tracking-widest text-[var(--text-tertiary)]">
				{t("sidebar.agents")}
			</p>
			<div className="space-y-1">
				{SIDEBAR_AGENTS.map((agent) => (
					<div
						key={agent.id}
						className="flex items-center gap-2 rounded-xl p-3 text-xs"
					>
						<Bot
							size={14}
							aria-hidden="true"
							className={cn(
								"shrink-0",
								agent.active
									? "text-[var(--color-info)]"
									: "text-[var(--text-tertiary)]",
							)}
						/>
						<span className="flex-1 font-medium">{agent.label}</span>
						<span
							className={cn(
								"h-2 w-2 rounded-full",
								agent.active
									? "bg-[var(--color-info)]"
									: "bg-[var(--text-tertiary)]",
							)}
							aria-label={agent.active ? "Activo" : "Inactivo"}
						/>
					</div>
				))}
			</div>
		</section>
	);
}
