/**
 * Fiscal Gate — evaluates classifier result and determines pre-commit action.
 *
 * SDD-009C §2.2. Does NOT call models, APIs, or network.
 * Exit codes: 0=allow, 1=block, 2=error
 */

import type { ClassifierResult } from "./classifier";

export interface HumanAuthState {
	required: boolean;
	present: boolean;
	validForTreeHash: string | null;
	authorizedAt: string | null;
}

export interface FiscalGateOutput {
	action: "allow" | "block" | "error";
	exitCode: number;
	message: string;
	decision: ClassifierResult;
	humanAuth: HumanAuthState;
}

/**
 * Evaluate fiscal gate from classifier result.
 * @param decision - classifier output
 * @param humanAuth - current human authorization state
 * @param treeHash - current git write-tree hash
 */
export function evaluateFiscalGate(
	decision: ClassifierResult,
	humanAuth: HumanAuthState,
	treeHash: string,
): FiscalGateOutput {
	const lines: string[] = [];
	lines.push("");
	lines.push("DRENYRA FISCAL GATE");
	lines.push("─".repeat(20));

	// Error / fail-closed
	if (decision.failClosed && decision.ambiguous) {
		lines.push(`Clasificador: ${decision.level} — CLASIFICACIÓN AMBIGUA`);
		lines.push(`Razón: El contenido no pudo clasificarse deterministamente`);
		lines.push(`Acción: BLOQUEADO — modo fail-closed`);
		lines.push(`Tree hash: ${treeHash}`);
		lines.push("");
		lines.push("Para resolver: revisa el diff manualmente.");
		return {
			action: "block",
			exitCode: 1,
			message: lines.join("\n"),
			decision,
			humanAuth,
		};
	}

	// R3 — always blocked
	if (decision.level === "R3") {
		lines.push(`Clasificador: R3 — OPERACIÓN RESTRINGIDA`);
		if (decision.matchedPaths.length > 0) {
			lines.push(`Paths: ${decision.matchedPaths.join(", ")}`);
		}
		if (decision.matchedContentPatterns.length > 0) {
			lines.push(
				`Patrones: ${[...new Set(decision.matchedContentPatterns)].join(", ")}`,
			);
		}
		lines.push(`Acción: BLOQUEADO — operación R3 no autorizada`);
		lines.push(`Tree hash: ${treeHash}`);
		lines.push("");
		lines.push("R3 requiere autorización humana explícita específica.");
		return {
			action: "block",
			exitCode: 1,
			message: lines.join("\n"),
			decision,
			humanAuth,
		};
	}

	// R2 — pause for human auth
	if (decision.level === "R2") {
		lines.push(`Clasificador: R2 — FISCAL MATERIAL`);

		if (decision.matchedPaths.length > 0) {
			const displayPaths = decision.matchedPaths.slice(0, 10);
			lines.push(`Paths: ${displayPaths.join(", ")}`);
			if (decision.matchedPaths.length > 10) {
				lines.push(`  ... y ${decision.matchedPaths.length - 10} más`);
			}
		}
		if (decision.matchedContentPatterns.length > 0) {
			const patterns = [...new Set(decision.matchedContentPatterns)].slice(
				0,
				8,
			);
			lines.push(`Patrones: ${patterns.join(", ")}`);
		}
		lines.push(
			`Razón: ${decision.reason || "Contenido fiscal material detectado"}`,
		);
		lines.push(`Tree hash: ${treeHash}`);

		// Check valid auth
		const authValid =
			humanAuth.present && humanAuth.validForTreeHash === treeHash;

		if (authValid) {
			lines.push(
				`Autorización humana: VÁLIDA (tree ${treeHash.slice(0, 12)}...)`,
			);
			lines.push(`Acción: PERMITIDO — commit autorizado`);
			return {
				action: "allow",
				exitCode: 0,
				message: lines.join("\n"),
				decision,
				humanAuth,
			};
		}

		lines.push(`Autorización humana: NO ENCONTRADA`);
		lines.push(`Acción: BLOQUEADO — se requiere autorización humana`);
		lines.push("");
		lines.push("Para autorizar este cambio exacto (tree hash verificado):");
		lines.push(
			`  echo 'authorize:${treeHash}' | git commit --allow-empty -F -`,
		);

		return {
			action: "block",
			exitCode: 1,
			message: lines.join("\n"),
			decision,
			humanAuth,
		};
	}

	// R0/R1 — allow
	lines.push(`Clasificador: ${decision.level} — SIN RIESGO FISCAL`);
	lines.push(`Acción: PERMITIDO`);
	return {
		action: "allow",
		exitCode: 0,
		message: lines.join("\n"),
		decision,
		humanAuth,
	};
}
