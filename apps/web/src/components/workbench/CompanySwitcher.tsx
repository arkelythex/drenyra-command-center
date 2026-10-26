import type { CompanyRef } from "@drenyra/domain";
import { Building2, ChevronDown } from "lucide-react";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuRadioGroup,
	DropdownMenuRadioItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

interface CompanySwitcherProps {
	companies: CompanyRef[];
	activeCompany: CompanyRef | null;
	onSelect: (company: CompanyRef) => void;
	compact?: boolean;
}

/**
 * Company picker. A menu with a radio group: the platform provides the
 * keyboard model (arrows, typeahead, Escape) and the roles, so the active
 * company is announced as checked.
 */
export function CompanySwitcher({
	companies,
	activeCompany,
	onSelect,
	compact = false,
}: CompanySwitcherProps) {
	const handleChange = (id: string) => {
		const company = companies.find((candidate) => candidate.id === id);
		if (company) onSelect(company);
	};

	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<button
					type="button"
					className={cn(
						"flex min-h-11 items-center gap-2 rounded-lg px-2 text-left hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40",
						compact ? "text-xs" : "text-sm",
					)}
				>
					<Building2
						aria-hidden="true"
						size={14}
						className="shrink-0 text-muted-foreground"
					/>
					<span className="max-w-[180px] truncate font-medium text-foreground">
						{activeCompany?.name ?? "Seleccionar empresa"}
					</span>
					{activeCompany && (
						<span className="hidden text-xs text-muted-foreground sm:inline">
							RUC {activeCompany.ruc}
						</span>
					)}
					<ChevronDown
						aria-hidden="true"
						size={12}
						className="text-muted-foreground"
					/>
				</button>
			</DropdownMenuTrigger>
			<DropdownMenuContent align="start" className="w-[320px]">
				<DropdownMenuRadioGroup
					value={activeCompany?.id ?? ""}
					onValueChange={handleChange}
				>
					{companies.map((company) => (
						<DropdownMenuRadioItem
							key={company.id}
							value={company.id}
							className="min-h-11"
						>
							<span className="min-w-0">
								<span className="block truncate text-sm font-medium">
									{company.name}
								</span>
								<span className="block truncate text-xs text-muted-foreground">
									RUC {company.ruc}
								</span>
							</span>
						</DropdownMenuRadioItem>
					))}
				</DropdownMenuRadioGroup>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
