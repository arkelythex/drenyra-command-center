import { Save } from "lucide-react";
import { Button } from "@/components/ui/button";

export function SettingsFooterActions() {
	return (
		<div className="overflow-hidden rounded-2xl border border-[var(--border)]/30 bg-[var(--surface)]/80 p-2">
			<div className="flex items-center justify-between">
				<span className="text-xs text-muted-foreground">
					Espacio de trabajo
				</span>
				<div className="flex gap-2">
					<Button variant="ghost" size="sm" className="text-xs">
						Descartar
					</Button>
					<Button size="sm" className="text-xs">
						<Save className="mr-1 h-3 w-3" />
						Guardar
					</Button>
				</div>
			</div>
		</div>
	);
}
