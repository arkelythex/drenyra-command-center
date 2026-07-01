import type { AccountingPrProps } from "./types";

export function assertValidAccountingPrProps(props: AccountingPrProps): void {
	if (!props.title || props.title.trim().length === 0) {
		throw new Error("El título de la PR es requerido");
	}

	if (props.prNumber <= 0) {
		throw new Error("El número de PR debe ser positivo");
	}

	if (props.totalDebitCents < 0) {
		throw new Error("El total del Debe no puede ser negativo");
	}

	if (props.totalCreditCents < 0) {
		throw new Error("El total del Haber no puede ser negativo");
	}

	if (!Array.isArray(props.entries)) {
		throw new Error("Las entradas deben ser un arreglo");
	}

	if (!Array.isArray(props.evidenceIds)) {
		throw new Error("Los IDs de evidencia deben ser un arreglo");
	}

	if (!Array.isArray(props.approveSignerIds)) {
		throw new Error("Los signatarios deben ser un arreglo");
	}

	if (!Array.isArray(props.approveSignatures)) {
		throw new Error("Las firmas deben ser un arreglo");
	}
}

export function assertValidTransition(
	currentStatus: AccountingPrProps["status"],
	nextStatus: AccountingPrProps["status"],
): void {
	const transitions: Record<
		AccountingPrProps["status"],
		AccountingPrProps["status"][]
	> = {
		DRAFT: ["PENDING_REVIEW"],
		PENDING_REVIEW: ["APPROVED", "REJECTED"],
		APPROVED: ["POSTED"],
		REJECTED: [],
		POSTED: [],
	};

	const allowed = transitions[currentStatus];
	if (!allowed.includes(nextStatus)) {
		throw new Error(
			`No se puede transicionar de ${currentStatus} a ${nextStatus}`,
		);
	}
}
