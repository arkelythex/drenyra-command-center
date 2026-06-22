import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CompanyCard } from "../CompanyCard";

interface CompanyItem {
	id: string;
	ruc: string;
	businessName: string;
	tradeName?: string | null;
	isPrimary: boolean;
	isActive: boolean;
}

interface CompaniesGridProps {
	companies: CompanyItem[];
	onOpenAddModal: () => void;
}

export function CompaniesGrid({
	companies,
	onOpenAddModal,
}: CompaniesGridProps) {
	return (
		<div>
			<div className="flex items-center justify-between mb-4">
				<h2 className="text-xl font-black uppercase tracking-wider text-foreground">
					Empresas del Grupo
				</h2>
				<Button
					onClick={onOpenAddModal}
					className="bg-primary/20 hover:bg-primary/30 text-primary border border-primary/30"
				>
					<Plus className="h-4 w-4 mr-2" />
					Agregar RUC
				</Button>
			</div>

			<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
				{companies.map((company) => (
					<CompanyCard key={company.id} company={company} />
				))}

				<button
					onClick={onOpenAddModal}
					className="backdrop-blur-xl bg-card/70 border-2 border-dashed border-white/20 rounded-xl p-6 hover:bg-muted/70 hover:border-primary/50 transition-all group min-h-[200px] flex flex-col items-center justify-center"
				>
					<Plus className="h-12 w-12 text-muted-foreground group-hover:text-primary transition-colors" />
					<p className="text-sm font-black text-muted-foreground group-hover:text-primary mt-4 uppercase tracking-wider">
						Agregar RUC
					</p>
					<p className="text-xs text-muted-foreground mt-2">Sin costo adicional</p>
				</button>
			</div>
		</div>
	);
}
