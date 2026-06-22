import { Plus, Search } from "lucide-react";
import { Input } from "@/components/ui/input";

interface ProductsMobileToolbarProps {
	searchQuery: string;
	onSearchChange: (value: string) => void;
	onCreate: () => void;
}

export function ProductsMobileToolbar({
	searchQuery,
	onSearchChange,
	onCreate,
}: ProductsMobileToolbarProps) {
	return (
		<div className="px-4 py-4 border-b border-[var(--border-default)] bg-[var(--bg-1)] flex flex-col sm:hidden gap-6 z-40 relative mt-14">
			<div className="flex gap-2 w-full items-center">
				<div className="relative group flex-1">
					<Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-foreground group-focus-within:text-foreground transition-colors" />
					<Input
						value={searchQuery}
						onChange={(event) => onSearchChange(event.target.value)}
						placeholder="BUSCAR PRODUCTO..."
						className="ui-search-input w-full h-10 rounded-xl pl-10 text-label font-bold uppercase tracking-wider transition-all"
					/>
				</div>

				<div className="flex gap-2 items-center">
					<button
						onClick={onCreate}
						className="h-10 w-10 flex items-center justify-center rounded-xl bg-foreground text-background shadow-sm hover:scale-105 transition-all active:scale-95"
					>
						<Plus size={16} strokeWidth={2} />
					</button>
				</div>
			</div>
		</div>
	);
}
