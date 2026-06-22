import { Building2 } from "lucide-react";
import type { CompanyContext } from "@/lib/company-context";
import { cn } from "@/lib/utils";

interface CompanySectionProps {
	companies: CompanyContext[];
	selectedCompanyId: string;
	onCompanySelect: (companyId: string) => void;
	t: (key: string) => string;
}

export function CompanySection({ companies, selectedCompanyId, onCompanySelect, t }: CompanySectionProps) {
	return (
		<section className="space-y-2" role="region" aria-label={t("sidebar.companies")}>
			<p className="text-2xs font-bold uppercase tracking-widest text-[var(--text-tertiary)]">
				{t("sidebar.companies")}
			</p>
			{companies.map((company) => (
				<button
					key={company.companyId}
					onClick={() => onCompanySelect(company.companyId)}
					className={cn(
						"w-full rounded-xl border p-3 text-left text-xs transition",
						company.companyId === selectedCompanyId
							? "border-[var(--color-info)]/40 bg-[var(--color-info)]/10"
							: "border-[var(--border-subtle)] bg-[var(--surface-1)]/70 hover:border-[var(--border-strong)]",
					)}
					type="button"
				>
					<span className="flex items-center gap-2 font-semibold">
						<Building2 size={14} aria-hidden="true" />
						{company.companyName}
						{company.companyId === selectedCompanyId && (
							<span aria-hidden="true" className="ml-auto text-[var(--color-info)]">✓</span>
						)}
					</span>
					<span className="mt-1 block text-2xs text-[var(--text-tertiary)]">
						RUC {company.ruc}
					</span>
				</button>
			))}
		</section>
	);
}
