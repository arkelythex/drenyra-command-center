import type { OrganizationProps, OrganizationStatus } from "./types";

const RUC_REGEX = /^\d{11}$/;
const SLUG_REGEX = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

function validateRUCChecksum(ruc: string): boolean {
	if (ruc.length !== 11) return false;
	const multiplicadores = [5, 4, 3, 2, 7, 6, 5, 4, 3, 2];
	let suma = 0;
	for (let i = 0; i < 10; i++) {
		suma += Number(ruc[i] ?? "") * (multiplicadores[i] ?? 0);
	}
	const residuo = suma % 11;
	const digitoVerificador = residuo === 0 ? 0 : 11 - residuo;
	return Number(ruc[10]) === digitoVerificador;
}

export function validateOrganizationBusinessRules(
	props: OrganizationProps,
): void {
	if (!props.name || props.name.trim().length === 0) {
		throw new Error("Organization name is required");
	}

	if (!RUC_REGEX.test(props.ruc)) {
		throw new Error("RUC must be exactly 11 digits");
	}

	if (!validateRUCChecksum(props.ruc)) {
		throw new Error("RUC checksum validation failed");
	}

	if (!SLUG_REGEX.test(props.slug)) {
		throw new Error("Slug must be in kebab-case format");
	}

	if (props.status === "ACTIVE" && typeof props.healthScore === "number") {
		if (props.healthScore < 0 || props.healthScore > 100) {
			throw new Error("Health score must be between 0 and 100");
		}
	}
}

export function validateStatusTransition(
	current: OrganizationStatus,
	target: OrganizationStatus,
): void {
	const allowed: Record<OrganizationStatus, OrganizationStatus[]> = {
		ACTIVE: ["SUSPENDED", "INACTIVE"],
		SUSPENDED: ["ACTIVE", "INACTIVE"],
		INACTIVE: ["ACTIVE"],
	};

	if (!allowed[current]?.includes(target)) {
		throw new Error(`Cannot transition from "${current}" to "${target}"`);
	}
}
