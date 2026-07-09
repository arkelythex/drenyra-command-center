/**
 * Integration test: Fiscal Compliance Pipeline con DeepSeek V4 Flash.
 *
 * Run: bun run packages/fiscal-sdd/__tests__/compliance-deepseek-integration.test.ts
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

	// Pipeline con fases fiscales reales
	const pipeline: FiscalSDDPipeline = {
		id: "demo-cambio-igv",
		name: "Cambio de Tasa IGV",
		description: "Pipeline demo: cambio de tasa IGV de 18% a 19%",
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
			tipoCambio: "RATE",
			valorAnterior: 0.18,
			valorNuevo: 0.19,
			normativa: "Ley N° 12345",
			descripcion: "Cambio de tasa IGV de 18% a 19%",
		},
		{
			runId: `demo-${Date.now()}`,
			metadata: {
				title: "Cambio de Tasa IGV 18% → 19%",
				regulationRef: "Ley N° 12345 - Artículo 7°",
				description:
					"Actualización de la tasa IGV del 18% al 19% según nueva norma tributaria",
			},
		},
	);

	console.log(
		`\nEstado del pipeline: ${result.status} (${result.totalDurationMs}ms)`,
	);

	const phaseNames = pipeline.phases.map((p) => p.name);
	for (let i = 0; i < result.phaseResults.length; i++) {
		const phase = result.phaseResults[i];
		const phName = phaseNames[i] ?? `fase-${i}`;
		const output = phase.output as Record<string, unknown> | null;
		const preview = output ? JSON.stringify(output).slice(0, 200) : "(vacío)";
		console.log(`\n  [${phase.status}] ${phName}:`);
		console.log(`    ${preview}...`);
		console.log(`    Confianza: ${phase.confidence}`);
		if (phase.errors.length > 0) {
			console.log(`    Errores: ${phase.errors.join("; ")}`);
		}
	}

	console.log(
		"\n=== ✅ Pipeline de Cumplimiento Fiscal ejecutado correctamente ===",
	);
}

main().catch((err) => {
	console.error("Pipeline falló:", err);
	process.exit(1);
});
