/**
 * Evidence Graph — Memoria Fiscal Persistente
 *
 * Inspirado en Engram (Gentle-AI's persistent memory).
 * Donde Engram guarda decisiones de código entre sesiones,
 * Evidence Graph guarda ACCIONES FISCALES de forma inmutable.
 *
 * Características:
 * - Inmutable: una vez escrita, la evidencia no se modifica
 * - Trazable: por RUC, período, sesión, tipo de operación
 * - Exportable: para auditoría SUNAT
 * - Adjuntable: cada acción puede tener documentos asociados
 */

// ─── Types ───────────────────────────────────────────────

export interface EvidenceEntry {
	id: string;
	sessionId: string;
	traceId: string;
	agentId: string;
	actionType: string;
	input: unknown;
	output: unknown;
	confidence: number;
	metadata: Record<string, unknown>;
	timestamp: Date;
	fiscalContext?: {
		ruc: string;
		period?: string;
		documentId?: string;
		operationType?: string;
	};
}

export interface EvidenceFilter {
	ruc?: string;
	period?: string;
	sessionId?: string;
	agentId?: string;
	actionType?: string;
	fromDate?: Date;
	toDate?: Date;
}

// ─── Evidence Store ──────────────────────────────────────

/**
 * Store de evidencia fiscal.
 *
 * Como Engram, pero orientado a contabilidad:
 * - save() → como mem_save pero para acciones fiscales
 * - search() → como mem_search pero filtrando por RUC/período
 * - export() → genera reporte de auditoría
 */
export class EvidenceGraphStore {
	private entries: EvidenceEntry[] = [];

	/**
	 * Registra una entrada de evidencia.
	 * Retorna el ID de la evidencia generada.
	 */
	append(entry: Omit<EvidenceEntry, "id" | "timestamp">): string {
		const id = `ev-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
		this.entries.push({
			...entry,
			id,
			timestamp: new Date(),
		});
		return id;
	}

	/**
	 * Busca evidencia con filtros.
	 * Como mem_search pero orientado a fiscal.
	 */
	search(filter: EvidenceFilter): EvidenceEntry[] {
		return this.entries
			.filter((e) => {
				if (filter.ruc && e.fiscalContext?.ruc !== filter.ruc) return false;
				if (filter.period && e.fiscalContext?.period !== filter.period)
					return false;
				if (filter.sessionId && e.sessionId !== filter.sessionId) return false;
				if (filter.agentId && e.agentId !== filter.agentId) return false;
				if (filter.actionType && e.actionType !== filter.actionType)
					return false;
				if (filter.fromDate && e.timestamp < filter.fromDate) return false;
				if (filter.toDate && e.timestamp > filter.toDate) return false;
				return true;
			})
			.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime()); // más reciente primero
	}

	/**
	 * Obtiene la traza completa de una sesión.
	 */
	getBySession(sessionId: string): EvidenceEntry[] {
		return this.search({ sessionId });
	}

	/**
	 * Obtiene todas las operaciones de un RUC.
	 */
	getByRuc(ruc: string): EvidenceEntry[] {
		return this.search({ ruc });
	}

	/**
	 * Obtiene operaciones de un período fiscal (YYYYMM).
	 */
	getByPeriod(ruc: string, period: string): EvidenceEntry[] {
		return this.search({ ruc, period });
	}

	/**
	 * Exporta evidencia para auditoría.
	 * Genera un reporte estructurado exportable a PDF/CSV.
	 */
	exportAudit(filter: EvidenceFilter): {
		entries: EvidenceEntry[];
		summary: {
			totalEntries: number;
			totalActions: number;
			period: string;
			agents: string[];
			generatedAt: Date;
		};
	} {
		const filtered = this.search(filter);
		const agents = [...new Set(filtered.map((e) => e.agentId))];

		return {
			entries: filtered,
			summary: {
				totalEntries: filtered.length,
				totalActions: filtered.length,
				period: filter.period ?? "all",
				agents,
				generatedAt: new Date(),
			},
		};
	}

	/**
	 * Exporta a formato SUNAT (CSV plano).
	 */
	exportCSV(filter: EvidenceFilter): string {
		const entries = this.search(filter);
		const header = "id,timestamp,agentId,actionType,ruc,period,confidence";
		const rows = entries.map((e) =>
			[
				e.id,
				e.timestamp.toISOString(),
				e.agentId,
				e.actionType,
				e.fiscalContext?.ruc ?? "",
				e.fiscalContext?.period ?? "",
				e.confidence,
			].join(","),
		);
		return [header, ...rows].join("\n");
	}

	/**
	 * Obtiene todas las entradas (para debugging).
	 */
	getAll(): EvidenceEntry[] {
		return [...this.entries];
	}

	/**
	 * Resetea el store (solo para tests).
	 */
	reset(): void {
		this.entries = [];
	}
}

// ─── Singleton ──────────────────────────────────────────

export const evidenceGraph = new EvidenceGraphStore();
