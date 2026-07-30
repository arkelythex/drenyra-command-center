/**
 * @drenyra/pi — Pi Extension Entry Point
 *
 * Minimal extension layer that injects fiscal accounting discipline
 * into Pi's behavior. No state management — that lives in prompts/skills.
 *
 * What it provides:
 * - Fiscal persona injection (before_agent_start)
 * - Guard tools (verify_fiscal_phase, list_fiscal_phases)
 * - Tool call guards against monetary violations
 *
 * Install: See packages/pi/README.md
 */

import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { Type } from "typebox";

const FISCAL_PHASES = [
	"captura",
	"clasificacion",
	"conciliacion",
	"cierre",
	"declaracion",
	"auditoria",
];

const FISCAL_PHASE_LABELS: Record<string, string> = {
	captura: "Captura de Comprobantes",
	clasificacion: "Clasificación PCGE",
	conciliacion: "Conciliación Bancaria",
	cierre: "Cierre Contable Mensual",
	declaracion: "Declaración SUNAT",
	auditoria: "Auditoría y Cierre Fiscal",
};

const PERSONA_INSTRUCTIONS = [
	"",
	"── Fiscal Accounting Guard (by @drenyra/pi) ──",
	"Rules every agent must follow in this session:",
	"",
	"1. Money: NEVER use floats or raw numbers.",
	"   Use project's Money type or whole-number cents (soles as BigInt).",
	"2. RUC scope: Every query/mutation must verify tenant isolation.",
	"   Never access data across RUCs without explicit context.",
	"3. Phase discipline: Follow the FSD lifecycle:",
	"   captura → clasificacion → conciliacion → cierre → declaracion → auditoria",
	"4. Gates: Phase transitions require validation via verify_fiscal_phase tool.",
	"5. Audit: Every material action must be logged with RUC, periodo, timestamp.",
	"6. Cierre mensual requires human approval (R2 risk tier).",
	"7. SUNAT/UBL/IGV changes require compliance tests.",
	"",
	"Use /fsd:init to start a fiscal period, /fsd:status to check state.",
	"── ──",
].join("\n");

export default function (pi: ExtensionAPI) {
	pi.on("session_start", async (_event, ctx) => {
		ctx.ui.setStatus("drenyra-pi", "Fiscal guard active");
	});

	pi.on("before_agent_start", async (event, _ctx) => {
		return {
			systemPrompt: event.systemPrompt + "\n" + PERSONA_INSTRUCTIONS,
		};
	});

	pi.registerTool({
		name: "verify_fiscal_phase",
		label: "Verify Fiscal Phase",
		description:
			"Verify a fiscal phase transition is valid. Returns allowed transitions.",
		parameters: Type.Object({
			fromPhase: Type.String({
				description:
					"Current phase: captura, clasificacion, conciliacion, cierre, declaracion, auditoria",
			}),
			toPhase: Type.String({ description: "Target phase" }),
		}),
		async execute(_toolCallId: string, params: {
			fromPhase: string;
			toPhase: string;
		}) {
			const fromIdx = FISCAL_PHASES.indexOf(params.fromPhase);
			const toIdx = FISCAL_PHASES.indexOf(params.toPhase);

			if (fromIdx === -1) {
				return {
					content: [
						{
							type: "text" as const,
							text: `❌ Invalid phase: "${params.fromPhase}". Valid: ${FISCAL_PHASES.join(", ")}`,
						},
					],
					details: {} as Record<string, unknown>,
				};
			}
			if (toIdx === -1) {
				return {
					content: [
						{
							type: "text" as const,
							text: `❌ Invalid phase: "${params.toPhase}". Valid: ${FISCAL_PHASES.join(", ")}`,
						},
					],
					details: {} as Record<string, unknown>,
				};
			}

			const fromLabel = FISCAL_PHASE_LABELS[params.fromPhase];
			const toLabel = FISCAL_PHASE_LABELS[params.toPhase];

			if (toIdx === fromIdx + 1) {
				return {
					content: [
						{
							type: "text" as const,
							text: `✅ Valid: ${fromLabel} → ${toLabel}`,
						},
					],
					details: {
						valid: true,
						fromIdx,
						toIdx,
					} as Record<string, unknown>,
				};
			}

			const expected = FISCAL_PHASES[fromIdx + 1];
			return {
				content: [
					{
						type: "text" as const,
						text: `❌ Cannot go from ${fromLabel} to ${toLabel}. Expected next: ${expected ? FISCAL_PHASE_LABELS[expected] : "(none)"} (${expected ?? "end of cycle"})`,
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
		description: "List the FSD lifecycle phases in order.",
		parameters: Type.Object({}),
		async execute() {
			const phaseList = FISCAL_PHASES.map((id, i) => ({
				order: i + 1,
				id,
				label: FISCAL_PHASE_LABELS[id],
			}));

			const text = phaseList
				.map((p) => `${p.order}. ${p.label} (${p.id})`)
				.join("\n");

			return {
				content: [{ type: "text" as const, text }],
				details: { phases: phaseList } as Record<string, unknown>,
			};
		},
	});

	pi.on("tool_call", (event) => {
		if (event.toolName !== "edit" && event.toolName !== "write") return;

		const input =
			typeof event.input === "string"
				? event.input
				: JSON.stringify(event.input);

		if (
			/(number|amount|precio|monto|total|igv)/i.test(input) &&
			!/Money|cents|BigInt|whole/i.test(input)
		) {
			return {
				block: true,
				reason:
					"@drenyra/pi: Monetary values detected without Money type. Use BigInt (cents) or the project's Money type — never floats.",
			};
		}
	});
}
