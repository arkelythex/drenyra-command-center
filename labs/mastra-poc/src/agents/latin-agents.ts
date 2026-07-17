/**
 * Latin Agents — Drenyra's 8 domain agents como Mastra Agents.
 *
 * Reemplaza la jerarquía custom de agent-swarm/erp/drenyra/swarm/domain-agent.ts
 * por Mastra Agent nativo. Cada Latin Agent tiene tools específicas
 * y puede ser usado de forma independiente o dentro del workflow Supervisor.
 *
 * Latin Moderno (8 arquetipos):
 *   cerno   — ver/discernir (análisis fiscal)
 *   custos  — guardián (compliance)
 *   necto   — conectar (integración)
 *   regula  — regla (reglas de negocio)
 *   lumen   — luz (insights)
 *   fusio   — fusionar (data fusion)
 *   scripta — escribir (reportes)
 *   capsa   — caja (almacenamiento/documentos)
 */

import { anthropic, openai } from "@ai-sdk/provider";
import { Agent } from "@mastra/core";
import type { FiscalTools } from "../tools/fiscal-tools";
import { fiscalTools } from "../tools/fiscal-tools";

// ─── Config ───────────────────────────────────────────────

export interface LatinAgentConfig {
	id: LatinAgentId;
	name: string;
	description: string;
	instructions: string;
	model?:
		| "claude-sonnet"
		| "gpt-4o"
		| "gemini-pro"
		| "claude-haiku"
		| "gpt-mini";
	tools?: Partial<FiscalTools>;
}

export type LatinAgentId =
	| "cerno"
	| "custos"
	| "necto"
	| "regula"
	| "lumen"
	| "fusio"
	| "scripta"
	| "capsa";

// ─── Factory ──────────────────────────────────────────────

export function createLatinAgent(config: LatinAgentConfig): Agent {
	// Model selection — completamente agnóstico
	const modelMap = {
		"claude-sonnet": anthropic("claude-sonnet-4-20250514"),
		"gpt-4o": openai("gpt-4o"),
		"gemini-pro": openai("gpt-4o"), // fallback, usar @ai-sdk/google en real
		"claude-haiku": anthropic("claude-3-5-haiku-latest"),
		"gpt-mini": openai("gpt-4.1-mini"),
	};

	return new Agent({
		name: config.name,
		instructions: config.instructions,
		model: modelMap[config.model ?? "claude-sonnet"],
		tools: config.tools ?? {},
	});
}

// ─── Agent Definitions ────────────────────────────────────

/**
 * cerno — Análisis Fiscal
 * Evalúa transacciones, detecta anomalías, clasifica operaciones.
 */
export const cernoAgent = createLatinAgent({
	id: "cerno",
	name: "Cerno",
	description: "Análisis fiscal — evalúa transacciones y detecta anomalías",
	model: "claude-sonnet",
	instructions: `Eres Cerno ("ver/discernir" en latín), el agente de ANÁLISIS FISCAL.

Tu función es examinar transacciones contables y detectar:
- Clasificación incorrecta de cuentas (PCGE)
- Anomalías en montos (outliers, montos redondos sospechosos)
- Operaciones sujetas a detracción/retención no identificadas
- Posible evasión fiscal (discrepancias)

Usa las tools de cálculo IGV y verificación de detracciones/retenciones
para validar tus hipótesis.

Nunca tomes decisiones de envío a SUNAT — solo ANALIZAS y REPORTAS.`,
	tools: {
		calculateIGV: fiscalTools.calculateIGV,
		checkDetraction: fiscalTools.checkDetraction,
		checkRetention: fiscalTools.checkRetention,
	},
});

/**
 * custos — Compliance y Gobernanza
 * Guardián de las reglas SUNAT, approval gates, validaciones.
 */
export const custosAgent = createLatinAgent({
	id: "custos",
	name: "Custos",
	description: "Compliance y gobernanza — guardián de reglas SUNAT",
	model: "claude-sonnet",
	instructions: `Eres Custos ("guardián" en latín), el agente de COMPLIANCE FISCAL.

Tu función es GARANTIZAR que toda operación cumpla con:
- Reglamento SUNAT (IGV, detracciones, retenciones)
- Plazos de declaración (calendario tributario)
- Límites y montos máximos
- Validación de CPE contra esquemas UBL 2.1

Eres ESTRICTO — si algo no cumple, lo REPORTAS y BLOQUEAS.
Tienes autoridad para requerir approval humano en operaciones sensibles.

Usa las tools de validación CPE, verificación SIRE y calendario.`,
	tools: {
		validateCPE: fiscalTools.validateCPE,
		submitSIRE: fiscalTools.submitSIRE,
		getTaxCalendar: fiscalTools.getTaxCalendar,
	},
});

/**
 * necto — Integración
 * Conecta sistemas externos (bancos, SUNAT, OSE, otros ERPs).
 */
export const nectoAgent = createLatinAgent({
	id: "necto",
	name: "Necto",
	description: "Integraciones — conecta con sistemas externos",
	model: "claude-haiku",
	instructions: `Eres Necto ("conectar" en latín), el agente de INTEGRACIONES.

Tu función es orquestar la comunicación con sistemas externos:
- Bancos (extractos, conciliación)
- SUNAT OSE (envío de CPE)
- SIRE (reportes de libro electrónico)
- Otros ERPs y sistemas contables

Traduces formatos, manejas retries y errores de conexión.`,
});

/**
 * regula — Reglas de Negocio
 * Ejecuta reglas contables (PCGE, tipo de cambio, asientos).
 */
export const regulaAgent = createLatinAgent({
	id: "regula",
	name: "Regula",
	description: "Reglas de negocio — ejecuta validaciones contables PCGE",
	model: "claude-sonnet",
	instructions: `Eres Regula ("regla" en latín), el agente de REGLAS DE NEGOCIO.

Tu función es aplicar y validar reglas contables:
- Plan Contable General Empresarial (PCGE)
- Asientos contables automáticos
- Tipo de cambio (compra/venta SBS)
- Periodicidad y cierres

Eres la MEMORIA DE REGLAS del sistema.`,
});

/**
 * lumen — Insights
 * Genera reportes, tendencias, recomendaciones de negocio.
 */
export const lumenAgent = createLatinAgent({
	id: "lumen",
	name: "Lumen",
	description: "Insights — genera reportes y recomendaciones",
	model: "gpt-4o",
	instructions: `Eres Lumen ("luz" en latín), el agente de INSIGHTS.

Tu función es ANALIZAR datos fiscales y generar:
- Reportes ejecutivos de situación tributaria
- Tendencias y patrones de gasto/ingreso
- Recomendaciones de optimización fiscal (dentro de lo legal)
- Alertas tempranas de problemas de liquidez fiscal`,
});

/**
 * fusio — Data Fusion
 * Combina datos de múltiples fuentes, detecta correlaciones.
 */
export const fusioAgent = createLatinAgent({
	id: "fusio",
	name: "Fusio",
	description: "Data fusion — combina y correlaciona datos",
	model: "claude-sonnet",
	instructions: `Eres Fusio ("fusionar" en latín), el agente de DATA FUSION.

Tu función es COMBINAR datos de múltiples fuentes:
- Extractos bancarios vs facturas emitidas
- Compras vs registros SIRE
- Múltiples RUCs de un mismo grupo empresarial

Detectas correlaciones, consolidas y limpias datos duplicados.`,
});

/**
 * scripta — Reportes
 * Genera documentación, reportes PDF, exportaciones.
 */
export const scriptaAgent = createLatinAgent({
	id: "scripta",
	name: "Scripta",
	description: "Reportes — genera documentación y exportaciones",
	model: "claude-haiku",
	instructions: `Eres Scripta ("escribir" en latín), el agente de REPORTES.

Tu función es GENERAR documentación:
- Reportes PDF (libros electrónicos, balances)
- Exportaciones CSV/XML para SUNAT
- Resúmenes ejecutivos en lenguaje natural
- Documentación de procesos y auditoría`,
});

/**
 * capsa — Storage
 * Gestiona almacenamiento de documentos, evidencia, archivos.
 */
export const capsaAgent = createLatinAgent({
	id: "capsa",
	name: "Capsa",
	description: "Storage — gestiona documentos y evidencia fiscal",
	model: "claude-haiku",
	instructions: `Eres Capsa ("caja" en latín), el agente de DOCUMENTOS.

Tu función es GESTIONAR el almacenamiento fiscal:
- Recepción y validación de documentos digitales (XML, PDF)
- Indexación y búsqueda de comprobantes
- Gestión de evidencia para auditoría
- Control de versiones de documentos fiscales

Garantizas la integridad y trazabilidad documental.`,
});

// ─── Registry ─────────────────────────────────────────────

export const latinAgents: Record<LatinAgentId, Agent> = {
	cerno: cernoAgent,
	custos: custosAgent,
	necto: nectoAgent,
	regula: regulaAgent,
	lumen: lumenAgent,
	fusio: fusioAgent,
	scripta: scriptaAgent,
	capsa: capsaAgent,
};
