import { useMemo } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { useFiscalCaseStore } from "@/stores/fiscal-case-store";
import { STATUS_LABELS, STATUS_STYLES } from "../Sidebar.data";

interface SidebarCaseListProps {
	isCollapsed: boolean;
	onNavigate: () => void;
}

export function SidebarCaseList({ isCollapsed, onNavigate }: SidebarCaseListProps) {
	const navigate = useNavigate();
	const fiscalCases = useFiscalCaseStore((s) => s.fiscalCases);

	const groupedCases = useMemo(() => {
		const now = new Date();
		const today = now.toDateString();
		const weekAgo = new Date(now);
		weekAgo.setDate(weekAgo.getDate() - 7);

		const groups: { label: string; items: typeof fiscalCases }[] = [
			{ label: "Hoy", items: [] },
			{ label: "Esta semana", items: [] },
			{ label: "Este mes", items: [] },
		];

		for (const fiscalCase of fiscalCases) {
			const caseDate = new Date(fiscalCase.date);
			const dayDiff = Math.floor(
				(now.getTime() - caseDate.getTime()) / (1000 * 60 * 60 * 24),
			);
			if (caseDate.toDateString() === today) {
				groups[0].items.push(fiscalCase);
			} else if (dayDiff <= 7) {
				groups[1].items.push(fiscalCase);
			} else if (dayDiff <= 31) {
				groups[2].items.push(fiscalCase);
			} else {
				groups[2].items.push(fiscalCase);
			}
		}

		return groups.filter((g) => g.items.length > 0);
	}, [fiscalCases]);

	const handleCaseClick = (caseId: string) => {
		onNavigate();
		navigate({ to: "/drenyra/$threadId", params: { threadId: caseId } });
	};

	if (isCollapsed) return null;

	return (
		<div>
			<div className="flex items-center justify-between px-1 pb-1">
				<span className="text-2xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
					Casos
				</span>
				<button
					type="button"
					onClick={() => {
						onNavigate();
						/* TODO: createFiscalCase mutation */
					}}
					className="flex items-center gap-1 rounded-md px-1.5 py-1 text-2xs font-medium text-[var(--color-primary)] transition-colors hover:bg-[var(--surface-2)]"
				>
					<Plus size={11} strokeWidth={2} />
					<span>Nuevo</span>
				</button>
			</div>
			{fiscalCases.length === 0 ? (
				<div className="rounded-lg border border-dashed border-[var(--border-subtle)] px-3 py-6 text-center">
					<p className="text-2xs text-[var(--text-muted)]">Sin casos activos</p>
				</div>
			) : (
				<div className="space-y-3">
					{groupedCases.map(({ label, items }) => (
						<div key={label}>
							{items.length > 0 && (
								<>
									<span className="block px-1 pb-0.5 text-2xs font-medium text-[var(--text-muted)]">
										{label}
									</span>
									<div className="space-y-0.5">
										{items.map((fiscalCase) => {
											const style = STATUS_STYLES[fiscalCase.status];
											const label2 = STATUS_LABELS[fiscalCase.status];
											return (
												<button
													key={fiscalCase.id}
													onClick={() => handleCaseClick(fiscalCase.id)}
													type="button"
													className="flex w-full items-start gap-2.5 rounded-lg px-3 py-2 text-left transition-colors hover:bg-[var(--surface-2)]"
												>
													<div className="flex min-w-0 flex-1 flex-col gap-0.5">
														<span className="truncate text-xs font-medium text-[var(--text-primary)]">
															{fiscalCase.title}
														</span>
														<span className="text-2xs text-[var(--text-muted)]">
															{fiscalCase.date}
														</span>
													</div>
													{label2 && (
														<span className={cn("shrink-0 text-2xs font-medium mt-0.5", style)}>
															{label2}
														</span>
													)}
												</button>
											);
										})}
									</div>
								</>
							)}
						</div>
					))}
				</div>
			)}
		</div>
	);
}
