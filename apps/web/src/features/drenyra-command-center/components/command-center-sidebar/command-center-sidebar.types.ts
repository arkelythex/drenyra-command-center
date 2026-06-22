import type { CompanyContext } from "@/lib/company-context";
import type { FiscalCase } from "../api/drenyra-command-center.api";

export interface CommandCenterSidebarProps {
	companyContext: CompanyContext;
	availableCompanies: CompanyContext[];
	onCompanySelect: (companyId: string) => void;
	activePeriod: string;
	cases: FiscalCase[];
	selectedCaseId: string | null;
	onCaseSelect: (caseId: string) => void;
	onCreateCase: () => void;
	companyId: string;
	notificationBadge?: number;
}
