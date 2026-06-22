import { Download, Menu, Search, UserPlus, Users2 } from "lucide-react";
import { useState } from "react";
import { Button } from "../../../components/ui/button";
import { useSidebarLayout } from "@/stores/sidebar-layout.store";
import { cn } from "../../../lib/utils";
import { type Customer, useCustomers } from "../hooks/useCustomers";
import { CustomerModal } from "./CustomerModal";
import { CustomerCobranzaTab } from "./tabs/CustomerCobranzaTab";
import { CustomerAuditSidebar } from "./widgets/CustomerAuditSidebar";
import { CustomerCard } from "./widgets/CustomerCard";

export const CustomersView = () => {
	const {
		customers,
		expandedCustomers,
		toggleCustomer,
		searchQuery,
		setSearchQuery,
		activeTab,
		setActiveTab,
		stats,
	} = useCustomers();
	const [isInsightsOpen, setIsInsightsOpen] = useState(false);
	const [isModalOpen, setIsModalOpen] = useState(false);
	const { setIsMobileOpen } = useSidebarLayout();
	const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(
		null,
	);
	const [modalMode, setModalMode] = useState<"create" | "edit">("create");

	const handleNewCustomer = () => {
		setSelectedCustomer(null);
		setModalMode("create");
		setIsModalOpen(true);
	};

	return (
		<div className="relative flex h-full w-full flex-col overflow-hidden bg-background font-sans text-foreground lg:flex-row">
			{/* Mobile Header: Elite Glass */}
			<div className="z-[60] flex shrink-0 items-center justify-between border-b border-border bg-[var(--bg-1)] p-4 shadow-md lg:hidden">
				<Button
					onClick={() => setIsMobileOpen(true)}
					variant="ghost"
					size="icon"
					aria-label="Menú"
					className="h-10 w-10 rounded-full bg-card"
				>
					<Menu className="h-5 w-5 text-muted-foreground" />
				</Button>
				<Button
					variant="outline"
					size="sm"
					className="h-9 px-4 rounded-xl text-2xs font-black uppercase tracking-widest border-border hover:bg-muted/70"
					onClick={() => setIsInsightsOpen(!isInsightsOpen)}
				>
					{isInsightsOpen ? "Cerrar Panel" : "Ver Auditoría"}
				</Button>
				<span className="text-2xs font-black uppercase tracking-[0.2em] text-primary">
					Cartera 2026
				</span>
			</div>

			{/* 1. SIDEBAR: CARTERA INTELLIGENCE (Elite Surface) */}
			<aside
				className={cn(
					"absolute inset-y-0 left-0 z-[50] w-[340px] shrink-0 border-r border-border bg-card shadow-[0_0_40px_-18px_rgba(0,0,0,0.35)] transition-[transform,box-shadow,background-color] duration-300 ease-out lg:relative lg:translate-x-0",
					isInsightsOpen
						? "translate-x-0"
						: "-translate-x-full lg:translate-x-0",
				)}
			>
				<div className="flex flex-col h-full">
					<div className="flex-1 overflow-y-auto custom-scrollbar">
						<CustomerAuditSidebar stats={stats} />
					</div>
					<div className="border-t border-border bg-muted/40 p-8">
						<Button
							size="lg"
							variant="default"
							className="h-14 w-full rounded-2xl text-label font-black uppercase tracking-[0.2em] shadow-xl shadow-primary/15"
							onClick={handleNewCustomer}
						>
							<UserPlus size={18} strokeWidth={3} className="mr-3" /> Nuevo
							Cliente
						</Button>
					</div>
				</div>
			</aside>

			{/* 2. MAIN CONTENT AREA */}
			<main className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
				{/* Header: CommandDeck (The Elite Workspace Header) */}
				<header className="relative z-40 flex shrink-0 flex-col items-center justify-between gap-6 border-b border-border bg-[var(--bg-1)] px-6 py-6 shadow-lg md:flex-row">
					<div className="flex items-center gap-6 relative z-10 w-full md:w-auto group">
						<div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-xl shadow-primary/15 ring-4 ring-primary/5 transition-[box-shadow,transform] group-hover:scale-[1.03] group-hover:rotate-2">
							<Users2 size={28} strokeWidth={2.5} />
						</div>
						<div className="flex-1 min-w-0">
							<h1 className="text-2xl font-black uppercase tracking-tighter text-foreground leading-none mb-2">
								Gestión de Cartera
							</h1>
							<div className="flex items-center gap-3">
								<div className="flex bg-muted/60 p-1 rounded-xl border border-border shadow-inner">
									{(["summary", "cobranza"] as const).map((tab) => (
										<button
											key={tab}
											onClick={() => setActiveTab(tab)}
											className={cn(
												"h-8 rounded-lg px-6 text-2xs font-black uppercase tracking-widest transition-[background-color,color,box-shadow,transform] duration-200",
												activeTab === tab
													? "bg-primary text-primary-foreground shadow-lg"
													: "text-muted-foreground/80 hover:text-foreground hover:bg-muted/70",
											)}
										>
											{tab === "summary" ? "Directorio" : "Balance"}
										</button>
									))}
								</div>
							</div>
						</div>
					</div>

					<div className="flex flex-row items-center gap-4 w-full md:w-auto relative z-10 justify-end">
						<div className="relative group flex-1 md:w-80">
							<Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/60 transition-colors duration-200 group-focus-within:text-primary" />
							<input
								aria-label="Buscar cliente"
								value={searchQuery}
								onChange={(e) => setSearchQuery(e.target.value)}
								placeholder="Buscar por RUC o Razón Social..."
								className="h-12 w-full rounded-2xl border border-border bg-card pl-12 pr-6 text-sm font-semibold uppercase tracking-tight shadow-inner transition-[background-color,border-color,box-shadow,color] placeholder:text-muted-foreground/70 focus:border-primary/40 focus:outline-none focus:ring-4 focus:ring-primary/10"
							/>
						</div>
						<Button
							variant="outline"
							className="h-12 flex-shrink-0 rounded-2xl border-border px-8 text-2xs font-black uppercase tracking-[0.2em] text-foreground shadow-md transition-[background-color,border-color,color,box-shadow] hover:bg-muted/70"
						>
							<Download size={16} className="mr-3" />{" "}
							<span className="hidden sm:inline">Exportar Acta</span>
						</Button>
					</div>
				</header>

				{/* Content Area: The Infinite Grid */}
				<div className="flex-1 overflow-y-auto p-6 sm:p-10 lg:p-14 custom-scrollbar pb-40 animate-entrance relative">
					<div className="max-w-[1600px] 2xl:max-w-[1920px] mx-auto space-y-8">
						{activeTab === "summary" ? (
							customers.length > 0 ? (
								<div className="grid grid-cols-1 xl:grid-cols-2 2xl:grid-cols-3 gap-8">
									{customers.map((customer) => (
										<CustomerCard
											key={customer.id}
											customer={customer}
											isExpanded={expandedCustomers.includes(customer.id)}
											onToggle={() => toggleCustomer(customer.id)}
										/>
									))}
								</div>
							) : (
								<div
									className="group flex cursor-pointer flex-col items-center justify-center rounded-4xl border-2 border-dashed border-border bg-card py-48 shadow-inner transition-[background-color,border-color,box-shadow] hover:bg-muted/30"
									onClick={handleNewCustomer}
									role="button"
									tabIndex={0}
									onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleNewCustomer(); } }}
								>
									<div className="mb-8 flex h-24 w-24 items-center justify-center rounded-2xl border border-primary/20 bg-primary/5 text-primary shadow-xl transition-transform duration-300 group-hover:scale-[1.05]">
										<Users2 size={48} strokeWidth={1} />
									</div>
									<h2 className="text-xl font-black uppercase tracking-tighter text-foreground mb-3">
										Cartera Vacía
									</h2>
									<p className="text-label font-bold text-muted-foreground/60 uppercase tracking-widest max-w-xs text-center leading-relaxed px-8">
										No se detectaron nodos comerciales. Inicie el registro para
										la gestión cognitiva.
									</p>
									<Button
										variant="outline"
										size="lg"
										className="mt-10 h-12 px-10 rounded-2xl border-primary/30 text-primary font-black uppercase text-2xs tracking-[0.2em] shadow-xl hover:bg-primary/10"
									>
										+ Registrar Primer Cliente
									</Button>
								</div>
							)
						) : (
							<CustomerCobranzaTab customers={customers} />
						)}
					</div>
				</div>
			</main>

			<CustomerModal
				open={isModalOpen}
				onOpenChange={setIsModalOpen}
				customer={selectedCustomer}
				mode={modalMode}
			/>
		</div>
	);
};
