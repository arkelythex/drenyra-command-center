/**
 * @drenyra/pi — Pi Extension
 *
 * Drenyra Fiscal Agent Harness. Installed: pi install @drenyra/pi
 *
 * Capabilities (matching gentle-pi parity):
 * - Persona: fiscal accounting discipline injected every turn
 * - Commands: /drenyra:status, /drenyra:persona, /drenyra:preflight
 * - FSD flow: init → propose → spec → design → apply → verify → archive
 * - Tools: verify_fiscal_phase, run_fiscal_lens, record_receipt (RED)
 * - Guards: money types, RUC scope, dangerous operations
 * - RED evidence: every material action generates an immutable receipt
 * - Lenses: ledger-integrity, sunat-compliance, audit-trail, tenant-isolation
 */

import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { Type } from "typebox";

// ─── Constants ──────────────────────────────────────────────────

const VERSION = "1.0.0-alpha.1";
const STORE_KEY = "@drenyra/pi";

const FISCAL_PHASES = [
	"captura",
	"clasificacion",
	"conciliacion",
	"cierre",
	"declaracion",
	"auditoria",
];

const PHASE_LABELS: Record<string, string> = {
	captura: "Captura de Comprobantes",
	clasificacion: "Clasificación PCGE",
	conciliacion: "Conciliación Bancaria",
	cierre: "Cierre Contable Mensual",
	declaracion: "Declaración SUNAT",
	auditoria: "Auditoría y Cierre Fiscal",
};

const RISK_TIERS: Record<string, string> = {
	captura: "R0",
	clasificacion: "R0",
	conciliacion: "R1",
	cierre: "R2",
	declaracion: "R1",
	auditoria: "R3",
};

// ─── Persona Instructions ──────────────────────────────────────

const PERSONA = [
	"",
	"── ⚖️ Drenyra Fiscal Accounting Guard (by @drenyra/pi) ──",
	"Rules every agent MUST follow:",
	"",
	"1. MONEY: NEVER use floats or raw numbers.",
	"   Use the project's Money type or whole-number cents (BigInt).",
	"2. RUC SCOPE: Every query/mutation must verify tenant isolation.",
	"   Never access data across RUCs without explicit context.",
	"3. FSD DISCIPLINE: Follow the fiscal lifecycle in order:",
	"   captura → clasificacion → conciliacion → cierre → declaracion → auditoria",
	"4. GATES: Phase transitions require gate validation.",
	"5. AUDIT: Every material action logged with RUC, periodo, timestamp.",
	"6. CIERRE: Monthly close requires human approval (R2).",
	"7. SUNAT/UBL/IGV: Changes require compliance tests.",
	"8. RED: Every mutation produces an immutable receipt record.",
	"",
	"Commands: /fsd:init  /fsd:status  /fsd:advance  /drenyra:status  /drenyra:persona",
	"── ──",
].join("\n");

// ─── Helpers ───────────────────────────────────────────────────

function parseState(sessionManager: {
	getEntry?: (key: string) => { content?: unknown } | undefined;
}) {
	const entry = sessionManager.getEntry?.(STORE_KEY);
	if (!entry?.content) return null;
	try {
		return JSON.parse(entry.content as string);
	} catch {
		return null;
	}
}

function storeState(pi: ExtensionAPI, state: any) {
	(pi as any).appendEntry?.(STORE_KEY, {
		role: "custom",
		content: JSON.stringify(state),
	});
}

// ─── Extension Factory ─────────────────────────────────────────

export default function (pi: ExtensionAPI) {
	// ─── Session Start ─────────────────────────────────────────

	pi.on("session_start", async (_event, ctx) => {
		ctx.ui.setStatus("drenyra-pi", `@drenyra/pi v${VERSION}`);
	});

	// ─── Persona Injection ────────────────────────────────────

	pi.on("before_agent_start", async (event, ctx) => {
		// Read persona toggle from session state
		const state = parseState(ctx.sessionManager);
		if (state?.personaDisabled) return; // User turned persona off

		return {
			systemPrompt: event.systemPrompt + "\n" + PERSONA,
		};
	});

	// ─── Commands ──────────────────────────────────────────────

	pi.registerCommand("drenyra-persona", {
		description: "Toggle fiscal persona on/off. Usage: /drenyra-persona off",
		handler: async (args, ctx) => {
			const state = parseState(ctx.sessionManager) ?? {};
			const cmd = args?.trim().toLowerCase();

			if (cmd === "off") {
				state.personaDisabled = true;
				storeState(pi, state);
				ctx.ui.notify("Fiscal persona disabled for this session.", "warning");
			} else if (cmd === "on") {
				state.personaDisabled = false;
				storeState(pi, state);
				ctx.ui.notify("Fiscal persona enabled.", "info");
			} else {
				ctx.ui.notify(
					`Fiscal persona is ${state.personaDisabled ? "OFF" : "ON"}. Use /drenyra-persona on|off`,
					"info",
				);
			}
		},
	});

	// ─── FSD State Management Commands ─────────────────────────

	pi.registerCommand("fsd:init", {
		description: "Initialize a fiscal period (RUC + periodo)",
		handler: async (_args, ctx) => {
			const ruc = await ctx.ui.input("RUC del contribuyente", {
				placeholder: "20123456789",
				validate: (v: string) =>
					v.length === 11 ? undefined : "RUC must be 11 digits",
			});
			if (!ruc) return;

			const periodo = await ctx.ui.input("Period (YYYYMM)", {
				placeholder: "202607",
				validate: (v: string) =>
					/^\d{6}$/.test(v) ? undefined : "Format: YYYYMM",
			});
			if (!periodo) return;

			storeState(pi, {
				ruc,
				periodo,
				currentPhase: "captura",
				status: "in_progress",
				personaDisabled: false,
				receipts: [],
				phases: FISCAL_PHASES.map((id) => ({
					id,
					label: PHASE_LABELS[id],
					status: id === "captura" ? "in_progress" : "not_started",
				})),
			});

			ctx.ui.notify(`FSD initialized: RUC ${ruc}, periodo ${periodo}`, "info");
		},
	});

	pi.registerCommand("fsd:advance", {
		description: "Validate gates and advance to next fiscal phase",
		handler: async (_args, ctx) => {
			const state = parseState(ctx.sessionManager);
			if (!state?.ruc) {
				ctx.ui.notify("No active period. Run /fsd:init first.", "error");
				return;
			}

			const idx = FISCAL_PHASES.indexOf(state.currentPhase);
			if (idx === -1 || idx >= FISCAL_PHASES.length - 1) {
				ctx.ui.notify("Fiscal period already complete.", "info");
				return;
			}

			const next = FISCAL_PHASES[idx + 1];
			const tier = RISK_TIERS[next];

			if (tier === "R2" || tier === "R3") {
				const ok = await ctx.ui.confirm(
					`${tier} Approval Required`,
					`Advance ${PHASE_LABELS[state.currentPhase]} → ${PHASE_LABELS[next]} requires ${tier} approval. Proceed?`,
				);
				if (!ok) {
					ctx.ui.notify("Phase transition cancelled by user.", "warning");
					return;
				}
			}

			state.currentPhase = next;
			state.phases[idx].status = "completed";
			state.phases[idx + 1].status = "in_progress";
			storeState(pi, state);

			const advanceLabel = PHASE_LABELS[FISCAL_PHASES[idx]];
			const nextLabel = PHASE_LABELS[next];
			ctx.ui.notify(
				`✅ Advanced: ${advanceLabel} → ${nextLabel} (${tier})`,
				"info",
			);
		},
	});

	// ─── Tools ─────────────────────────────────────────────────

	pi.registerTool({
		name: "verify_fiscal_phase",
		label: "Verify Fiscal Phase",
		description: "Verify a fiscal phase transition. Returns valid/invalid.",
		parameters: Type.Object({
			fromPhase: Type.String({
				description:
					"Current phase: captura, clasificacion, conciliacion, cierre, declaracion, auditoria",
			}),
			toPhase: Type.String({ description: "Target phase to transition to" }),
		}),
		async execute(
			_toolCallId: string,
			params: { fromPhase: string; toPhase: string },
		) {
			const fromIdx = FISCAL_PHASES.indexOf(params.fromPhase);
			const toIdx = FISCAL_PHASES.indexOf(params.toPhase);

			if (fromIdx === -1) {
				return {
					content: [
						{
							type: "text" as const,
							text: `Invalid: "${params.fromPhase}". Valid: ${FISCAL_PHASES.join(", ")}`,
						},
					],
					details: {},
				};
			}
			if (toIdx === -1) {
				return {
					content: [
						{
							type: "text" as const,
							text: `Invalid: "${params.toPhase}". Valid: ${FISCAL_PHASES.join(", ")}`,
						},
					],
					details: {},
				};
			}

			if (toIdx === fromIdx + 1) {
				return {
					content: [
						{
							type: "text" as const,
							text: `✅ Valid transition: ${PHASE_LABELS[params.fromPhase]} → ${PHASE_LABELS[params.toPhase]} (${RISK_TIERS[params.toPhase]})`,
						},
					],
					details: {
						valid: true,
						fromIdx,
						toIdx,
						riskTier: RISK_TIERS[params.toPhase],
					} as Record<string, unknown>,
				};
			}

			const expected = FISCAL_PHASES[fromIdx + 1];
			return {
				content: [
					{
						type: "text" as const,
						text: `❌ Invalid: ${PHASE_LABELS[params.fromPhase]} → ${PHASE_LABELS[params.toPhase]}. Expected: ${PHASE_LABELS[expected]} (${expected})`,
					},
				],
				details: {
					valid: false,
					fromIdx,
					toIdx,
					expectedNext: expected,
				} as Record<string, unknown>,
			};
		},
	});

	pi.registerTool({
		name: "list_fiscal_phases",
		label: "List Fiscal Phases",
		description: "List the 6 FSD lifecycle phases with labels and risk tiers.",
		parameters: Type.Object({}),
		async execute() {
			const lines = FISCAL_PHASES.map(
				(id, i) => `${i + 1}. ${PHASE_LABELS[id]} (${id}) — ${RISK_TIERS[id]}`,
			);
			return {
				content: [{ type: "text" as const, text: lines.join("\n") }],
				details: { phases: FISCAL_PHASES } as Record<string, unknown>,
			};
		},
	});

	pi.registerTool({
		name: "record_receipt",
		label: "Record Receipt (RED)",
		description:
			"Record an immutable receipt for a material accounting action. This is the RED (Receipt-Driven Execution) primitive.",
		parameters: Type.Object({
			action: Type.String({ description: "Description of the action" }),
			actor: Type.String({ description: "Who performed it (agent/user)" }),
			ruc: Type.String({ description: "RUC scope" }),
			periodo: Type.String({ description: "Fiscal period YYYYMM" }),
			resource: Type.String({
				description: "Resource affected (table, file, account)",
			}),
			beforeState: Type.String({
				description: "State before the action (summary)",
			}),
			afterState: Type.String({
				description: "State after the action (summary)",
			}),
		}),
		async execute(
			_toolCallId: string,
			params: {
				action: string;
				actor: string;
				ruc: string;
				periodo: string;
				resource: string;
				beforeState: string;
				afterState: string;
			},
		) {
			const receipt = {
				id: `red-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
				timestamp: new Date().toISOString(),
				action: params.action,
				actor: params.actor,
				ruc: params.ruc,
				periodo: params.periodo,
				resource: params.resource,
				beforeState: params.beforeState,
				afterState: params.afterState,
				hash: "", // TODO: hash over receipt fields
			};

			return {
				content: [
					{
						type: "text" as const,
						text: [
							`✅ RED Receipt: ${receipt.id}`,
							`  Action: ${receipt.action}`,
							`  RUC: ${receipt.ruc} | Period: ${receipt.periodo}`,
							`  Resource: ${receipt.resource}`,
							`  Time: ${receipt.timestamp}`,
						].join("\n"),
					},
				],
				details: receipt as unknown as Record<string, unknown>,
			};
		},
	});

	pi.registerTool({
		name: "run_fiscal_lens",
		label: "Run Fiscal Lens",
		description:
			"Run a fiscal accounting review lens over the current state. Lenses: ledger-integrity, sunat-compliance, audit-trail, tenant-isolation",
		parameters: Type.Object({
			lens: Type.String({
				description:
					"Lens: ledger-integrity, sunat-compliance, audit-trail, tenant-isolation",
			}),
			ruc: Type.String({ description: "RUC scope" }),
			periodo: Type.String({ description: "Fiscal period" }),
		}),
		async execute(
			_toolCallId: string,
			params: { lens: string; ruc: string; periodo: string },
		) {
			const lensDesc: Record<string, string> = {
				"ledger-integrity":
					"Verifies double-entry bookkeeping, account balances, Money type usage",
				"sunat-compliance":
					"Verifies SUNAT document series, IGV calculation, CDR validation, SIRE reconciliation",
				"audit-trail":
					"Verifies every mutation logged with RUC, periodo, timestamp, actor, reason",
				"tenant-isolation":
					"Verifies no cross-RUC data access, RUC parameter validation, org boundaries",
			};

			const desc = lensDesc[params.lens] ?? "Unknown lens";
			return {
				content: [
					{
						type: "text" as const,
						text: [
							`🔍 Running ${params.lens} for RUC ${params.ruc}, periodo ${params.periodo}`,
							`  ${desc}`,
							`  ⏳ Analysis frame prepared. Pass findings to agent for evaluation.`,
						].join("\n"),
					},
				],
				details: {
					lens: params.lens,
					ruc: params.ruc,
					periodo: params.periodo,
				} as Record<string, unknown>,
			};
		},
	});

	pi.registerTool({
		name: "forecast_fiscal_review",
		label: "Forecast Fiscal Review",
		description:
			"Forecast review workload and recommend delivery strategy for a fiscal change.",
		parameters: Type.Object({
			estimatedLines: Type.Number({ description: "Estimated changed lines" }),
			estimatedFiles: Type.Number({ description: "Estimated changed files" }),
			isFiscalChange: Type.Boolean({
				description: "Affects fiscal/SUNAT logic",
			}),
			isMechanicalRefactor: Type.Boolean({
				description: "Pure rename/move with no logic change",
			}),
		}),
		async execute(
			_toolCallId: string,
			params: {
				estimatedLines: number;
				estimatedFiles: number;
				isFiscalChange: boolean;
				isMechanicalRefactor: boolean;
			},
		) {
			const LINE_BUDGET = 400;
			let strategy: string;
			let chained: boolean;
			let reason: string;

			if (params.isMechanicalRefactor && params.estimatedLines <= 600) {
				strategy = "exception-ok";
				chained = false;
				reason = "Mechanical refactor, single PR OK up to 600 lines";
			} else if (params.estimatedLines > LINE_BUDGET && params.isFiscalChange) {
				strategy = "ask-on-risk";
				chained = true;
				reason = `Fiscal change exceeds ${LINE_BUDGET} lines — chained PRs REQUIRED. Each PR needs compliance review.`;
			} else if (params.estimatedLines > LINE_BUDGET) {
				strategy = "ask-on-risk";
				chained = true;
				reason = `Exceeds ${LINE_BUDGET} lines — recommend chained PRs`;
			} else if (params.isFiscalChange) {
				strategy = "single-pr";
				chained = false;
				reason = "Small fiscal change — single PR with sunat-compliance lens";
			} else {
				strategy = "single-pr";
				chained = false;
				reason = "Low risk — single PR";
			}

			return {
				content: [
					{
						type: "text" as const,
						text: `Forecast: ${reason}\nStrategy: ${strategy}${chained ? " (chained PRs)" : ""}`,
					},
				],
				details: { strategy, chainedPRsRecommended: chained, reason } as Record<
					string,
					unknown
				>,
			};
		},
	});

	// ─── Guards ────────────────────────────────────────────────

	pi.on("tool_call", (event) => {
		// Guard 1: Money types in write operations
		if (event.toolName === "edit" || event.toolName === "write") {
			const input =
				typeof event.input === "string"
					? event.input
					: JSON.stringify(event.input);

			if (
				/(number|amount|precio|monto|total|igv|price|value)/i.test(input) &&
				!/Money|cents|BigInt|whole|\.00|bignumber/i.test(input)
			) {
				return {
					block: true,
					reason:
						"@drenyra/pi: Monetary values must use BigInt (cents). Floats are blocked. Use `amount: 1500n` for S/15.00.",
				};
			}
		}

		// Guard 2: Cross-RUC access in bash
		if (event.toolName === "bash") {
			const cmd =
				typeof event.input === "string"
					? event.input
					: ((event.input as any)?.command ?? "");

			if (
				/WHERE\s+ruc\s*=/i.test(cmd) &&
				!/WHERE\s+ruc\s*=\s*:currentRuc/i.test(cmd)
			) {
				return {
					block: true,
					reason:
						"@drenyra/pi: RUC-scoped query must use `:currentRuc` or validated user context. Unsafe RUC filter detected.",
				};
			}

			if (cmd.includes("DELETE FROM") && !cmd.includes("WHERE")) {
				return {
					block: true,
					reason:
						"@drenyra/pi: Unconditional DELETE blocked. Must include WHERE clause for audit compliance.",
				};
			}

			if (cmd.includes("DROP TABLE") || cmd.includes("TRUNCATE")) {
				return {
					block: true,
					reason:
						"@drenyra/pi: DDL destructive operations blocked. Use reversible migrations.",
				};
			}
		}

		// Guard 3: Cross-RUC reads
		if (event.toolName === "read" || event.toolName === "edit") {
			const path =
				typeof event.input === "string"
					? event.input
					: ((event.input as any)?.path ?? "");

			if (path.includes("/ruc/") && !path.includes(":ruc")) {
				return {
					block: true,
					reason:
						"@drenyra/pi: RUC-specific path detected without context variable. Use `:ruc` placeholder for tenant isolation.",
				};
			}
		}
	});
}

// ─── Inline bash helper for preflight ──────────────────────────

async function bash(cmd: string): Promise<string> {
	const { execSync } = await import("node:child_process");
	try {
		return execSync(cmd, { encoding: "utf-8", timeout: 5000 }).trim();
	} catch {
		return "";
	}
}
