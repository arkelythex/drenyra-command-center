/**
 * ModelRouter — resuelve el mejor LLMCaller para cada fase del pipeline.
 *
 * Soporta asignaciones configurables por fase con cadena de fallback.
 * Si no hay modelo configurado para una fase, usa el caller por defecto.
 *
 * @example
 * ```ts
 * const router = new ModelRouter([
 *   { fase: "solicitud", provider: "deepseek", model: "deepseek-v4-flash", priority: 0, reason: "Análisis normativo" },
 *   { fase: "migracion", provider: "deepseek", model: "deepseek-v4-flash", priority: 0, reason: "Implementación" },
 * ]);
 *
 * const caller = await router.resolve("solicitud");
 * const output = await caller("system prompt", "user prompt");
 * ```
 */

import type { LLMCaller } from "../phases/sdd-phases";
import type { FaseName, ModelAssignment, ModelProvider } from "./types";

// ============================================================================
// Default Assignments
// ============================================================================

/**
 * Asignaciones de modelo por defecto para Drenyra.
 * Todas las fases usan deepseek-v4-flash como primario.
 * Cuando se configuren más proveedores, se pueden agregar fallbacks.
 */
export const DEFAULT_MODEL_ASSIGNMENTS: ModelAssignment[] = [
	{
		fase: "solicitud",
		provider: "deepseek",
		model: "deepseek-v4-flash",
		priority: 0,
		reason: "Análisis normativo extenso con referencias legales",
	},
	{
		fase: "analisis",
		provider: "deepseek",
		model: "deepseek-v4-flash",
		priority: 0,
		reason: "Citas legales y estructura regulatoria",
	},
	{
		fase: "diseno",
		provider: "deepseek",
		model: "deepseek-v4-flash",
		priority: 0,
		reason: "Decisiones arquitectónicas con tradeoffs",
	},
	{
		fase: "plan",
		provider: "deepseek",
		model: "deepseek-v4-flash",
		priority: 0,
		reason: "Desglose mecánico de tareas",
	},
	{
		fase: "migracion",
		provider: "deepseek",
		model: "deepseek-v4-flash",
		priority: 0,
		reason: "Implementación de cambios fiscales",
	},
	{
		fase: "auditoria",
		provider: "deepseek",
		model: "deepseek-v4-flash",
		priority: 0,
		reason: "Validación contra el análisis original",
	},
];

// ============================================================================
// Provider Resolvers
// ============================================================================

/** Función que crea un LLMCaller para un provider específico. */
export type ProviderResolver = (model: string) => LLMCaller | null;

/**
 * Resolvers de proveedores incorporados.
 * Se pueden extender registrando providers custom via `registerProvider()`.
 */
const BUILT_IN_PROVIDERS: Map<ModelProvider, ProviderResolver> = new Map([
	[
		"deepseek",
		(model: string) => {
			const apiKey =
				typeof process !== "undefined"
					? (process.env as Record<string, string | undefined>).DEEPSEEK_API_KEY
					: undefined;
			if (!apiKey) return null;

			return async (system: string, prompt: string) => {
				const response = await fetch(
					"https://api.deepseek.com/v1/chat/completions",
					{
						method: "POST",
						headers: {
							"Content-Type": "application/json",
							Authorization: `Bearer ${apiKey}`,
						},
						body: JSON.stringify({
							model,
							messages: [
								{ role: "system", content: system },
								{ role: "user", content: prompt },
							],
							max_tokens: 2048,
							temperature: 0.2,
						}),
					},
				);

				if (!response.ok) {
					throw new Error(
						`DeepSeek API error: ${response.status} ${await response.text()}`,
					);
				}

				const data = await response.json();
				return data.choices[0]?.message?.content ?? "";
			};
		},
	],
	[
		"openai",
		(_model: string) => {
			// Placeholder — futura implementación
			return null;
		},
	],
	[
		"gemini",
		(_model: string) => {
			// Placeholder — futura implementación
			return null;
		},
	],
	[
		"claude",
		(_model: string) => {
			// Placeholder — futura implementación
			return null;
		},
	],
]);

// ============================================================================
// ModelRouter
// ============================================================================

/**
 * Resuelve LLMCallers para fases del pipeline.
 *
 * Busca en orden de prioridad: asignaciones custom → defaults.
 * Si no hay caller disponible para ninguna asignación, usa el caller por defecto.
 */
export class ModelRouter {
	private assignments: ModelAssignment[];
	private customProviders: Map<string, ProviderResolver> = new Map();
	private defaultCaller: LLMCaller;

	constructor(assignments?: ModelAssignment[], defaultCaller?: LLMCaller) {
		this.assignments = assignments ?? DEFAULT_MODEL_ASSIGNMENTS;
		this.defaultCaller = defaultCaller ?? this.createDefaultCaller();
	}

	/**
	 * Resuelve el mejor LLMCaller disponible para una fase.
	 *
	 * 1. Busca asignaciones custom para la fase, ordenadas por prioridad
	 * 2. Prueba cada asignación hasta encontrar un provider disponible
	 * 3. Si falla todo, usa el caller por defecto
	 */
	async resolve(fase: FaseName): Promise<LLMCaller> {
		const candidates = this.assignments
			.filter((a) => a.fase === fase)
			.sort((a, b) => a.priority - b.priority);

		for (const candidate of candidates) {
			const caller = this.tryResolve(candidate);
			if (caller) return caller;
		}

		return this.defaultCaller;
	}

	/**
	 * Lista las asignaciones disponibles para una fase.
	 */
	getAssignmentsForFase(fase: FaseName): ModelAssignment[] {
		return this.assignments
			.filter((a) => a.fase === fase)
			.sort((a, b) => a.priority - b.priority);
	}

	/**
	 * Registra un provider resolver custom.
	 */
	registerProvider(name: string, resolver: ProviderResolver): void {
		this.customProviders.set(name, resolver);
	}

	/**
	 * Actualiza las asignaciones de modelo en runtime.
	 */
	updateAssignments(assignments: ModelAssignment[]): void {
		this.assignments = assignments;
	}

	/**
	 * Intenta resolver un LLMCaller para una asignación específica.
	 * Returns null si el provider no está disponible.
	 */
	private tryResolve(assignment: ModelAssignment): LLMCaller | null {
		// Buscar en providers custom primero
		const customResolver = this.customProviders.get(assignment.provider);
		if (customResolver) {
			const caller = customResolver(assignment.model);
			if (caller) return caller;
		}

		// Buscar en built-in providers
		const builtIn = BUILT_IN_PROVIDERS.get(assignment.provider);
		if (builtIn) {
			const caller = builtIn(assignment.model);
			if (caller) return caller;
		}

		return null;
	}

	/**
	 * Crea un caller por defecto que lanza un error claro.
	 */
	private createDefaultCaller(): LLMCaller {
		return async (_system: string, _prompt: string) => {
			throw new Error(
				"No hay LLM caller disponible. " +
					"Configura DEEPSEEK_API_KEY o registra un provider custom " +
					"vía ModelRouter.registerProvider().",
			);
		};
	}
}
