import { Download, Menu, Plus, Search, Users2 } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useDesignTokens } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";
import { useSidebarLayout } from "@/stores/sidebar-layout.store";
import { useVendors } from "../hooks/useVendors";
import { VendorTaxTab } from "./tabs/VendorTaxTab";
import { VendorAuditSidebar } from "./widgets/VendorAuditSidebar";
import { VendorCard } from "./widgets/VendorCard";

export const VendorsView = () => {
	const {
		vendors,
		expandedVendors,
		toggleVendor,
		searchQuery,
		setSearchQuery,
		activeTab,
		setActiveTab,
		stats,
	} = useVendors();
	const [isInsightsOpen, setIsInsightsOpen] = useState(false);
	const { zIndex } = useDesignTokens();
	const { setIsMobileOpen } = useSidebarLayout();

	return (
		<div className="flex flex-col lg:flex-row h-full w-full bg-background overflow-hidden relative font-sans text-foreground">
			{/* Mobile Header */}
			<div className="lg:hidden shrink-0 border-b border-border/50 bg-background/90 p-4 flex items-center justify-between">
				<Button
					onClick={() => setIsMobileOpen(true)}
					variant="outline"
					size="icon"
					aria-label="Menú"
					className="h-9 w-9 shrink-0 rounded-xl border-border/50 bg-card hover:bg-card/80"
				>
					<Menu className="h-4 w-4 text-muted-foreground" />
				</Button>
				<Button
					variant="ghost"
					size="sm"
					className="text-muted-foreground"
					onClick={() => setIsInsightsOpen(!isInsightsOpen)}
				>
					<Menu size={18} /> {isInsightsOpen ? "Cerrar" : "Panel"}
				</Button>
				<span className="text-label font-medium tracking-wide text-muted-foreground">
					Proveedores
				</span>
			</div>

			{/* 1. SIDEBAR: FISCAL INTELLIGENCE */}
			<aside
				className={cn(
					"absolute inset-y-0 left-0 w-80 shrink-0 border-r border-border bg-background shadow-xl transition-transform duration-300 lg:relative lg:translate-x-0 lg:bg-muted/10 lg:shadow-none",
					isInsightsOpen
						? "translate-x-0"
						: "-translate-x-full lg:translate-x-0",
				)}
				style={{ zIndex: zIndex.sidebar }}
			>
				<VendorAuditSidebar stats={stats} />
				<div className="p-6 border-t border-border/50 mt-auto">
					<Button size="default" className="w-full shadow-sm">
						<Plus size={16} strokeWidth={2.5} /> Nuevo proveedor
					</Button>
				</div>
			</aside>

			{/* 2. MAIN CONTENT AREA */}
			<main className="flex-1 flex flex-col min-w-0 overflow-hidden">
				{/* Header: CommandDeck Style */}
				<header
					className="px-4 py-3 sm:px-6 sm:py-5 border-b border-border bg-background flex flex-col md:flex-row items-center justify-between gap-4 sm:gap-6 shrink-0 shadow-sm"
					style={{ zIndex: zIndex.sticky }}
				>
					<div className="flex items-center gap-4 sm:gap-6 relative z-10 w-full md:w-auto group">
						<Button
							onClick={() => setIsMobileOpen(true)}
							variant="outline"
							size="icon"
							aria-label="Menú"
							className="h-9 w-9 shrink-0 rounded-xl border-border/50 bg-card hover:bg-card/80 lg:hidden"
						>
							<Menu className="h-4 w-4 text-muted-foreground" />
						</Button>
						<div className="h-10 w-10 sm:h-12 sm:w-12 rounded-xl sm:rounded-2xl border border-border/60 bg-card flex items-center justify-center">
							<Users2
								size={20}
								className="text-primary sm:w-6 sm:h-6 opacity-80 group-hover:opacity-100 transition-opacity"
								strokeWidth={1.75}
							/>
						</div>
						<div className="flex-1 min-w-0">
							<h1 className="text-base sm:text-lg font-semibold tracking-tight text-foreground leading-none truncate">
								Padrón de proveedores
							</h1>
							<div className="flex items-center gap-3 mt-1 sm:mt-1.5">
								<div className="flex bg-muted/50 p-0.5 rounded-lg border border-border/70 shadow-sm overflow-x-auto no-scrollbar max-w-[200px] xs:max-w-none">
									{(["summary", "taxes"] as const).map((tab) => (
										<button
											key={tab}
											onClick={() => setActiveTab(tab)}
											className={cn(
												"h-6 whitespace-nowrap rounded-md px-4 text-2xs font-medium tracking-wide transition-[background-color,color,box-shadow,transform] sm:px-5 sm:text-xs",
												activeTab === tab
													? "bg-card text-foreground shadow-sm border border-border/70"
													: "text-muted-foreground hover:text-foreground",
											)}
										>
											{tab === "summary" ? "Directorio" : "Fiscal"}
										</button>
									))}
								</div>
							</div>
						</div>
					</div>

					<div className="flex flex-row items-center gap-2 sm:gap-4 w-full md:w-auto relative z-10 justify-end">
						<div className="relative group flex-1 md:w-64">
							<Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-foreground group-focus-within:text-foreground transition-colors" />
							<input
								aria-label="Buscar proveedor"
								value={searchQuery}
								onChange={(e) => setSearchQuery(e.target.value)}
								placeholder="Buscar RUC o razón social..."
								className="ui-search-input h-9 w-full rounded-lg pl-9 pr-4 text-sm font-medium shadow-inner transition-[background-color,border-color,box-shadow,color] sm:h-10 sm:rounded-xl"
							/>
						</div>
						<Button
							variant="outline"
							className="h-9 flex-shrink-0 rounded-lg border-border/50 px-4 text-xs font-medium tracking-wide text-foreground transition-[background-color,border-color,color,box-shadow] hover:bg-muted/50 sm:h-10 sm:rounded-xl sm:px-6 sm:text-label"
						>
							<Download size={14} className="sm:mr-2" />{" "}
							<span className="hidden sm:inline">Exportar</span>
						</Button>
					</div>
				</header>

				{/* Content Area */}
				<div className="flex-1 overflow-y-auto p-4 sm:p-8 lg:p-12 2xl:p-16 custom-scrollbar bg-background/30 pb-32 animate-entrance">
					<div className="max-w-[1600px] 2xl:max-w-[1920px] mx-auto space-y-6">
						{activeTab === "summary" ? (
							vendors.length > 0 ? (
								vendors.map((vendor) => (
									<VendorCard
										key={vendor.id}
										vendor={vendor}
										isExpanded={expandedVendors.includes(vendor.id)}
										onToggle={() => toggleVendor(vendor.id)}
									/>
								))
							) : (
								<div className="py-32 text-center border-2 border-dashed border-border/50 rounded-2xl opacity-40">
									<Users2 size={40} className="mx-auto mb-4" />
									<p className="text-xs font-black uppercase tracking-widest">
										Sin resultados
									</p>
								</div>
							)
						) : (
							<VendorTaxTab vendors={vendors} />
						)}
					</div>
				</div>
			</main>
		</div>
	);
};
