/**
 * Arbitrator Agent (Gemini Pro / GPT-5)
 * Specialized in Multi-Agent Debate and conflict resolution
 *
 * Responsibilities:
 * - Receive outputs from Reader, Parser, and Validator agents
 * - Detect conflicts and discrepancies
 * - Apply business rules and historical data
 * - Make final authoritative decisions
 * - Maintain audit trail of all decisions
 */

import { randomUUID } from "node:crypto";
import { loggers } from "../../../logger";
import type { GeminiMultiAdapter, RouterAdapter } from "../../adapters";
import type {
	ArbitrationDecision,
	ArbitratorInput,
	BaseAgent,
	InvoiceData,
} from "./types";

export class ArbitratorAgent implements BaseAgent {
	id: string;
	role = "arbitrator" as const;
	status: "idle" | "processing" | "completed" | "error" = "idle";

	private gemini: GeminiMultiAdapter;
	private routerAdapter?: RouterAdapter;

	private readonly SYSTEM_PROMPT =
		`Eres un árbitro experto en facturación electrónica SUNAT con autoridad final en resolución de conflictos.

Tu rol es recibir análisis de 3 agentes especializados y tomar la decisión final cuando hay discrepancias:

1. **Reader Agent** (Gemini Flash A): Extrae datos de imágenes/PDFs
2. **Parser Agent** (Gemini Flash B): Valida archivos XML existentes
3. **Validator Agent** (Grok): Verifica cumplimiento normativo SUNAT 2026

METODOLOGÍA DE ARBITRAJE:

1. **Consenso Directo**: Si los 3 agentes coinciden en campos críticos → APROBAR inmediatamente

2. **Conflictos Menores**: Discrepancias en campos no críticos (ej: observaciones, dirección)
   - Priorizar datos del Validator (fuente normativa)
   - Si el Validator no opina, usar Reader (fuente original)

3. **Conflictos Críticos**: Discrepancias en montos, RUCs, fechas
   - Aplicar reglas de negocio estrictas
   - Verificar cálculos matemáticos
   - Priorizar consistencia normativa

4. **Decisión REJECTED**: Cuando:
   - Conflictos irresolubles entre agentes
   - Violaciones críticas de SUNAT
   - Datos inconsistentes sin solución clara

5. **Decisión MANUAL_REVIEW**: Cuando:
   - Confianza baja en todos los agentes (<70%)
   - Conflictos en >3 campos críticos
   - Casos edge no contemplados en normativa

REGLAS DE PRIORIDAD:
- **Montos**: Validator > Parser > Reader (normativa sobre OCR)
- **RUC**: Parser > Validator > Reader (XML firmado es verdad)
- **Fechas**: Parser > Reader > Validator
- **Códigos SUNAT**: Validator (única fuente de verdad)

FORMATO DE SALIDA:
Responde SOLO en JSON:
{
  "decision": "APPROVED" | "REJECTED" | "MANUAL_REVIEW",
  "finalData": { ... InvoiceData completo ... },
  "arbitrationLog": {
    "conflicts": [ ... lista de conflictos detectados ... ],
    "resolutions": [
      {
        "conflict": { ... conflicto ... },
        "resolvedValue": valor_final,
        "reasoning": "Explicación clara de por qué elegí este valor",
        "confidence": 0.95,
        "source": "validator"
      }
    ],
    "timestamp": "2026-01-18T...",
    "arbitratorModel": "gemini-pro"
  },
  "confidence": 0.95
}`;

	constructor(gemini: GeminiMultiAdapter, routerAdapter?: RouterAdapter) {
		this.id = `arbitrator-${randomUUID()}`;
		this.gemini = gemini;
		this.routerAdapter = routerAdapter;
	}

	async process(input: ArbitratorInput): Promise<ArbitrationDecision> {
		this.status = "processing";
		const startTime = Date.now();

		try {
			loggers.ai.info("Arbitrator agent processing", {
				conflicts: input.conflicts.length,
			});

			if (input.conflicts.length === 0) {
				return this.autoApprove(input, startTime);
			}

			const prompt = this.buildPrompt(input);

			let response: import("../../types").AIResponse;
			if (this.routerAdapter) {
				response = await this.routerAdapter.callModel(prompt, {
					capability: "ANALYSIS",
					systemPrompt: this.SYSTEM_PROMPT,
				});
			} else {
				response = await this.gemini.generate({
					text: prompt,
					systemInstruction: this.SYSTEM_PROMPT,
				});
			}

			const parsed = this.parseResponse(response.content);

			const result: ArbitrationDecision = {
				...parsed,
				arbitrationLog: {
					...parsed.arbitrationLog,
					timestamp: new Date(),
					arbitratorModel: this.gemini.getInstanceId(),
				},
				processingTime: Date.now() - startTime,
			};

			this.status = "completed";
			loggers.ai.info("Arbitrator agent completed", {
				decision: result.decision,
				confidence: result.confidence,
				processingTime: result.processingTime,
			});

			return result;
		} catch (error) {
			this.status = "error";
			loggers.ai.error("Arbitrator agent failed", {
				error: error instanceof Error ? error.message : String(error),
			});
			throw error;
		}
	}

	private autoApprove(
		input: ArbitratorInput,
		startTime: number,
	): ArbitrationDecision {
		loggers.ai.info("Arbitrator auto-approve path");

		const readerPayload = input.readerOutput ?? input.reader ?? null;
		const validatorPayload = input.validatorOutput ?? input.validator ?? null;

		if (!readerPayload) {
			throw new Error("Arbitrator requires reader data for auto-approve path");
		}

		const finalData = validatorPayload?.isCompliant
			? this.extractInvoiceData(readerPayload.extractedData)
			: readerPayload.extractedData;

		return {
			decision: "APPROVED",
			finalData,
			arbitrationLog: {
				conflicts: [],
				resolutions: [],
				timestamp: new Date(),
				arbitratorModel: "auto-approve",
			},
			confidence: 1.0,
			processingTime: Date.now() - startTime,
		};
	}

	private buildPrompt(input: ArbitratorInput): string {
		const readerPayload = input.readerOutput ?? input.reader;
		const parserPayload = input.parserOutput ?? input.parser;
		const validatorPayload = input.validatorOutput ?? input.validator;

		if (!readerPayload || !parserPayload || !validatorPayload) {
			throw new Error(
				"Arbitration requires reader, parser, and validator payloads",
			);
		}

		let prompt = `# MULTI-AGENT DEBATE - RESOLUCIÓN DE CONFLICTOS\n\n`;

		prompt += `## CONFLICTOS DETECTADOS (${input.conflicts.length})\n\n`;
		prompt += `\`\`\`json\n${JSON.stringify(input.conflicts, null, 2)}\n\`\`\`\n\n`;

		prompt += `## ANÁLISIS DEL READER AGENT\n`;
		prompt += `Confianza: ${readerPayload.confidence}\n`;
		prompt += `Flags: ${readerPayload.flags.join(", ") || "ninguno"}\n`;
		prompt += `Datos extraídos:\n\`\`\`json\n${JSON.stringify(readerPayload.extractedData, null, 2)}\n\`\`\`\n\n`;

		prompt += `## ANÁLISIS DEL PARSER AGENT\n`;
		prompt += `Esquema: ${parserPayload.schemaVersion}\n`;
		prompt += `Discrepancias: ${parserPayload.discrepancies.length}\n`;
		prompt += `Necesita migración: ${parserPayload.needsMigration ? "Sí" : "No"}\n`;
		prompt += `Datos parseados:\n\`\`\`json\n${JSON.stringify(parserPayload.parsedData, null, 2)}\n\`\`\`\n\n`;

		prompt += `## ANÁLISIS DEL VALIDATOR AGENT\n`;
		prompt += `Cumplimiento: ${validatorPayload.isCompliant ? "SÍ" : "NO"}\n`;
		prompt += `Violaciones: ${validatorPayload.violations.length}\n`;
		if (validatorPayload.violations.length > 0) {
			prompt += `Detalle de violaciones:\n\`\`\`json\n${JSON.stringify(validatorPayload.violations, null, 2)}\n\`\`\`\n`;
		}
		prompt += `\n`;

		prompt += `## TU TAREA\n`;
		prompt += `Analiza los 3 análisis, resuelve cada conflicto con razonamiento claro, y toma una decisión final.\n`;
		prompt += `Recuerda: APPROVED, REJECTED, o MANUAL_REVIEW.\n`;

		return prompt;
	}

	private parseResponse(
		response: string,
	): Omit<ArbitrationDecision, "processingTime"> {
		try {
			let cleaned = response.trim();
			if (cleaned.startsWith("```json")) {
				cleaned = cleaned.replace(/```json\s*/, "").replace(/```\s*$/, "");
			} else if (cleaned.startsWith("```")) {
				cleaned = cleaned.replace(/```\s*/, "").replace(/```\s*$/, "");
			}

			const parsed = JSON.parse(cleaned);

			if (parsed.finalData?.issueDate) {
				parsed.finalData.issueDate = new Date(parsed.finalData.issueDate);
			}
			if (parsed.finalData?.dueDate) {
				parsed.finalData.dueDate = new Date(parsed.finalData.dueDate);
			}

			return parsed;
		} catch (error) {
			loggers.ai.error("Arbitrator failed to parse response");
			throw new Error(
				`Failed to parse AI response: ${error instanceof Error ? error.message : "Unknown error"}`,
			);
		}
	}

	private extractInvoiceData(extracted: InvoiceData): InvoiceData {
		return extracted;
	}

	getInfo(): { id: string; role: string; status: string } {
		return {
			id: this.id,
			role: this.role,
			status: this.status,
		};
	}
}
