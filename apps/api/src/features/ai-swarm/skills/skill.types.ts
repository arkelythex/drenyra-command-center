/**
 * SkillForge — Formal Skill Interface
 *
 * Inspired by ZeroClaw's `Tool` trait (Rust):
 *   pub trait Tool: Send + Sync {
 *     fn name(&self) -> &str;
 *     fn description(&self) -> &str;
 *     async fn execute(&self, input: ToolInput) -> Result<ToolOutput>;
 *   }
 *
 * TypeScript equivalent using Zod for runtime type safety at boundaries.
 * Skills are the atomic units the AI swarm can discover and invoke.
 */

import type { z } from "zod";

/**
 * SkillCategory type.
 *
 * @example
 * ```ts
 * const value: SkillCategory = {} as SkillCategory;
 * console.log(value);
 * ```
 */
export type SkillCategory =
	| "sunat"    // SIRE, IGV, facturación, detracciones
	| "pcge"     // Plan Contable General Empresarial
	| "banking"  // Conciliación bancaria, detracciones Banco de la Nación
	| "audit"    // Auditoría adversarial, trazabilidad
	| "ocr"      // Extracción de documentos
	| "civic";   // Validación electoral, detección de fraude, resultados

/**
 * SkillMetadata interface.
 *
 * @example
 * ```ts
 * const value: SkillMetadata = {} as SkillMetadata;
 * console.log(value);
 * ```
 */
export interface SkillMetadata {
	/** Semantic version of the skill */
	version: string;
	/** SUNAT/MEF legal reference, e.g. 'RS-000005-2026/SUNAT' */
	legalRef?: string;
	/** Estimated cost per invocation in USD (0 if deterministic) */
	costEstimateUsd: number;
	/** Whether this skill makes LLM calls */
	usesAI: boolean;
	/** Whether result is deterministic (no LLM) */
	deterministic: boolean;
}

/**
 * SkillContext interface.
 *
 * @example
 * ```ts
 * const value: SkillContext = {} as SkillContext;
 * console.log(value);
 * ```
 */
export interface SkillContext {
	organizationId?: number;
	/** Correlation ID for tracing across the swarm */
	traceId?: string;
}

/**
 * SkillSummary interface.
 *
 * @example
 * ```ts
 * const value: SkillSummary = {} as SkillSummary;
 * console.log(value);
 * ```
 */
export interface SkillSummary {
	id: string;
	name: string;
	description: string;
	category: SkillCategory;
	metadata: SkillMetadata;
}

/**
 * Core Skill interface — the atomic unit of the AI swarm.
 *
 * @typeParam TInput  - Zod-validated input type
 * @typeParam TOutput - Zod-validated output type
 * @example
 * ```ts
 * const value: Skill = {} as Skill;
 * console.log(value);
 * ```
 */

export interface Skill<TInput = unknown, TOutput = unknown> {
	/** Unique identifier: 'sunat.sire-readiness', 'audit.adversarial' */
	id: string;
	/** Human-readable name */
	name: string;
	/** Description injected into AI prompts when agent discovers this skill */
	description: string;
	category: SkillCategory;
	inputSchema: z.ZodType<TInput>;
	outputSchema: z.ZodType<TOutput>;
	/** The actual implementation — deterministic or AI-backed */
	handler: (input: TInput, ctx?: SkillContext) => Promise<TOutput>;
	metadata: SkillMetadata;
}

/**
 * SkillInvocationResult interface.
 *
 * @example
 * ```ts
 * const value: SkillInvocationResult = {} as SkillInvocationResult;
 * console.log(value);
 * ```
 * @typeParam TOutput - Generic type parameter for SkillInvocationResult.
 */

export interface SkillInvocationResult<TOutput = unknown> {
	skillId: string;
	output: TOutput;
	durationMs: number;
	timestamp: Date;
	traceId?: string;
}
