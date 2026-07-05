import { Building2, ChevronDown } from "lucide-react";
import { useActiveCompanyContext } from "@/lib/use-active-company-context";
import { cn } from "@/lib/utils";

interface ActiveCompanySwitcherProps {
	compact?: boolean;
	className?: string;
}

export function ActiveCompanySwitcher({
	compact = false,
	className,
}: ActiveCompanySwitcherProps) {
	const { companyContext, availableCompanies, setActiveCompanyById } =
		useActiveCompanyContext();
	const hasCompanySwitcher = availableCompanies.length > 1;

	return (
		<div
			className={cn(
				"group min-w-0 rounded-lg bg-transparent text-[var(--text-primary)] hover:bg-[var(--surface-hover)] transition-colors duration-150 relative cursor-pointer",
				compact
					? "flex items-center gap-3 px-2 py-2"
					: "flex items-center gap-3 px-2 py-2",
				className,
			)}
			data-testid="active-company-switcher"
		>
			<div
				className={cn(
					"flex shrink-0 items-center justify-center rounded-md border border-[var(--border-subtle)] bg-[var(--surface-1)] text-[var(--text-primary)]",
					compact ? "h-8 w-8" : "h-8 w-8",
				)}
			>
				<Building2 size={compact ? 16 : 16} />
			</div>
			<div className="min-w-0 flex-1 pr-4">
				{hasCompanySwitcher ? (
					<label className="block w-full cursor-pointer">
						<span className="sr-only">Seleccionar empresa activa</span>
						<select
							aria-label="Seleccionar empresa activa"
							className={cn(
								"w-full appearance-none bg-transparent font-semibold text-[13px] text-[var(--text-primary)] outline-none cursor-pointer truncate",
							)}
							value={companyContext.companyId}
							onChange={(event) => setActiveCompanyById(event.target.value)}
						>
							{availableCompanies.map((company) => (
								<option key={company.companyId} value={company.companyId}>
									{company.companyName}
								</option>
							))}
						</select>
					</label>
				) : (
					<div className="min-w-0">
						<div
							className={cn("truncate font-semibold text-[13px]")}
							title={companyContext.companyName}
						>
							{companyContext.companyName}
						</div>
					</div>
				)}
				<span
					className={cn("truncate text-[var(--text-muted)] block text-label")}
				>
					RUC {companyContext.ruc}
				</span>
			</div>
			{hasCompanySwitcher && (
				<div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-[var(--text-tertiary)] group-hover:text-[var(--text-secondary)] transition-colors">
					<ChevronDown size={14} />
				</div>
			)}
		</div>
	);
}
