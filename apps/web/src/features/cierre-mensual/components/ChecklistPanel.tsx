import type { CierreMensualChecklistItem } from "@drenyra/domain";
import {
	ArrowRightLeft,
	Calculator,
	FileText,
	Fingerprint,
	Landmark,
	type LucideIcon,
	Package,
	Receipt,
} from "lucide-react";
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

/** The close checklist, in order. Never reorders the caller's array. */
export function ChecklistPanel({ checklist }: ChecklistPanelProps) {
	const ordered = [...checklist].sort((a, b) => a.orden - b.orden);
	const nextId = ordered.find((entry) => !entry.completado)?.id;

	return (
		<section className="space-y-3">
			<h2 id="checklist-title" className="text-base font-medium tracking-tight">
				Checklist de cierre
			</h2>
			<ol
				aria-labelledby="checklist-title"
				className="divide-y divide-border rounded-xl border border-border bg-card"
			>
				{ordered.map((item) => (
					<ChecklistRow
						key={item.id}
						item={item}
						icon={CHECKLIST_ICONS[item.orden] ?? FileText}
						isNext={item.id === nextId}
					/>
				))}
			</ol>
		</section>
	);
}
