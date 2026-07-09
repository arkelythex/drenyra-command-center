/**
 * Integration test: SDD pipeline with DeepSeek V4 Flash.
 *
 * Run: bun run packages/fiscal-sdd/__tests__/sdd-deepseek-integration.test.ts
 */

import type { LLMCaller } from "../src/phases/sdd-phases";
import {
	createAnalisisPhase,
	createDisenioPhase,
	createPlanPhase,
	createSolicitudPhase,
} from "../src/phases/sdd-phases";
import { FiscalSDDRunner } from "../src/runner";
import type { FiscalSDDPipeline } from "../src/types";

/** Model-agnostic: swap this function to change provider. */
const deepseekCaller: LLMCaller = async (system: string, prompt: string) => {
	const response = await fetch("https://api.deepseek.com/v1/chat/completions", {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			Authorization: `Bearer ${process.env.DEEPSEEK_API_KEY}`,
		},
		body: JSON.stringify({
			model: "deepseek-v4-flash",
			messages: [
				{ role: "system", content: system },
				{ role: "user", content: prompt },
			],
			max_tokens: 1024,
			temperature: 0.2,
		}),
	});

	if (!response.ok) {
		throw new Error(
			`DeepSeek API error: ${response.status} ${await response.text()}`,
		);
	}

	const data = await response.json();
	return data.choices[0].message.content ?? "";
};

async function main() {
	console.log("=== Pipeline de Cumplimiento Fiscal × DeepSeek V4 Flash ===\n");

	// Build pipeline with real LLM phases (fiscal naming)
	const pipeline: FiscalSDDPipeline = {
		id: "demo-igv-change",
		name: "Cambio de Tasa IGV — Demo",
		description:
			"Pipeline de cumplimiento fiscal: solicitud→análisis→diseño→plan",
		onGateBlocked: "STOP",
		phases: [
			createSolicitudPhase(deepseekCaller),
			createAnalisisPhase(deepseekCaller),
			createDisenioPhase(deepseekCaller),
			createPlanPhase(deepseekCaller),
		],
	};

	const runner = new FiscalSDDRunner();

	console.log("Ejecutando pipeline con DeepSeek V4 Flash...\n");

	const result = await runner.runPipeline(
		pipeline,
		{
			ruleType: "RATE",
			oldValue: 0.18,
			newValue: 0.19,
			regulation: "Ley N° 12345",
			description: "IGV rate change from 18% to 19%",
		},
		{
			runId: `demo-${Date.now()}`,
			metadata: {
				title: "IGV Rate Change 18% → 19%",
				regulationRef: "Ley N° 12345 - Artículo 7°",
				description:
					"Actualización de la tasa IGV del 18% al 19% según nueva norma tributaria",
			},
		},
	);

	console.log(
		`\nPipeline status: ${result.status} (${result.totalDurationMs}ms)`,
	);

	const phaseNames = pipeline.phases.map((p) => p.name);
	for (let i = 0; i < result.phaseResults.length; i++) {
		const phase = result.phaseResults[i];
		const phName = phaseNames[i] ?? `phase-${i}`;
		const output = phase.output as Record<string, unknown> | null;
		const preview = output ? JSON.stringify(output).slice(0, 200) : "(empty)";
		console.log(`\n  [${phase.status}] ${phName}:`);
		console.log(`    ${preview}...`);
		console.log(`    Confidence: ${phase.confidence}`);
		if (phase.errors.length > 0) {
			console.log(`    Errors: ${phase.errors.join("; ")}`);
		}
	}

	console.log("\n=== ✅ Pipeline ejecutado correctamente ===");
}

main().catch((err) => {
	console.error("Pipeline failed:", err);
	process.exit(1);
});
