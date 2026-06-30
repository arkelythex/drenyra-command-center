import type { CierreMensual } from "@arkelythex/domain";
import { calculateCierreProgress } from "@arkelythex/domain";

const SIRE_CHECKLIST_LABEL_MARKERS = [
	"Validación SIRE Compras",
	"Validación SIRE Ventas",
] as const;

function isSireChecklistItem(label: string): boolean {
	return SIRE_CHECKLIST_LABEL_MARKERS.some((marker) => label.includes(marker));
}

/**
 * Marks SIRE cierre checklist items complete when a diff commit audit exists for the period.
 */
export function applySireDiffCommitChecklistGate(
	cierre: CierreMensual,
	hasDiffCommitAudit: boolean,
): CierreMensual {
	if (!hasDiffCommitAudit) {
		return cierre;
	}

	let changed = false;
	const checklist = cierre.checklist.map((item) => {
		if (!isSireChecklistItem(item.label) || item.completado) {
			return item;
		}
		changed = true;
		return { ...item, completado: true };
	});

	const progress = calculateCierreProgress(checklist);
	const sireStatus = "CONCILIADO" as const;

	if (
		!changed &&
		cierre.sireStatus === sireStatus &&
		cierre.progress === progress
	) {
		return cierre;
	}

	return {
		...cierre,
		checklist,
		progress,
		sireStatus,
	};
}
