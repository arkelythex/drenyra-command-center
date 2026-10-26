import { useNavigate, useParams } from "@tanstack/react-router";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/native-select";
import {
	closeWorkspaceParams,
	fiscalPeriodFromParams,
} from "@/lib/close-workspace";
import { useActiveCompanyContext } from "@/lib/use-active-company-context";
import { CompanySwitcher } from "./CompanySwitcher";

const WORKSPACE_ROUTE = "/workspace/$companyId/$year/$month/$intent" as const;

/**
 * Company and period of the workspace being viewed. Both come from the
 * session (never a hard-coded list) and changing either reopens the same
 * workspace for the new company or month.
 */
export function WorkspaceTopBar() {
	const navigate = useNavigate();
	const { intent, year, month } = useParams({ from: WORKSPACE_ROUTE });
	const {
		companyContext,
		availableCompanies,
		fiscalPeriod,
		availablePeriods,
		formatFiscalPeriodLabel,
		setActiveCompanyById,
		setActiveFiscalPeriod,
	} = useActiveCompanyContext();

	// The page shows the period in the address, so the picker must agree with it.
	const viewedPeriod = fiscalPeriodFromParams(year, month) ?? fiscalPeriod;
	const periods =
		viewedPeriod && !availablePeriods.includes(viewedPeriod)
			? [viewedPeriod, ...availablePeriods]
			: availablePeriods;

	const open = (companyId: string, period: string | null) =>
		navigate({
			to: WORKSPACE_ROUTE,
			params: { ...closeWorkspaceParams(companyId, period), intent },
		});

	const companies = availableCompanies.map((company) => ({
		id: company.companyId,
		name: company.companyName,
		ruc: company.ruc,
	}));

	return (
		<div className="flex items-center gap-3 overflow-x-auto border-b border-border bg-card px-3 py-1.5">
			<CompanySwitcher
				companies={companies}
				activeCompany={{
					id: companyContext.companyId,
					name: companyContext.companyName,
					ruc: companyContext.ruc,
				}}
				onSelect={(company) => {
					if (setActiveCompanyById(company.id)) {
						void open(company.id, fiscalPeriod);
					}
				}}
			/>

			<div className="flex items-center gap-2">
				<Label htmlFor="workspace-period" className="sr-only">
					Período fiscal
				</Label>
				<NativeSelect
					id="workspace-period"
					className="h-11 w-48"
					value={viewedPeriod ?? ""}
					onChange={(event) => {
						setActiveFiscalPeriod(event.target.value);
						void open(companyContext.companyId, event.target.value);
					}}
				>
					{periods.map((period) => (
						<option key={period} value={period}>
							{formatFiscalPeriodLabel(period)}
						</option>
					))}
				</NativeSelect>
			</div>
		</div>
	);
}
