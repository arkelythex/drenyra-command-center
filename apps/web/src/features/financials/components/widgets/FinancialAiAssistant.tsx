import { Send, Sparkles, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface FinancialAiAssistantProps {
	isOpen: boolean;
	onClose: () => void;
	query: string;
	setQuery: (q: string) => void;
}

export const FinancialAiAssistant = ({
	isOpen,
	onClose,
	query,
	setQuery,
}: FinancialAiAssistantProps) => {
	return (
		<aside
			className={cn(
				"absolute inset-y-0 right-0 z-50 w-full sm:w-96 bg-background border-l border-border transition-transform duration-200 lg:relative lg:translate-x-0 shadow-xl lg:shadow-none ",
				isOpen ? "translate-x-0" : "translate-x-full lg:translate-x-0",
			)}
		>
			<div className="p-8 border-b border-border/50 flex items-center justify-between bg-muted/10">
				<div className="flex items-center gap-4">
					<div className="h-10 w-10 rounded-xl bg-foreground text-background flex items-center justify-center shadow-sm">
						<Sparkles size={20} strokeWidth={2.5} />
					</div>
					<div>
						<span className="font-black text-xs uppercase tracking-widest text-foreground">
							Assistant Core
						</span>
						<p className="text-2xs font-bold text-muted-foreground uppercase tracking-widest">
							Drenyra Intelligence
						</p>
					</div>
				</div>
				<button
					type="button"
					className="p-2 text-muted-foreground hover:text-foreground transition-colors duration-150 lg:hidden"
					onClick={onClose}
				>
					<X size={20} />
				</button>
			</div>

			<div className="flex-1 overflow-y-auto p-8 space-y-10 no-scrollbar">
				{/* AI Response Example */}
				<div className="flex flex-col items-start animate-in fade-in slide-in-from-left-1 duration-150">
					<div className="bg-muted/30 border border-border rounded-[1.5rem] rounded-tl-none p-6 space-y-5 shadow-sm">
						<p className="text-[13px] font-medium leading-relaxed text-foreground/80">
							El flujo operativo se mantiene sólido. Sin embargo, la inversión
							en activos fijos de este periodo ha impactado la liquidez neta.
						</p>
						<div className="pt-4 border-t border-border/50">
							<span className="text-2xs font-black uppercase tracking-[0.2em] text-foreground cursor-pointer border-b border-foreground hover:opacity-60 transition-opacity duration-150">
								Ver desglose NIIF
							</span>
						</div>
					</div>
				</div>
			</div>

			{/* Input Block */}
			<div className="p-8 border-t border-border/50 bg-muted/5">
				<div className="relative group">
					<Input
						placeholder="Analizar estados..."
						className="pr-14 h-14 bg-muted/20 border-border rounded-xl text-[13px] font-bold uppercase tracking-tight shadow-inner"
						value={query}
						onChange={(e) => setQuery(e.target.value)}
					/>
					<Button
						size="icon"
						aria-label="Enviar"
						className="absolute right-2 top-2 h-10 w-10 shadow-sm"
					>
						<Send size={18} />
					</Button>
				</div>
			</div>
		</aside>
	);
};
