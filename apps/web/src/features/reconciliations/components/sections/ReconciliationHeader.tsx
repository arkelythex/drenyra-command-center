import { ArrowRightLeft, Menu } from "lucide-react";
import type React from "react";
import { Button } from "@/components/ui/button";
import { Z_INDEX } from "@/lib/design-tokens";
import { StatementImportDialog } from "./StatementImportDialog";

interface ReconciliationHeaderProps {
	setIsMobileOpen: (open: boolean) => void;
	triggerHaptic: (style: "light" | "medium" | "heavy") => void;
}

export const ReconciliationHeader: React.FC<ReconciliationHeaderProps> = ({
	setIsMobileOpen,
	triggerHaptic,
}) => {
	return (
		<header
			className="sticky top-0 flex shrink-0 flex-col items-center justify-between gap-4 border-b border-border/60 bg-[var(--bg-1)] px-4 py-3 sm:px-6 sm:py-4 md:flex-row"
			style={{ zIndex: Z_INDEX.sticky }}
		>
			<div className="flex items-center gap-4 relative z-10 w-full md:w-auto group">
				<Button
					onClick={() => {
						triggerHaptic("light");
						setIsMobileOpen(true);
					}}
					variant="outline"
					size="icon"
					aria-label="Menú"
					className="h-9 w-9 shrink-0 rounded-xl border-border/50 bg-card hover:bg-card/80 lg:hidden"
				>
					<Menu className="h-4 w-4 text-muted-foreground" />
				</Button>
				<div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-border/60 bg-card sm:h-12 sm:w-12">
					<ArrowRightLeft
						size={20}
						className="text-primary sm:h-6 sm:w-6 opacity-80 transition-opacity group-hover:opacity-100"
						strokeWidth={1.75}
					/>
				</div>
				<div className="flex-1 min-w-0">
					<h1 className="text-lg font-semibold tracking-tight text-foreground leading-none sm:text-xl">
						Conciliación bancaria
					</h1>
					<div className="flex items-center gap-2 mt-1">
						<span className="flex items-center gap-1.5 rounded-full border border-brand/20 bg-brand/10 px-2.5 py-0.5 text-label font-medium tracking-wide text-foreground">
							<span className="h-1.5 w-1.5 rounded-full bg-brand" />
							Revisión asistida
						</span>
					</div>
				</div>
			</div>

			<div className="flex items-center gap-3 w-full md:w-auto relative z-10 justify-end">
				<StatementImportDialog />
			</div>
		</header>
	);
};
