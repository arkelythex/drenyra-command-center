import { CalendarClock, FileCheck, Menu, Users } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PayrollHeaderProps {
	ambientGradientClassName: string;
	iconGradientClassName: string;
	iconBorderRadius: string;
	iconShadow: string;
	stickyZIndex: number;
	onOpenSidebar: () => void;
}

export function PayrollHeader({
	ambientGradientClassName,
	iconGradientClassName,
	iconBorderRadius,
	iconShadow,
	stickyZIndex,
	onOpenSidebar,
}: PayrollHeaderProps) {
	return (
		<header
			className="px-4 py-3 sm:px-6 sm:py-5 border-b border-border bg-background flex flex-col md:flex-row items-center justify-between gap-4 sm:gap-6 shrink-0 shadow-sm relative overflow-hidden"
			style={{ zIndex: stickyZIndex }}
		>
			<div className={`absolute inset-0 ${ambientGradientClassName} pointer-events-none`} />

			<div className="flex items-center gap-4 sm:gap-6 relative z-10 w-full md:w-auto group">
				<Button
					onClick={onOpenSidebar}
					variant="outline"
					size="icon"
					className="h-9 w-9 shrink-0 rounded-xl border-border/50 bg-card hover:bg-card/80 lg:hidden"
				>
					<Menu className="h-4 w-4 text-muted-foreground" />
				</Button>
				<div
					className={`h-10 w-10 sm:h-12 sm:w-12 ${iconGradientClassName} flex items-center justify-center border border-[rgba(var(--premium-info-rgb),0.20)]`}
					style={{ borderRadius: iconBorderRadius, boxShadow: iconShadow }}
				>
					<Users
						size={20}
						className="text-[var(--premium-action-cyan)] sm:w-6 sm:h-6 opacity-80 group-hover:opacity-100 transition-opacity"
						strokeWidth={1.5}
					/>
				</div>
				<div className="flex-1 min-w-0">
					<h1 className="text-base sm:text-lg font-black uppercase tracking-tight text-foreground leading-none truncate">
						Nomina
					</h1>
					<div className="flex items-center gap-2 sm:gap-3 mt-1 sm:mt-1.5 align-middle">
						<div className="flex items-center gap-1.5 px-1.5 py-0.5 rounded bg-[rgba(var(--premium-info-rgb),0.05)] border border-[rgba(var(--premium-info-rgb),0.10)] sm:bg-[rgba(var(--premium-info-rgb),0.10)] sm:border-[rgba(var(--premium-info-rgb),0.20)]">
							<span className="text-2xs sm:text-xs font-black text-[var(--premium-action-cyan)] uppercase tracking-widest">
								PLAME 2026
							</span>
						</div>
						<span className="hidden xs:inline text-muted-foreground/30 font-light">|</span>
						<p className="hidden xs:block text-xs font-bold text-muted-foreground uppercase tracking-widest pt-0.5">
							T-REGISTRO CONNECTED
						</p>
					</div>
				</div>
			</div>

			<div className="flex flex-row md:flex-row gap-2 sm:gap-3 w-full md:w-auto relative z-10">
				<Button
					variant="outline"
					size="sm"
					className="flex-1 sm:flex-initial h-9 sm:h-10 px-3 sm:px-5 rounded-lg sm:rounded-xl border-border bg-muted/20 hover:bg-muted/40 text-muted-foreground transition-all flex items-center justify-center font-black uppercase text-xs sm:text-label tracking-widest"
				>
					<CalendarClock size={14} className="sm:mr-2" />{" "}
					<span className="hidden sm:inline">Cierre: 28 MAR</span>
					<span className="sm:hidden">28 MAR</span>
				</Button>
				<Button className="flex-1 sm:flex-initial h-9 sm:h-10 px-4 sm:px-6 rounded-lg sm:rounded-xl bg-foreground text-background hover:bg-foreground/90 shadow-lg hover:shadow-xl font-black uppercase text-xs sm:text-label tracking-widest border-none transition-all flex items-center justify-center">
					<FileCheck size={14} className="sm:mr-2" />{" "}
					<span className="hidden sm:inline">Generar PLAME</span>
					<span className="sm:hidden">PLAME</span>
				</Button>
			</div>
		</header>
	);
}
