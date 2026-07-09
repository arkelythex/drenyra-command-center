/**
 * Fiscal Compliance Pipeline — provider-agnostic phases for regulatory change management.
 *
 * Each phase is a factory that takes an LLM caller function and returns
 * a FiscalPhaseDef. The caller is injected at runtime, keeping the
 * pipeline agnostic of the model/provider (DeepSeek, Gemini, Claude, etc.).
 *
 * Phases:
 *   1. Solicitud — detect and document the regulatory change
 *   2. Análisis — analyze fiscal impact across subsystems
 *   3. Diseño — design the implementation approach
 *   4. Plan — break down into migration tasks
 *   5. Migración — execute the fiscal changes
 *   6. Auditoría — verify compliance and fiscal correctness
 *
 * @example
 * ```ts
 * const caller = async (system: string, prompt: string) => { /* ... *\/ };
 *
 * const pipeline: FiscalSDDPipeline = {
 *   id: "igv-rate-change",
 *   phases: [
 *     createSolicitudPhase(caller),
 *     createAnalisisPhase(caller),
 *     createDisenioPhase(caller),
 *   ],
 * };
 * ```
 */

import type { FiscalPhaseDef, PhaseContext, PhaseResult } from "../types";

/** Provider-agnostic LLM caller. */
export type LLMCaller = (
	systemPrompt: string,
	userPrompt: string,
) => Promise<string>;

/** Context metadata for the fiscal change. */
export interface FiscalChangeMetadata {
	/** Title of the fiscal change. */
	title?: string;
	/** Regulation reference (law/article). */
	regulationRef?: string;
	/** Change description. */
	description?: string;
	/** Additional context. */
	[key: string]: unknown;
}

// ============================================================================
// Prompt Templates (Fiscal Domain Language)
// ============================================================================

const SOLICITUD_PROMPT = `Eres un analista fiscal senior. Genera una solicitud de cambio normativo estructurada.

## Contexto
{{context}}

## Requerimientos
1. Identificar la norma o regulación que motiva el cambio
2. Describir el comportamiento actual y por qué debe cambiar
3. Proponer el nuevo comportamiento con impacto fiscal concreto
4. Listar los subsistemas afectados (detracciones, PLE, SIRE, CDR, etc.)
5. Identificar riesgos y dependencias
6. Estimar alcance (módulos, archivos, pruebas)

## Formato de salida
JSON con: titulo, normativa, comportamientoActual, comportamientoPropuesto, subsistemasAfectados[], riesgos[], alcanceEstimado`;

const ANALISIS_PROMPT = `Eres un analista de cumplimiento fiscal senior. Realiza el análisis regulatorio de un cambio normativo.

## Contexto
{{context}}

## Fase Anterior (Solicitud)
{{previousOutput}}

## Requerimientos
1. Citar los artículos de ley específicos que exigen el cambio
2. Definir el comportamiento before/after en términos fiscales precisos
3. Especificar criterios de aceptación que deben cumplirse
4. Identificar casos borde y su manejo esperado
5. Definir el alcance fiscal (RUC, período, tipos de comprobante afectados)

## Formato de salida
JSON con: referenciaNormativa, comportamientoAnterior, comportamientoNuevo, criteriosAceptacion[], casosBorde[], alcanceFiscal`;

const DISENIO_PROMPT = `Eres un arquitecto de sistemas fiscales senior. Diseña el plan de implementación para un cambio normativo.

## Contexto
{{context}}

## Fase Anterior (Análisis)
{{previousOutput}}

## Requerimientos
1. Decisiones arquitectónicas con tradeoffs
2. Módulos/paquetes a modificar
3. Cambios en el modelo de datos (si aplica)
4. Estrategia de migración (si aplica)
5. Estrategia de pruebas fiscales
6. Plan de compatibilidad hacia atrás

## Formato de salida
JSON con: decisionesArquitectonicas[], modulosAfectados[], cambiosModeloDatos, estrategiaMigracion, estrategiaPruebas, planCompatibilidad`;

const PLAN_PROMPT = `Eres un líder técnico fiscal senior. Desglosa un cambio normativo en tareas concretas de migración.

## Contexto
{{context}}

## Fase Anterior (Diseño)
{{previousOutput}}

## Requerimientos
1. Cada tarea debe ser implementable y testeable de forma independiente
2. Agrupar tareas por PR (≤400 líneas cada uno)
3. Identificar dependencias entre tareas
4. Estimar esfuerzo por tarea (líneas, archivos, complejidad)
5. Marcar tareas que necesitan revisión de compliance fiscal

## Formato de salida
JSON con: gruposTareas[], dependencias[], lineasEstimadasTotal, checklistRevision[]`;

const MIGRACION_PROMPT = `Eres un ingeniero fiscal senior. Ejecuta los cambios especificados en el plan de migración normativa.

## Contexto
{{context}}

## Fase Anterior (Plan)
{{previousOutput}}

## Requerimientos
1. Implementar cada tarea siguiendo las decisiones de diseño
2. Mantener corrección fiscal y aislamiento por tenant
3. Agregar pruebas para el comportamiento cambiado
4. Actualizar documentación donde cambien contratos públicos
5. Mantener cada PR bajo 400 líneas

## Formato de salida
JSON con: tareasImplementadas[], archivosModificados[], resultadosPruebas, documentacionActualizada, preocupacionesRestantes[]`;

const AUDITORIA_PROMPT = `Eres un auditor fiscal senior. Verifica que la implementación cumple con la normativa y el análisis regulatorio.

## Contexto
{{context}}

## Fase Anterior (Migración)
{{previousOutput}}

## Análisis Original
{{specOutput}}

## Requerimientos
1. Verificar cada criterio de aceptación del análisis
2. Validar corrección fiscal (montos, RUC, IGV, totales)
3. Verificar aislamiento por tenant/RUC
4. Validar compatibilidad hacia atrás
5. Reportar regresiones encontradas

## Formato de salida
JSON con: resultadosAceptacion[], validacionesFiscales[], verificacionScope[], regresionesEncontradas[], estadoGeneral`;

// ============================================================================
// Phase Factories
// ============================================================================

/** Replace {{key}} placeholders in a template. */
function fillTemplate(template: string, vars: Record<string, string>): string {
	let result = template;
	for (const [key, value] of Object.entries(vars)) {
		result = result.split(`{{${key}}}`).join(value);
	}
	return result;
}

/** Create a phase that calls the LLM with prompt templates and context. */
function createLLMPhase(
	name: string,
	description: string,
	promptTemplate: string,
	caller: LLMCaller,
): FiscalPhaseDef {
	return {
		name,
		description,
		version: "1.0.0",
		execute: async (
			input: unknown,
			ctx: PhaseContext,
		): Promise<PhaseResult> => {
			const metadata = (ctx.metadata ?? {}) as FiscalChangeMetadata;
			const previousOutput = input ?? {};

			const contextStr = [
				metadata.title ? `Título: ${metadata.title}` : "",
				metadata.regulationRef ? `Normativa: ${metadata.regulationRef}` : "",
				metadata.description ? `Descripción: ${metadata.description}` : "",
				`Run ID: ${ctx.runId}`,
				ctx.scope
					? `Alcance: ${ctx.scope.organizationId}/${ctx.scope.companyRuc}`
					: "",
			]
				.filter(Boolean)
				.join("\n");

			const systemPrompt =
				"Eres un asistente fiscal. Responde solo con JSON válido, sin markdown.";

			const userPrompt = fillTemplate(promptTemplate, {
				context: contextStr,
				previousOutput: JSON.stringify(previousOutput, null, 2),
				specOutput: JSON.stringify(
					ctx.previousPhaseResults.get("analisis") ?? {},
					null,
					2,
				),
			});

			let content: string;
			try {
				content = await caller(systemPrompt, userPrompt);
			} catch (err) {
				return {
					status: "FAILED",
					output: null,
					gatesPassed: [],
					evidenceArtifacts: [],
					errors: [
						`LLM call failed: ${err instanceof Error ? err.message : String(err)}`,
					],
					confidence: 0,
				};
			}

			// Try to parse as JSON
			let output: unknown;
			try {
				const cleaned = content
					.replace(/^```(?:json)?\s*/, "")
					.replace(/\s*```$/, "")
					.trim();
				output = JSON.parse(cleaned);
			} catch {
				output = { raw: content };
			}

			return {
				status: "SUCCESS",
				output,
				gatesPassed: [],
				evidenceArtifacts: [],
				errors: [],
				confidence: 0.8,
			};
		},
	};
}

/** Fase 1: Solicitud de cambio normativo. */
export function createSolicitudPhase(
	caller: LLMCaller,
	_ctx?: FiscalChangeMetadata,
): FiscalPhaseDef {
	return createLLMPhase(
		"solicitud",
		"Solicitud de cambio normativo",
		SOLICITUD_PROMPT,
		caller,
	);
}

/** Fase 2: Análisis regulatorio. */
export function createAnalisisPhase(
	caller: LLMCaller,
	_ctx?: FiscalChangeMetadata,
): FiscalPhaseDef {
	return createLLMPhase(
		"analisis",
		"Análisis regulatorio",
		ANALISIS_PROMPT,
		caller,
	);
}

/** Fase 3: Diseño de implementación. */
export function createDisenioPhase(
	caller: LLMCaller,
	_ctx?: FiscalChangeMetadata,
): FiscalPhaseDef {
	return createLLMPhase(
		"diseno",
		"Diseño de implementación",
		DISENIO_PROMPT,
		caller,
	);
}

/** Fase 4: Plan de migración. */
export function createPlanPhase(
	caller: LLMCaller,
	_ctx?: FiscalChangeMetadata,
): FiscalPhaseDef {
	return createLLMPhase("plan", "Plan de migración", PLAN_PROMPT, caller);
}

/** Fase 5: Migración fiscal. */
export function createMigracionPhase(
	caller: LLMCaller,
	_ctx?: FiscalChangeMetadata,
): FiscalPhaseDef {
	return createLLMPhase(
		"migracion",
		"Migración fiscal",
		MIGRACION_PROMPT,
		caller,
	);
}

/** Fase 6: Auditoría de cumplimiento. */
export function createAuditoriaPhase(
	caller: LLMCaller,
	_ctx?: FiscalChangeMetadata,
): FiscalPhaseDef {
	return createLLMPhase(
		"auditoria",
		"Auditoría de cumplimiento",
		AUDITORIA_PROMPT,
		caller,
	);
}
