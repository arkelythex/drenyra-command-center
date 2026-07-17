/**
 * Drenyra FD — Demo del Fiscal-Driven Workflow
 *
 * Inspirado en gentle-orchestrator.
 * Donde gentle-orchestrator procesa SDD phases para software,
 * DrenyraOrchestrator procesa FD phases para contabilidad.
 *
 * Escenarios:
 *   1. Factura de bajo monto (< S/ 100) → T1 Advisory → automático
 *   2. Factura de monto medio (S/ 1,000 - S/ 10,000) → T2 Strong → con compliance
 *   3. Operación de alto valor (> S/ 10,000) → T3 Critical → requiere humano
 *
 * Para ejecutar:
 *   cd labs/mastra-poc
 *   bun install
 *   bun run src/basic-workflow.ts
 */

import {
	DrenyraOrchestrator,
	type FiscalDocument,
	type Tenant,
} from "./orchestrator/drenyra-orchestrator";
import { evidenceGraph } from "./orchestrator/evidence-graph";

async function main() {
	const drenyra = new DrenyraOrchestrator();
	const tenant: Tenant = {
		companyId: "comp-123",
		ruc: "20546296564",
		userId: "user-456",
		organizationId: "org-789",
		period: "202603",
	};

	const invoiceLow: FiscalDocument = {
		id: "F001-123",
		type: "invoice",
		format: "xml",
		content: "base64-xml-content...",
		metadata: {
			amount: 5000, // S/ 50 en céntimos
			rucEmisor: "20123456789",
			rucReceptor: tenant.ruc,
			serie: "F001",
			numero: "123",
			igv: 900,
		},
	};

	const result1 = await drenyra.process({
		document: invoiceLow,
		tenant,
	});

	printResult("ESCENARIO 1", result1);

	const invoiceService: FiscalDocument = {
		id: "F001-456",
		type: "invoice",
		format: "xml",
		content: "base64-xml-content...",
		metadata: {
			amount: 500_000, // S/ 5,000 en céntimos
			rucEmisor: "20123456789",
			rucReceptor: tenant.ruc,
			serie: "F001",
			numero: "456",
			description: "Servicio de consultoría",
			operationType: "servicio",
		},
	};

	const result2 = await drenyra.process({
		document: invoiceService,
		tenant,
	});

	printResult("ESCENARIO 2", result2);

	const invoiceHigh: FiscalDocument = {
		id: "F001-789",
		type: "invoice",
		format: "xml",
		content: "base64-xml-content...",
		metadata: {
			amount: 2_500_000, // S/ 25,000 en céntimos
			rucEmisor: "20123456789",
			rucReceptor: tenant.ruc,
			serie: "F001",
			numero: "789",
			description: "Construcción de local comercial",
			operationType: "construccion",
		},
	};

	const result3 = await drenyra.process({
		document: invoiceHigh,
		tenant,
	});

	printResult("ESCENARIO 3", result3);
	const allEvidence = evidenceGraph.getAll();
	for (const entry of allEvidence) {
		if (entry.fiscalContext?.period) {
		}
	}
	const _audit = evidenceGraph.exportAudit({ ruc: tenant.ruc });
}

function printResult(
	_scenario: string,
	result: ReturnType<DrenyraOrchestrator["process"]> extends Promise<infer T>
		? T
		: never,
) {
	for (const step of result.steps) {
		const _icon =
			step.status === "completed"
				? "✅"
				: step.status === "escalated"
					? "⏸️"
					: step.status === "blocked"
						? "🚫"
						: step.status === "error"
							? "❌"
							: "⏭️";
	}
}

main().catch(console.error);
