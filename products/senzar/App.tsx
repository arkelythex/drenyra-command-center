import type React from "react";
import { useState } from "react";
import { Header } from "./components/Header";
import { Sidebar } from "./components/Sidebar";
import { AuditScreen } from "./screens/AuditScreen";
import { DashboardScreen } from "./screens/DashboardScreen";
import { LogisticsScreen } from "./screens/LogisticsScreen";
import { ReportsScreen } from "./screens/ReportsScreen";
import { SettingsScreen } from "./screens/SettingsScreen";
import { SmartEntryScreen } from "./screens/SmartEntryScreen";
import type { Screen } from "./types";

const App: React.FC = () => {
	const [currentScreen, setCurrentScreen] = useState<Screen>("dashboard");

	if (currentScreen === "smart-entry") {
		return <SmartEntryScreen onBack={() => setCurrentScreen("dashboard")} />;
	}

	return (
		<div className="flex flex-col h-screen bg-background-light">
			<Header />
			<main className="flex-1 flex overflow-hidden">
				<Sidebar currentScreen={currentScreen} onNavigate={setCurrentScreen} />
				{currentScreen === "dashboard" && <DashboardScreen />}
				{currentScreen === "audit" && <AuditScreen />}
				{currentScreen === "logistics" && <LogisticsScreen />}
				{currentScreen === "reports" && <ReportsScreen />}
				{currentScreen === "settings" && <SettingsScreen />}
			</main>
		</div>
	);
};

export default App;
