import { FileText, Plus } from "lucide-react";
import type { FiscalCase } from "../../../api/drenyra-command-center.api";
import { cn } from "@/lib/utils";
import { CASE_TYPE_LABELS } from "../command-center-sidebar.data";

interface FiscalCasesSectionProps {
	cases: FiscalCase[];
	selectedCaseId: string | null;
	onCaseSelect: (caseId: string) => void;
	onCreateCase: () => void;
	t: (key: string) => string;
}

export function FiscalCasesSection({ cases, selectedCaseId, onCaseSelect, onCreateCase, t }: FiscalCasesSectionProps) {
	return (
		<section className="space-y-2" role="region" aria-label={t("sidebar.cases")}>
			<p className="text-2xs font-bold uppercase tracking-widest text-[var(--text-tertiary)]">
				{t("sidebar.cases")}
			</p>
			<button
				data-action="new-case"
				onClick={onCreateCase}
				className="flex w-full items-center gap-2 rounded-xl border border-dashed border-[var(--border-subtle)] p-3 text-xs text-[var(--text-secondary)] transition hover:border-[var(--color-info)]/40 hover:text-[var(--color-info)]"
				type="button"
			>
				<Plus size={14} aria-hidden="true" />
				{t("sidebar.newCase")}
			</button>
			{cases.length === 0 ? (
				<p className="px-1 text-2xs text-[var(--text-tertiary)]">
					No hay casos fiscales
				</p>
			) : (
				<div className="space-y-1">
					{cases.map((fiscalCase) => (
						<button
							key={fiscalCase.id}
							onClick={() => onCaseSelect(fiscalCase.id)}
							className={cn(
								"flex w-full items-center gap-2 rounded-xl border p-3 text-left text-xs transition",
								fiscalCase.id === selectedCaseId
									? "border-[var(--color-info)]/40 bg-[var(--color-info)]/10"
									: "border-transparent hover:bg-[var(--surface-1)]/60",
							)}
							type="button"
						>
							<FileText
								size={14}
								aria-hidden="true"
								className={cn(
									"shrink-0",
									fiscalCase.id === selectedCaseId
										? "text-[var(--color-info)]"
										: "text-[var(--text-tertiary)]",
								)}
							/>
							<span className="flex-1 truncate font-medium">
								{CASE_TYPE_LABELS[fiscalCase.type] ?? fiscalCase.type}
							</span>
							{fiscalCase.id === selectedCaseId && (
								<span aria-hidden="true" className="text-[var(--color-info)]">●</span>
							)}
						</button>
					))}
				</div>
			)}
		</section>
	);
}
