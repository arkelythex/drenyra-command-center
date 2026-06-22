import { useTranslation } from "../../i18n/i18n";
import { useNotifications } from "../../hooks/useNotifications";
import type { CommandCenterSidebarProps } from "./command-center-sidebar.types";
import { NotificationBadge } from "./components/notification-badge";
import { CompanySection } from "./components/company-section";
import { FiscalCasesSection } from "./components/fiscal-cases-section";
import { ThreadsSection } from "./components/threads-section";
import { AgentsSection } from "./components/agents-section";
import { PeriodSection } from "./components/period-section";

export function CommandCenterSidebar({
	companyContext,
	availableCompanies,
	onCompanySelect,
	activePeriod,
	cases,
	selectedCaseId,
	onCaseSelect,
	onCreateCase,
	companyId,
	notificationBadge = 0,
}: CommandCenterSidebarProps) {
	const { t } = useTranslation();
	const { markAllAsRead } = useNotifications();
	return (
		<aside className="flex h-full flex-col border-r border-[var(--border-subtle)] bg-[var(--surface-2)]/70 p-4"
			aria-label="Panel lateral del Centro de Comandos"
		>
			{/* Header */}
			<div className="mb-6 shrink-0">
				<p className="text-2xs font-bold uppercase tracking-[0.24em] text-[var(--color-info)]">
					Drenyra
				</p>
				<h1 className="mt-2 text-xl font-bold tracking-tight">
					{t("sidebar.title")}
				</h1>
				<p className="mt-2 text-xs text-[var(--text-tertiary)]">
					{t("sidebar.description")}
				</p>
				<NotificationBadge
					count={notificationBadge}
					onMarkAllRead={markAllAsRead}
					t={t}
				/>
			</div>

			{/* Scrollable body */}
			<div className="min-h-0 flex-1 space-y-6 overflow-y-auto">
				<CompanySection
					companies={availableCompanies}
					selectedCompanyId={companyContext.companyId}
					onCompanySelect={onCompanySelect}
					t={t}
				/>
				<FiscalCasesSection
					cases={cases}
					selectedCaseId={selectedCaseId}
					onCaseSelect={onCaseSelect}
					onCreateCase={onCreateCase}
					t={t}
				/>
				<ThreadsSection
					companyId={companyId}
					t={t}
				/>
				<AgentsSection t={t} />
				<PeriodSection activePeriod={activePeriod} t={t} />
			</div>
		</aside>
	);
}
