import {
	BarChart3,
	ChevronLeft,
	ChevronRight,
	Download,
	FileText,
	Plus,
} from "lucide-react";
import { CommandDeck, DeckItem } from "@/components/ui/layout/command-deck";
import { DashboardTab } from "../DashboardView";

interface DashboardMobileNavProps {
	handlePreviousMonth: () => void;
	handleNextMonth: () => void;
}

export const DashboardMobileNav = ({
	handlePreviousMonth,
	handleNextMonth,
}: DashboardMobileNavProps) => {
	return (
		<CommandDeck>
			<DeckItem
				icon={ChevronLeft}
				onClick={handlePreviousMonth}
				label="Mes Ant"
			/>
			<DeckItem
				icon={Plus}
				onClick={() => {
					// Quick action: New transaction
					const event = new CustomEvent("quickAction", {
						detail: { action: "new-transaction" },
					});
					window.dispatchEvent(event);
				}}
				label="Nuevo"
			/>
			<DeckItem
				icon={FileText}
				onClick={() => {
					// Quick action: Generate report
					const event = new CustomEvent("quickAction", {
						detail: { action: "generate-report" },
					});
					window.dispatchEvent(event);
				}}
				label="Reporte"
			/>
			<DeckItem
				icon={Download}
				onClick={() => {
					// Quick action: Export data
					const event = new CustomEvent("quickAction", {
						detail: { action: "export-data" },
					});
					window.dispatchEvent(event);
				}}
				label="Exportar"
			/>
			<DeckItem icon={ChevronRight} onClick={handleNextMonth} label="Mes Sig" />
		</CommandDeck>
	);
};
