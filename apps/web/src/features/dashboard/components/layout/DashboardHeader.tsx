import { ChevronLeft, ChevronRight, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
} from "@/components/ui/select";
import { getMonthName } from "@/lib/date-utils";
import { DashboardTab } from "../DashboardView";
import { useHaptics } from "@/hooks/useHaptics";
import { Text } from "@/components/atoms/text";
import { DashboardTenantCard } from "./DashboardTenantCard";
import { useActiveCompanyContext } from "@/lib/use-active-company-context";

interface DashboardHeaderProps {
	activeTab: DashboardTab;
	setActiveTab: (tab: DashboardTab) => void;
	selectedDate: Date;
	handlePreviousMonth: () => void;
	handleNextMonth: () => void;
	handleMonthSelect: (value: string) => void;
	availableMonths: { index: number; name: string; disabled: boolean }[];
	isNextMonthDisabled: boolean;
	setIsInviteModalOpen: (isOpen: boolean) => void;
}

const DASHBOARD_TABS: ReadonlyArray<{ id: DashboardTab; label: string }> = [
	{ id: "resumen", label: "Resumen" },
	{ id: "gastos", label: "Gastos" },
	{ id: "ingresos", label: "Ingresos" },
];

export const DashboardHeader = ({
	activeTab,
	setActiveTab,
	selectedDate,
	handlePreviousMonth,
	handleNextMonth,
	handleMonthSelect,
	availableMonths,
	isNextMonthDisabled,
	setIsInviteModalOpen,
}: DashboardHeaderProps) => {
	const { trigger } = useHaptics();
	const { companyContext, availableCompanies, setActiveCompanyById } =
		useActiveCompanyContext();

	const handleTabChange = (tab: DashboardTab) => {
		trigger("light");
		setActiveTab(tab);
	};

	const handleCompanySelect = (companyId: string) => {
		if (companyId === companyContext.companyId) return;
		setActiveCompanyById(companyId);
	};

	return (
		<header className="relative z-[40] hidden shrink-0 items-center justify-between gap-6 border-b border-border bg-[var(--surface-1)] px-6 py-4 sm:flex">
			<div className="flex items-center gap-6">
				{/* --- COMPANY SELECTOR --- */}
				<div className="hidden lg:block">
					<DashboardTenantCard
						companyContext={companyContext}
						availableCompanies={availableCompanies}
						onSelectCompany={handleCompanySelect}
					/>
				</div>

				{/* --- DASHBOARD TABS --- */}
				<nav
					aria-label="Navegación del dashboard"
					role="tablist"
					className="relative flex items-center gap-1 rounded-xl border border-border/70 bg-[var(--surface-1)] p-1 shadow-[var(--shadow-sm)]"
				>
					{DASHBOARD_TABS.map((tab) => {
						const isActive = activeTab === tab.id;
						return (
							<button
								key={tab.id}
								onClick={() => handleTabChange(tab.id)}
								className={cn(
									"relative flex h-9 items-center justify-center rounded-lg px-5 whitespace-nowrap outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] focus-visible:ring-offset-2 transition-colors duration-150",
									isActive
										? "text-[var(--text-primary)]"
										: "text-muted-foreground hover:text-foreground",
								)}
							>
								{isActive && (
									<div className="absolute inset-0 rounded-lg bg-info shadow-info-glow" />
								)}
								<Text
									variant="label"
									className="relative z-10 text-label font-medium tracking-[0.05em] transition-colors duration-150"
								>
									{tab.label}
								</Text>
							</button>
						);
					})}
				</nav>
			</div>

			{/* --- ACTIONS & CALENDAR --- */}
			<div className="flex items-center gap-5">
				<div className="flex items-center rounded-xl border border-border/70 bg-[var(--surface-1)] p-1 shadow-[var(--shadow-sm)]">
					<Button
						onClick={handlePreviousMonth}
						variant="ghost"
						size="icon"
						aria-label="Mes anterior"
						className="h-9 w-9 border-0 hover:bg-[var(--surface-2)]/68"
					>
						<ChevronLeft size={20} className="text-muted-foreground" />
					</Button>

					<Select
						value={selectedDate.getMonth().toString()}
						onValueChange={handleMonthSelect}
					>
						<SelectTrigger className="h-9 w-36 rounded-lg border-0 bg-transparent transition-colors duration-150 hover:bg-[var(--surface-2)]/52 focus:ring-0">
							<div className="w-full text-center">
								<Text
									variant="label"
									className="text-label font-medium tracking-[0.05em] text-foreground"
								>
									{getMonthName(selectedDate)}
								</Text>
							</div>
						</SelectTrigger>
						<SelectContent className="rounded-xl border-border/70 bg-[var(--surface-1)]/96 p-2 backdrop-blur-xl">
							{availableMonths.map((month) => (
								<SelectItem
									key={month.index}
									value={month.index.toString()}
									disabled={month.disabled}
									className="cursor-pointer rounded-lg py-2"
								>
									<Text
										variant="label"
										className="text-label font-medium tracking-[0.04em] text-inherit"
									>
										{month.name}
									</Text>
								</SelectItem>
							))}
						</SelectContent>
					</Select>

					<Button
						onClick={handleNextMonth}
						variant="ghost"
						size="icon"
						aria-label="Mes siguiente"
						disabled={isNextMonthDisabled}
						className="h-9 w-9 border-0 hover:bg-[var(--surface-2)]/68"
					>
						<ChevronRight size={20} className="text-muted-foreground" />
					</Button>
				</div>

				<Button
					onClick={() => setIsInviteModalOpen(true)}
					variant="outline"
					className="group h-10 rounded-xl border-border/70 bg-[var(--surface-1)] px-4 text-label font-medium tracking-[0.04em] transition-colors duration-150 hover:bg-[var(--surface-2)]/68"
				>
					<UserPlus
						size={16}
						className="mr-2 text-muted-foreground transition-colors duration-150 group-hover:text-foreground"
					/>
					Invitar
				</Button>
			</div>
		</header>
	);
};
