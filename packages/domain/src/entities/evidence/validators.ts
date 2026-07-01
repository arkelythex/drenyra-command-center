import type { EvidenceProps, EvidenceStatus } from "./types";

const VALID_TRANSITIONS: Record<EvidenceStatus, EvidenceStatus[]> = {
	UPLOADED: ["EXTRACTING", "REJECTED", "ERROR"],
	EXTRACTING: ["CLASSIFIED", "ERROR"],
	CLASSIFIED: ["VALIDATED", "REJECTED", "ERROR"],
	VALIDATED: ["REJECTED", "ERROR"],
	REJECTED: [],
	ERROR: [],
};

export function validateEvidenceBusinessRules(props: EvidenceProps): void {
	if (!props.filename || props.filename.trim().length === 0) {
		throw new Error("El nombre del archivo es obligatorio");
	}

	if (props.sizeBytes <= 0) {
		throw new Error("El tamaño del archivo debe ser mayor a 0");
	}

	if (!/^[0-9a-f]{64}$/.test(props.hash)) {
		throw new Error(
			`El hash SHA-256 debe ser un string hexadecimal de 64 caracteres, se recibió "${props.hash}"`,
		);
	}

	if (props.hashChain) {
		if (!/^[0-9a-f]{64}$/.test(props.hashChain.hash)) {
			throw new Error(
				"El hash del hashChain debe ser un hexadecimal de 64 caracteres",
			);
		}
		if (
			props.hashChain.prevHash !== null &&
			!/^[0-9a-f]{64}$/.test(props.hashChain.prevHash)
		) {
			throw new Error(
				"El prevHash del hashChain debe ser un hexadecimal de 64 caracteres o null",
			);
		}
	}
}

export function validateStatusTransition(
	current: EvidenceStatus,
	next: EvidenceStatus,
): void {
	const allowed = VALID_TRANSITIONS[current];

	if (!allowed) {
		throw new Error(`Estado origen desconocido: ${current}`);
	}

	if (!allowed.includes(next)) {
		throw new Error(
			`Transición inválida: ${current} → ${next}. Permisos: ${allowed.join(", ") || "ninguna"}`,
		);
	}
}
