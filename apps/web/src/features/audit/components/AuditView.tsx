import { useState } from "react";
import { useAuditEvents } from "../hooks/useAuditEvents";
import { AuditHeader } from "./AuditHeader";
import { AuditMetrics } from "./AuditMetrics";
import { AuditFilters } from "./AuditFilters";
import { AuditTable } from "./AuditTable";

export const AuditView = () => {
	const [selectedPeriod, setSelectedPeriod] = useState("month");
	const [searchQuery, setSearchQuery] = useState("");
	const { data: events = [], isLoading } = useAuditEvents(selectedPeriod, searchQuery);

	return (
		<div className="flex flex-col flex-1 bg-background text-foreground overflow-hidden font-sans relative">
			<div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(99,102,241,0.06),transparent_70%)] pointer-events-none" />
			<AuditHeader />
			<AuditMetrics eventCount={events.length} />
			<AuditFilters
				searchQuery={searchQuery}
				onSearchChange={setSearchQuery}
				selectedPeriod={selectedPeriod}
				onPeriodChange={setSelectedPeriod}
			/>
			<div className="flex-1 overflow-auto p-6 lg:p-10 bg-transparent relative z-10">
				<AuditTable events={events} isLoading={isLoading} />
			</div>
		</div>
	);
};
