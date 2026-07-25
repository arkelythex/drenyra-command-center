/**
 * Classifier CLI — deterministic fiscal gate for pre-commit hooks.
 *
 * Usage:
 *   node cli.ts --gate pre-commit [--cwd <path>]
 *
 * Exit codes:
 *   0 = allow (R0/R1, or R2 with valid worktree-aware human auth)
 *   2 = R2 authorization required (human must write approval file)
 *   3 = R3 blocked (always prohibited, no auth mechanism)
 *   4 = error / malformed diff / fail-closed
 *
 * Approval mechanism (worktree-aware):
 *   File: $(git rev-parse --git-path drenyra/approvals)/<HEAD_SHA>:<TREE_HASH>
 *   JSON: { schemaVersion, baseHead, treeHash, authorizedAt, authority }
 *
 *   - Bound to HEAD + tree hash (not just tree).
 *   - chmod 600.
 *   - Single-use: HEAD changes after commit, invalidating approval.
 *   - R3 never authorizable.
 *   - Agent must NOT use --no-verify (enforced by agent policy).
 *
 * Outputs JSON to stdout.
 * Stderr reserved for human-readable gate message.
 *
 * SDD-009C. No model calls. No network.
 */

import { execSync } from "node:child_process";
import {
	chmodSync,
	existsSync,
	mkdirSync,
	readFileSync,
	writeFileSync,
} from "node:fs";
import { join } from "node:path";
import type { ClassifierResult } from "./classifier";
import { classifyDiff } from "./classifier";
import { parseStagedDiff } from "./git-diff";

// ============================================================================
// Types
// ============================================================================

export const EXIT_ALLOW = 0;
export const EXIT_R2_AUTH_REQUIRED = 2;
export const EXIT_R3_BLOCKED = 3;
export const EXIT_ERROR = 4;

export type CliExitCode =
	| typeof EXIT_ALLOW
	| typeof EXIT_R2_AUTH_REQUIRED
	| typeof EXIT_R3_BLOCKED
	| typeof EXIT_ERROR;

export interface CliOutput {
	status: "allow" | "r2-auth-required" | "r3-blocked" | "error";
	exitCode: CliExitCode;
	candidateId: string;
	headSha: string;
	treeHash: string;
	classification: ClassifierResult;
	gateMessage: string;
	approvalPath: string | null;
	errors: string[];
}

// ============================================================================
// Approval schema
// ============================================================================

export const APPROVAL_SCHEMA_VERSION = 1;

export interface HumanApproval {
	schemaVersion: number;
	baseHead: string;
	treeHash: string;
	authorizedAt: string;
	authority: "human";
}

// ============================================================================
// Git helpers (worktree-aware)
// ============================================================================

function gitExec(args: string[], cwd: string): string {
	return execSync(`git ${args.join(" ")}`, {
		cwd,
		encoding: "utf-8",
		stdio: ["pipe", "pipe", "pipe"],
	} as never)
		.toString()
		.trim();
}

function getHeadSha(cwd: string): string {
	try {
		return gitExec(["rev-parse", "HEAD"], cwd);
	} catch {
		return "NO_HEAD";
	}
}

function getTreeHash(cwd: string): string {
	try {
		return gitExec(["write-tree"], cwd);
	} catch {
		return "NO_TREE";
	}
}

/**
 * Resolve the approvals directory using git rev-parse --git-path.
 * Compatible with linked worktrees where .git is a file, not a directory.
 */
function getApprovalDir(cwd: string): string {
	try {
		const gitPath = gitExec(
			["rev-parse", "--git-path", "drenyra/approvals"],
			cwd,
		);
		// git-path returns path relative to worktree root with .git/ prefix
		// Resolve to absolute path using cwd
		return join(cwd, gitPath);
	} catch {
		// Fallback for non-git directories or errors
		return join(cwd, ".git", "drenyra", "approvals");
	}
}

/**
 * Build candidate ID from HEAD sha and tree hash.
 */
function buildCandidateId(headSha: string, treeHash: string): string {
	return `${headSha}:${treeHash}`;
}

// ============================================================================
// Approval read/write
// ============================================================================

function readApproval(
	approvalDir: string,
	candidateId: string,
): HumanApproval | null {
	const filePath = join(approvalDir, candidateId);
	try {
		const raw = readFileSync(filePath, "utf-8");
		const parsed = JSON.parse(raw) as HumanApproval;
		if (parsed.schemaVersion === APPROVAL_SCHEMA_VERSION) {
			return parsed;
		}
		return null;
	} catch {
		return null;
	}
}

/**
 * Write an approval file (used by hook after human authorizes).
 * NOT called by the classifier CLI itself — the hook writes this
 * when the human provides authorization.
 */
function writeApproval(
	approvalDir: string,
	candidateId: string,
	approval: HumanApproval,
): void {
	if (!existsSync(approvalDir)) {
		mkdirSync(approvalDir, { recursive: true });
	}
	const filePath = join(approvalDir, candidateId);
	writeFileSync(filePath, JSON.stringify(approval, null, 2), "utf-8");
	chmodSync(filePath, 0o600);
}

// ============================================================================
// Auth state for fiscal-gate
// ============================================================================

interface AuthState {
	present: boolean;
	validForCandidateId: boolean;
	authorizedAt: string | null;
}

/**
 * Check if a valid human approval exists for the current HEAD+tree.
 */
function checkAuth(
	approvalDir: string,
	headSha: string,
	treeHash: string,
): AuthState {
	const candidateId = buildCandidateId(headSha, treeHash);
	const approval = readApproval(approvalDir, candidateId);

	if (!approval) {
		return { present: false, validForCandidateId: false, authorizedAt: null };
	}

	// Verify bindings
	const headMatch = approval.baseHead === headSha;
	const treeMatch = approval.treeHash === treeHash;

	if (headMatch && treeMatch) {
		return {
			present: true,
			validForCandidateId: true,
			authorizedAt: approval.authorizedAt,
		};
	}

	return { present: false, validForCandidateId: false, authorizedAt: null };
}

// ============================================================================
// CLI entry
// ============================================================================

function parseArgs(): {
	gate: string;
	cwd: string;
	authorize: string | null;
	headSha: string | null;
	treeHash: string | null;
} {
	const args = process.argv.slice(2);
	let gate = "pre-commit";
	let cwd = process.cwd();
	let authorize: string | null = null;
	let headSha: string | null = null;
	let treeHash: string | null = null;

	for (let i = 0; i < args.length; i++) {
		const arg = args[i];
		if (!arg) continue;

		if (arg === "--gate" && args[i + 1]) {
			i++;
			gate = args[i]!;
		} else if (arg === "--cwd" && args[i + 1]) {
			i++;
			cwd = args[i]!;
		} else if (arg === "--authorize" && args[i + 1]) {
			i++;
			authorize = args[i]!;
		} else if (arg === "--head-sha" && args[i + 1]) {
			i++;
			headSha = args[i]!;
		} else if (arg === "--tree-hash" && args[i + 1]) {
			i++;
			treeHash = args[i]!;
		} else if (arg === "--help") {
			process.exit(0);
		}
	}

	return { gate, cwd, authorize, headSha, treeHash };
}

function fail(
	exitCode: CliExitCode,
	message: string,
	errors: string[],
	classifierLevel: ClassifierResult["level"] = "R2",
): never {
	const _output: CliOutput = {
		status:
			exitCode === EXIT_R3_BLOCKED
				? "r3-blocked"
				: exitCode === EXIT_R2_AUTH_REQUIRED
					? "r2-auth-required"
					: "error",
		exitCode,
		candidateId: "ERROR",
		headSha: "ERROR",
		treeHash: "ERROR",
		classification: {
			level: classifierLevel,
			matchedPaths: [],
			matchedContentPatterns: [],
			blocked: true,
			ambiguous: exitCode === EXIT_ERROR,
			failClosed: exitCode === EXIT_ERROR,
			evaluatedAt: new Date().toISOString(),
			reason: message,
			diffStats: {
				addedLines: 0,
				modifiedFiles: 0,
				renamedFiles: [],
				deletedFiles: [],
			},
		},
		gateMessage: message,
		approvalPath: null,
		errors,
	};
	process.stderr.write(`${message}\n`);
	process.exit(exitCode);
}

function main(): void {
	const {
		gate,
		cwd,
		authorize,
		headSha: argHeadSha,
		treeHash: argTreeHash,
	} = parseArgs();

	// ============================================================
	// Mode: --authorize (write approval file)
	// ============================================================
	// Called by the hook when human authorization is provided.
	// Must receive both --head-sha and --tree-hash.
	// R3 candidates are NEVER authorizable.
	// File is written with chmod 600.
	if (authorize) {
		if (!argHeadSha || !argTreeHash) {
			fail(EXIT_ERROR, "Error: --authorize requiere --head-sha y --tree-hash", [
				"Missing --head-sha or --tree-hash",
			]);
		}
		if (authorize === "R3" || authorize === "r3") {
			fail(EXIT_R3_BLOCKED, "R3 nunca puede autorizarse vía --authorize", [
				"R3 authorization rejected",
			]);
		}
		try {
			const approvalDir = getApprovalDir(cwd);
			const candidateId = buildCandidateId(argHeadSha, argTreeHash);
			const approval: HumanApproval = {
				schemaVersion: APPROVAL_SCHEMA_VERSION,
				baseHead: argHeadSha,
				treeHash: argTreeHash,
				authorizedAt: new Date().toISOString(),
				authority: "human",
			};
			writeApproval(approvalDir, candidateId, approval);

			const _output: CliOutput = {
				status: "allow",
				exitCode: EXIT_ALLOW,
				candidateId,
				headSha: argHeadSha,
				treeHash: argTreeHash,
				classification: {
					level: "R2",
					matchedPaths: [],
					matchedContentPatterns: [],
					blocked: false,
					ambiguous: false,
					failClosed: false,
					evaluatedAt: new Date().toISOString(),
					reason: "Autorización humana registrada",
					diffStats: {
						addedLines: 0,
						modifiedFiles: 0,
						renamedFiles: [],
						deletedFiles: [],
					},
				},
				gateMessage: `Autorización registrada para candidato ${candidateId.slice(0, 24)}...`,
				approvalPath: join(approvalDir, candidateId),
				errors: [],
			};
			process.exit(EXIT_ALLOW);
		} catch (err) {
			const msg = err instanceof Error ? err.message : String(err);
			fail(EXIT_ERROR, `Error registrando autorización: ${msg}`, [msg]);
		}
	}

	// ============================================================
	// Gate validation
	// ============================================================
	if (gate !== "pre-commit") {
		fail(EXIT_ERROR, `Error: unsupported gate '${gate}'`, [
			`Unsupported gate: ${gate}`,
		]);
	}

	// ============================================================
	// Normal flow: parse staged diff and classify
	// ============================================================

	// Step 1: Parse staged diff
	const parsed = parseStagedDiff(cwd);
	const errors: string[] = parsed.errors.map((e) => `[${e.code}] ${e.message}`);

	// Step 2: Get HEAD sha and tree hash
	const headSha = getHeadSha(cwd);
	const treeHash = getTreeHash(cwd);
	const candidateId = buildCandidateId(headSha, treeHash);

	// Step 3: Classify
	const classification = classifyDiff(parsed.entry);

	// Step 4: Binary-only changes → fail-closed
	if (parsed.binaryFiles.length > 0 && !parsed.hadCriticalError) {
		if (
			parsed.entry.addedLines.length === 0 &&
			parsed.entry.modifiedFiles.length === 0 &&
			parsed.binaryFiles.length > 0
		) {
			classification.level = "R2";
			classification.ambiguous = true;
			classification.failClosed = true;
			classification.blocked = true;
			classification.reason =
				"Cambios solo en archivos binarios — modo fail-closed";
		}
	}

	// Step 5: Determine result based on level
	const approvalDir = getApprovalDir(cwd);

	// — R3: always blocked, no auth possible
	if (classification.level === "R3") {
		const messageLines = [
			"",
			"DRENYRA FISCAL GATE",
			"────────────────────",
			`Clasificador: R3 — OPERACIÓN RESTRINGIDA`,
		];
		if (classification.matchedPaths.length > 0) {
			messageLines.push(`Paths: ${classification.matchedPaths.join(", ")}`);
		}
		if (classification.matchedContentPatterns.length > 0) {
			messageLines.push(
				`Patrones: ${[...new Set(classification.matchedContentPatterns)].join(", ")}`,
			);
		}
		messageLines.push("Acción: R3 BLOQUEADO — prohibido");
		messageLines.push("R3 nunca puede autorizarse.");
		messageLines.push("");

		const msg = messageLines.join("\n");
		process.stderr.write(`${msg}\n`);

		const _output: CliOutput = {
			status: "r3-blocked",
			exitCode: EXIT_R3_BLOCKED,
			candidateId,
			headSha,
			treeHash,
			classification,
			gateMessage: msg,
			approvalPath: null,
			errors,
		};
		process.exit(EXIT_R3_BLOCKED);
	}

	// — Fail-closed: ambiguous or internal error
	if (classification.failClosed && classification.ambiguous) {
		const messageLines = [
			"",
			"DRENYRA FISCAL GATE",
			"────────────────────",
			`Clasificador: ${classification.level} — CLASIFICACIÓN AMBIGUA`,
			"Razón: El contenido no pudo clasificarse deterministamente",
			"Acción: BLOQUEADO — modo fail-closed",
			"",
			"Para resolver: revisa el diff manualmente.",
			"",
			`Candidate: ${candidateId}`,
		];

		const msg = messageLines.join("\n");
		process.stderr.write(`${msg}\n`);

		const _output: CliOutput = {
			status: "error",
			exitCode: EXIT_ERROR,
			candidateId,
			headSha,
			treeHash,
			classification,
			gateMessage: msg,
			approvalPath: null,
			errors,
		};
		process.exit(EXIT_ERROR);
	}

	// — R2: check human auth
	if (classification.level === "R2") {
		const authState = checkAuth(approvalDir, headSha, treeHash);

		if (
			authState.present &&
			authState.validForCandidateId &&
			authState.authorizedAt
		) {
			// Auth valid
			const messageLines = [
				"",
				"DRENYRA FISCAL GATE",
				"────────────────────",
				"Clasificador: R2 — FISCAL MATERIAL",
				`Autorización humana: VÁLIDA (candidate ${candidateId.slice(0, 24)}...)`,
				"Acción: PERMITIDO — commit autorizado",
			];
			if (classification.matchedPaths.length > 0) {
				const display = classification.matchedPaths.slice(0, 10);
				messageLines.push(`Paths: ${display.join(", ")}`);
			}
			if (classification.matchedContentPatterns.length > 0) {
				messageLines.push(
					`Patrones: ${[...new Set(classification.matchedContentPatterns)].slice(0, 8).join(", ")}`,
				);
			}
			const msg = messageLines.join("\n");
			process.stderr.write(`${msg}\n`);

			const _output: CliOutput = {
				status: "allow",
				exitCode: EXIT_ALLOW,
				candidateId,
				headSha,
				treeHash,
				classification,
				gateMessage: msg,
				approvalPath: join(approvalDir, candidateId),
				errors,
			};
			process.exit(EXIT_ALLOW);
		}

		// Auth needed
		const messageLines = [
			"",
			"DRENYRA FISCAL GATE",
			"────────────────────",
			"Clasificador: R2 — FISCAL MATERIAL",
		];
		if (classification.matchedPaths.length > 0) {
			const display = classification.matchedPaths.slice(0, 10);
			messageLines.push(`Paths: ${display.join(", ")}`);
		}
		if (classification.matchedContentPatterns.length > 0) {
			messageLines.push(
				`Patrones: ${[...new Set(classification.matchedContentPatterns)].slice(0, 8).join(", ")}`,
			);
		}
		messageLines.push(`Candidate: ${candidateId}`);
		messageLines.push("Acción: BLOQUEADO — se requiere autorización humana");
		messageLines.push("");
		messageLines.push("Para autorizar este cambio exacto (HEAD + tree hash):");
		messageLines.push(
			`  approval_dir="$(git rev-parse --git-path drenyra/approvals)"`,
		);
		messageLines.push(`  mkdir -p "$approval_dir"`);
		messageLines.push(`  cat > "$approval_dir/${candidateId}" << 'EOF'`);
		messageLines.push(
			`{ "schemaVersion": 1, "baseHead": "${headSha}", "treeHash": "${treeHash}", "authorizedAt": "${new Date().toISOString()}", "authority": "human" }`,
		);
		messageLines.push(`EOF`);
		messageLines.push(`  chmod 600 "$approval_dir/${candidateId}"`);
		messageLines.push("");
		messageLines.push(
			"Si cambia el índice o HEAD, la autorización anterior expira.",
		);

		const msg = messageLines.join("\n");
		process.stderr.write(`${msg}\n`);

		const _output: CliOutput = {
			status: "r2-auth-required",
			exitCode: EXIT_R2_AUTH_REQUIRED,
			candidateId,
			headSha,
			treeHash,
			classification,
			gateMessage: msg,
			approvalPath: join(approvalDir, candidateId),
			errors,
		};
		process.exit(EXIT_R2_AUTH_REQUIRED);
	}

	// — R0/R1: always allow
	const messageLines = [
		"",
		"DRENYRA FISCAL GATE",
		"────────────────────",
		`Clasificador: ${classification.level} — SIN RIESGO FISCAL`,
		"Acción: PERMITIDO",
	];
	const msg = messageLines.join("\n");
	process.stderr.write(`${msg}\n`);

	const _output: CliOutput = {
		status: "allow",
		exitCode: EXIT_ALLOW,
		candidateId,
		headSha,
		treeHash,
		classification,
		gateMessage: msg,
		approvalPath: null,
		errors,
	};
	process.exit(EXIT_ALLOW);
}

main();
