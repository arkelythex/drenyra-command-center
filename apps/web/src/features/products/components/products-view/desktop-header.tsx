import { Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ProductsDesktopHeaderProps {
	backdropClassName: string;
	stickyZIndex: number;
	iconBorderRadius: string;
	searchQuery: string;
	filteredCount: number;
	onSearchChange: (value: string) => void;
	onCreate: () => void;
}

export function ProductsDesktopHeader({
	backdropClassName,
	stickyZIndex,
	iconBorderRadius,
	searchQuery,
	filteredCount,
	onSearchChange,
	onCreate,
}: ProductsDesktopHeaderProps) {
	return (
		<header
			className={`hidden sm:flex px-4 py-4 sm:px-6 sm:py-5 border-b border-border/40 bg-background/60 ${backdropClassName} flex-col md:flex-row items-center justify-between gap-4 sm:gap-6 shrink-0 relative`}
			style={{ zIndex: stickyZIndex }}
		>
			<div className="flex items-center gap-4 sm:gap-6 relative z-10 w-full md:w-auto group">
				<div
					className="ml-12 flex h-10 w-10 items-center justify-center border border-border bg-card shadow-sm lg:ml-0 sm:h-12 sm:w-12"
					style={{ borderRadius: iconBorderRadius }}
				>
					<div className="text-primary sm:w-6 sm:h-6 opacity-80 group-hover:opacity-100 transition-opacity">
						<svg
							xmlns="http://www.w3.org/2000/svg"
							width="20"
							height="20"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							strokeWidth="1.5"
							strokeLinecap="round"
							strokeLinejoin="round"
							className="sm:w-6 sm:h-6"
						>
							<path d="M16.5 9.4 7.55 4.24" />
							<path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
							<path d="M3.29 7 12 12l8.71-5" />
							<path d="M12 22V12" />
						</svg>
					</div>
				</div>
				<div className="flex-1 min-w-0">
					<h1 className="text-lg sm:text-xl font-black tracking-tight text-foreground leading-none truncate">
						Productos y servicios
					</h1>
					<div className="flex items-center gap-3 mt-1.5">
						<div
							className={cn(
								"flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-primary/10 border border-primary/20 shadow-sm",
								backdropClassName,
							)}
						>
							<span className="text-xs font-black text-primary uppercase tracking-widest leading-none">
								{filteredCount} productos
							</span>
						</div>
					</div>
				</div>
			</div>

			<div className="flex flex-row items-center gap-2 sm:gap-4 w-full md:w-auto relative z-10 justify-end">
				<div className="relative group flex-1 md:w-72">
					<Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-foreground group-focus-within:text-foreground transition-colors" />
					<input
						aria-label="Buscar producto"
						value={searchQuery}
						onChange={(event) => onSearchChange(event.target.value)}
						placeholder="Buscar SKU o nombre"
						className="ui-search-input w-full h-10 rounded-xl pl-10 pr-4 text-sm font-bold uppercase tracking-wide transition-all shadow-inner"
					/>
				</div>
				<Button
					onClick={onCreate}
					className="flex-shrink-0 h-10 px-6 rounded-xl bg-foreground text-background hover:bg-foreground/90 shadow-lg transition-all font-black uppercase text-label tracking-widest border border-white/20"
				>
					<Plus size={16} strokeWidth={3} className="sm:mr-2" />{" "}
					<span className="hidden sm:inline">Nuevo producto</span>
				</Button>
			</div>
		</header>
	);
}
