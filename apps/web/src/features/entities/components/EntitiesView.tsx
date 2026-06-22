import { Menu, Plus, Search } from "lucide-react";
import type React from "react";
import { useState } from "react";
import { MobileTabNavigation } from "@/components/layout/MobileTabNavigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useDesignTokens } from "@/lib/design-tokens";
import { useSidebarLayout } from "@/stores/sidebar-layout.store";
import { useEntities } from "../hooks/useEntities";
import { EntitiesTable } from "./EntitiesTable";
import { EntityDetailView } from "./EntityDetailView";

export const EntitiesView: React.FC = () => {
	const { entities, search, setSearch } = useEntities();
	const { setIsMobileOpen } = useSidebarLayout();
	const { zIndex } = useDesignTokens();
	const [selectedId, setSelectedId] = useState<string | null>(null);
	const [activeTab, setActiveTab] = useState("all");

	const selectedEntity = entities.find((e) => e.id === selectedId);

	// Filter entities based on active tab
	const filteredEntities = entities.filter((e) => {
		if (activeTab === "all") return true;
		if (activeTab === "customers") return e.type === "CUSTOMER";
		if (activeTab === "vendors") return e.type === "VENDOR";
		return true;
	});

	if (selectedId && selectedEntity) {
		return (
			<EntityDetailView
				entity={selectedEntity}
				onBack={() => setSelectedId(null)}
			/>
		);
	}

	return (
		<div className="relative flex h-full flex-col overflow-hidden bg-background animate-in fade-in duration-300">
			{/* 📱 MOBILE: Floating Navigation Dock */}
			<MobileTabNavigation
				tabs={[
					{ id: "all", label: "Todos" },
					{ id: "customers", label: "Clientes" },
					{ id: "vendors", label: "Proveedores" },
				]}
				activeTab={activeTab}
				onTabChange={setActiveTab}
				className="left-auto right-4 top-4"
			/>

			{/* 📱 MOBILE: Toolbar (Search + Actions) */}
			<div className="relative z-40 mt-14 flex flex-col gap-4 border-b border-border/50 bg-[var(--bg-1)] px-4 py-4 sm:hidden">
				<div className="flex gap-2 w-full items-center">
					<div className="relative group flex-1">
						<Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-foreground group-focus-within:text-foreground transition-colors" />
						<Input
							value={search}
							onChange={(e) => setSearch(e.target.value)}
							placeholder="Buscar entidad..."
							className="ui-search-input h-10 w-full rounded-xl pl-10 text-sm font-medium transition-all"
						/>
					</div>

					{/* Mobile Actions: Inline with Search */}
					<div className="flex gap-2 items-center">
						<button className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm transition-all active:scale-95">
							<Plus size={16} strokeWidth={2} />
						</button>
					</div>
				</div>
			</div>

			{/* Header */}
			<header
				className="sticky top-0 z-[40] hidden shrink-0 flex-col items-center justify-between gap-4 border-b border-border/60 bg-[var(--bg-1)] px-6 py-4 sm:flex md:flex-row"
				style={{ zIndex: zIndex.sticky }}
			>
				<div className="flex items-center gap-4 w-full md:w-auto">
					<Button
						onClick={() => setIsMobileOpen(true)}
						variant="outline"
						size="icon"
						aria-label="Menú"
						className="h-9 w-9 shrink-0 rounded-xl border-border/50 bg-card hover:bg-card/80 lg:hidden"
					>
						<Menu className="h-4 w-4 text-muted-foreground" />
					</Button>
					<div>
						<h1 className="text-lg font-semibold tracking-tight text-foreground">
							Empresas y terceros
						</h1>
						<p className="text-label font-medium tracking-wide text-muted-foreground">
							Gestión de clientes, proveedores y asociados
						</p>
					</div>
				</div>
			</header>

			<EntitiesTable
				entities={filteredEntities}
				search={search}
				onSearch={setSearch}
				onSelect={setSelectedId}
			/>
		</div>
	);
};
