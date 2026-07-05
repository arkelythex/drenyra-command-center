import {
	ArrowRightLeft,
	Receipt,
	Calculator,
	Landmark,
	FileText,
	Package,
	Fingerprint,
	type LucideIcon,
} from "lucide-react";
import type { CierreMensualChecklistItem } from "@drenyra/domain";
import { ChecklistRow } from "./ChecklistRow";

const CHECKLIST_ICONS: Record<number, LucideIcon> = {
	1: ArrowRightLeft,
	2: Receipt,
	3: Receipt,
	4: Calculator,
	5: Landmark,
	6: FileText,
	7: FileText,
	8: Package,
	9: Fingerprint,
	10: Fingerprint,
};

interface ChecklistPanelProps {
	checklist: CierreMensualChecklistItem[];
}

export function ChecklistPanel({ checklist }: ChecklistPanelProps) {
	return (
		<section className="space-y-4">
			<h2 className="text-xs font-bold uppercase tracking-widest text-[var(--color-info)]">
				Checklist de Cierre
			</h2>

			<div className="space-y-2">
				{checklist
					.sort((a, b) => a.orden - b.orden)
					.map((item) => {
						const Icon = CHECKLIST_ICONS[item.orden] || FileText;
						const nextIncomplete =
							!item.completado &&
							checklist.find(
								(c) => c.orden < item.orden && !c.completado,
							) === undefined;

						return (
							<ChecklistRow
								key={item.id}
								item={item}
								icon={Icon}
								isNext={nextIncomplete}
							/>
						);
					})}
			</div>
		</section>
	);
}
