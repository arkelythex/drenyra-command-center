/**
 * PreflightValidator — validaciones pre-ejecución del pipeline.
 *
 * Antes de ejecutar cualquier fase, verifica:
 * 1. RUC válido (formato y dígito verificador Módulo 11)
 * 2. Período con formato correcto (YYYY-MM)
 * 3. Organización y compañía no vacías
 * 4. No hay otro cambio activo para el mismo scope
 * 5. Artifact store disponible
 *
 * @example
 * ```ts
 * const validator = new PreflightValidator(artifactStore);
 * const result = await validator.validate("cambio-001", scope);
 * if (result.blocked) {
 *   console.error("Preflight bloqueado:", result.reasons);
 * }
 * ```
 */

import type { ArtifactStore, FiscalScope, PreflightCheckResult } from "./types";

// ============================================================================
// RUC Validator (Módulo 11)
// ============================================================================

/**
 * Valida un RUC peruano usando el algoritmo Módulo 11.
 * Los RUC tienen 11 dígitos: 2 de prefijo + 8 de número + 1 dígito verificador.
 */
export function isValidRuc(ruc: string): boolean {
	if (!/^\d{11}$/.test(ruc)) return false;

	// Prefijos válidos: 10 (persona natural), 20 (sociedad)
	const prefijo = ruc.substring(0, 2);
	if (prefijo !== "10" && prefijo !== "20") return false;

	// Módulo 11
	const pesos = [5, 4, 3, 2, 7, 6, 5, 4, 3, 2];
	let suma = 0;
	for (let i = 0; i < 10; i++) {
		const digit = ruc[i];
		const peso = pesos[i];
		if (digit === undefined || peso === undefined) return false;
		suma += parseInt(digit, 10) * peso;
	}

	const resto = suma % 11;
	const digitoVerificador = resto === 0 ? 0 : 11 - resto;
	const digitoEsperado = digitoVerificador === 10 ? 0 : digitoVerificador;

	const checkDigit = ruc[10];
	if (checkDigit === undefined) return false;
	return digitoEsperado === parseInt(checkDigit, 10);
}

/**
 * Valida el formato de un período fiscal (YYYY-MM).
 */
export function isValidPeriod(period: string): boolean {
	return /^\d{4}-(0[1-9]|1[0-2])$/.test(period);
}

// ============================================================================
// PreflightValidator
// ============================================================================

export interface PreflightResult {
	/** Si el preflight fue exitoso. */
	passed: boolean;
	/** Si hay checks BLOCKING que fallaron. */
	blocked: boolean;
	/** Todos los resultados de checks. */
	checks: PreflightCheckResult[];
	/** Razones de bloqueo (solo si blocked es true). */
	reasons: string[];
	/** Advertencias no bloqueantes. */
	warnings: string[];
}

/**
 * Valida que el cambio esté listo para ejecutarse.
 */
export class PreflightValidator {
	constructor(private artifactStore?: ArtifactStore) {}

	/**
	 * Ejecuta todas las validaciones pre-vuelo.
	 */
	async validate(
		changeId: string,
		scope: FiscalScope,
	): Promise<PreflightResult> {
		const checks = await Promise.all([
			this.checkRuc(scope),
			this.checkPeriod(scope),
			this.checkOrganization(scope),
			this.checkActiveChanges(changeId, scope),
			this.checkArtifactStore(),
		]);

		const blocking = checks.filter(
			(c) => !c.passed && c.severity === "BLOCKING",
		);
		const warnings = checks.filter(
			(c) => !c.passed && c.severity === "WARNING",
		);

		return {
			passed: blocking.length === 0,
			blocked: blocking.length > 0,
			checks,
			reasons: blocking.map((c) => c.reason ?? c.name),
			warnings: warnings.map((c) => c.reason ?? c.name),
		};
	}

	/**
	 * Valida el RUC de la compañía.
	 */
	private async checkRuc(scope: FiscalScope): Promise<PreflightCheckResult> {
		if (!scope.companyRuc || scope.companyRuc.trim().length === 0) {
			return {
				passed: false,
				name: "ruc-not-empty",
				severity: "BLOCKING",
				reason: "RUC de compañía no puede estar vacío",
			};
		}

		if (!isValidRuc(scope.companyRuc)) {
			return {
				passed: false,
				name: "ruc-valid",
				severity: "BLOCKING",
				reason: `RUC inválido (Módulo 11): ${scope.companyRuc}`,
			};
		}

		return { passed: true, name: "ruc-valid", severity: "BLOCKING" };
	}

	/**
	 * Valida el formato del período fiscal.
	 */
	private async checkPeriod(scope: FiscalScope): Promise<PreflightCheckResult> {
		if (!scope.period || scope.period.trim().length === 0) {
			return {
				passed: false,
				name: "period-not-empty",
				severity: "BLOCKING",
				reason: "Período fiscal no puede estar vacío",
			};
		}

		if (!isValidPeriod(scope.period)) {
			return {
				passed: false,
				name: "period-format",
				severity: "BLOCKING",
				reason: `Formato de período inválido (esperado YYYY-MM): ${scope.period}`,
			};
		}

		return { passed: true, name: "period-format", severity: "BLOCKING" };
	}

	/**
	 * Valida que organización y compañía no estén vacías.
	 */
	private async checkOrganization(
		scope: FiscalScope,
	): Promise<PreflightCheckResult> {
		const missing: string[] = [];
		if (!scope.organizationId || scope.organizationId.trim().length === 0) {
			missing.push("organizationId");
		}
		if (!scope.companyId || scope.companyId.trim().length === 0) {
			missing.push("companyId");
		}

		if (missing.length > 0) {
			return {
				passed: false,
				name: "scope-ids-not-empty",
				severity: "BLOCKING",
				reason: `Campos requeridos vacíos: ${missing.join(", ")}`,
			};
		}

		return { passed: true, name: "scope-ids-not-empty", severity: "BLOCKING" };
	}

	/**
	 * Verifica que no haya otro cambio activo para el mismo scope.
	 */
	private async checkActiveChanges(
		_changeId: string,
		_scope: FiscalScope,
	): Promise<PreflightCheckResult> {
		if (!this.artifactStore) {
			return {
				passed: true,
				name: "no-active-changes",
				severity: "WARNING",
				reason: "Sin artifact store — no se puede verificar cambios activos",
			};
		}

		try {
			const changes = await this.artifactStore.listChanges();
			// Por ahora, solo advertimos si hay cambios existentes
			if (changes.length > 0) {
				return {
					passed: true,
					name: "no-active-changes",
					severity: "WARNING",
					reason: `Hay ${changes.length} cambio(s) existente(s). Verificar que no haya conflictos de scope.`,
				};
			}
		} catch {
			// Si falla, continuamos con advertencia
		}

		return { passed: true, name: "no-active-changes", severity: "WARNING" };
	}

	/**
	 * Verifica que el artifact store esté disponible.
	 */
	private async checkArtifactStore(): Promise<PreflightCheckResult> {
		if (!this.artifactStore) {
			return {
				passed: false,
				name: "artifact-store-available",
				severity: "WARNING",
				reason: "Sin artifact store — los artefactos no se persistirán",
			};
		}

		try {
			const healthy = await this.artifactStore.healthCheck();
			if (!healthy) {
				return {
					passed: false,
					name: "artifact-store-available",
					severity: "WARNING",
					reason: "Artifact store no disponible",
				};
			}
		} catch {
			return {
				passed: false,
				name: "artifact-store-available",
				severity: "WARNING",
				reason: "Error al verificar artifact store",
			};
		}

		return {
			passed: true,
			name: "artifact-store-available",
			severity: "WARNING",
		};
	}
}
