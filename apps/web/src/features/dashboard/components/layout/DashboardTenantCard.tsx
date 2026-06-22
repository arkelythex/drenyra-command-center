import { Building2 } from "lucide-react";
import type { CompanyContext } from "@/lib/company-context";
import { Text } from "@/components/atoms/text";

interface DashboardTenantCardProps {
	companyContext: CompanyContext;
	availableCompanies?: CompanyContext[];
	onSelectCompany?: (companyId: string) => void;
}

export function DashboardTenantCard({
	companyContext,
	availableCompanies = [],
	onSelectCompany,
}: DashboardTenantCardProps) {
	const hasCompanySwitcher = availableCompanies.length > 1 && typeof onSelectCompany === "function";

	return (
		<div
			className="flex min-h-12 w-[320px] items-center gap-4 rounded-2xl border border-border/60 bg-[var(--surface-1)]/88 px-4 py-2"
			data-testid="dashboard-tenant-card"
		>
			<div className="h-7 w-7 rounded-xl bg-[var(--color-ai-primary)]/10 flex items-center justify-center border border-[var(--color-ai-primary)]/20 text-[var(--color-ai-primary)] shrink-0">
				<Building2 size={16} />
			</div>
			<div className="min-w-0 flex-1">
				<div className="flex items-center gap-2">
					<Text variant="label" className="text-[8px] tracking-[0.2em] text-muted-foreground uppercase">
						Tenant Activo
					</Text>
					{companyContext.isDemoFallback ? (
						<span className="rounded-full border border-[var(--color-ai-primary)]/25 bg-[var(--color-ai-primary)]/10 px-1.5 py-0.5 text-[8px] font-black uppercase tracking-[0.18em] text-[var(--color-ai-primary)]">
							Demo Seed
						</span>
					) : null}
				</div>
				<Text
					variant="label"
					className="text-[12px] font-black truncate"
					title={companyContext.companyName}
				>
					{companyContext.companyName}
				</Text>
				<Text variant="data" className="text-2xs text-muted-foreground mt-0.5">
					RUC: {companyContext.ruc}
				</Text>
				{hasCompanySwitcher ? (
					<label className="mt-1 block">
						<span className="sr-only">Empresa activa</span>
						<select
							aria-label="Empresa activa"
							className="ui-search-input mt-1 h-7 w-full rounded-xl px-2 text-2xs font-black uppercase tracking-[0.12em] text-foreground outline-none"
							value={companyContext.companyId}
							onChange={(event) => onSelectCompany?.(event.target.value)}
						>
							{availableCompanies.map((company) => (
								<option key={company.companyId} value={company.companyId}>
									{company.companyName}
								</option>
							))}
						</select>
					</label>
				) : null}
			</div>
		</div>
	);
}
