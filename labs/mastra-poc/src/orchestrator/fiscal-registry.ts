/**
 * Fiscal Registry — Inspirado en el Skill Registry de Gentle-AI.
 *
 * Donde Gentle-AI registra skills de código disponibles para el orchestrator,
 * Drenyra registra CAPACIDADES FISCALES disponibles para cada tenant (RUC).
 *
 * Cada tenant puede tener diferentes capacidades según:
 * - Tipo de contribuyente (persona natural, jurídica, etc.)
 * - Regímenes tributarios (general, RUS, MYPE)
 * - Servicios contratados (facturación, SIRE, detracciones, etc.)
 */

// ─── Types ───────────────────────────────────────────────

export type FiscalSkillType =
	| "fiscal"
	| "compliance"
	| "accounting"
	| "reporting"
	| "storage";

export interface FiscalSkill {
	id: string;
	name: string;
	type: FiscalSkillType;
	description: string;
	tools: string[];
	approvalRequired?: boolean;
	requiresTraining?: boolean; // ¿Requiere configuración inicial?
}

export interface FiscalCapability {
	skill: FiscalSkill;
	enabled: boolean;
	configuredAt?: Date;
	config?: Record<string, unknown>;
}

// ─── Skills Registry ───────────────────────────────────

export const fiscalSkills: FiscalSkill[] = [
	// ── Fiscales ──
	{
		id: "igv-calculation",
		name: "Cálculo IGV",
		type: "fiscal",
		description: "Calcula IGV (18%) sobre montos, base imponible y total",
		tools: ["calculateIGV"],
	},
	{
		id: "cpe-validation",
		name: "Validación CPE",
		type: "fiscal",
		description: "Valida comprobantes electrónicos contra UBL 2.1 y SUNAT",
		tools: ["validateCPE"],
	},
	{
		id: "detraction-check",
		name: "Verificación Detracciones",
		type: "compliance",
		description: "Verifica si una operación está sujeta a detracción SPOT",
		tools: ["checkDetraction"],
	},
	{
		id: "retention-check",
		name: "Verificación Retenciones",
		type: "compliance",
		description: "Verifica retenciones de IGV 3ra categoría",
		tools: ["checkRetention"],
	},

	// ── Compliance ──
	{
		id: "sire-submission",
		name: "Envío SIRE",
		type: "compliance",
		description: "Envía reportes SIRE a SUNAT (PLAME, libros electrónicos)",
		tools: ["submitSIRE"],
		approvalRequired: true,
	},
	{
		id: "ose-integration",
		name: "Integración OSE",
		type: "compliance",
		description: "Conexión con Operador de Servicios Electrónicos",
		tools: ["signXML", "sendOSE", "receiveCDR"],
		approvalRequired: true,
		requiresTraining: true,
	},

	// ── Contables ──
	{
		id: "pcge-classification",
		name: "Clasificación PCGE",
		type: "accounting",
		description:
			"Clasifica operaciones según el Plan Contable General Empresarial",
		tools: ["classifyPCGE"],
	},
	{
		id: "automatic-entries",
		name: "Asientos Automáticos",
		type: "accounting",
		description: "Genera asientos contables automáticos a partir de documentos",
		tools: ["generateEntry"],
	},

	// ── Reportes ──
	{
		id: "report-generation",
		name: "Generación de Reportes",
		type: "reporting",
		description: "Genera reportes fiscales y contables",
		tools: ["generatePDF", "exportCSV", "exportXML"],
	},
	{
		id: "tax-calendar",
		name: "Calendario Tributario",
		type: "reporting",
		description: "Consulta fechas de vencimiento SUNAT",
		tools: ["getTaxCalendar"],
	},

	// ── Almacenamiento ──
	{
		id: "document-storage",
		name: "Almacenamiento Documental",
		type: "storage",
		description: "Almacena y gestiona documentos fiscales con evidencia",
		tools: ["storeDocument", "retrieveDocument", "getEvidence"],
	},
	{
		id: "audit-trail",
		name: "Traza de Auditoría",
		type: "storage",
		description:
			"Mantiene registro inmutable de todas las operaciones fiscales",
		tools: ["appendEvidence", "queryEvidence", "exportAudit"],
	},
];

// ─── Per-Tenant Configuration ──────────────────────────

// Por defecto, todos los tenants tienen las skills básicas
const defaultSkills = [
	"igv-calculation",
	"cpe-validation",
	"detraction-check",
	"retention-check",
	"pcge-classification",
	"tax-calendar",
	"document-storage",
	"audit-trail",
];

// Skills que requieren configuración explícita
const requiresSetup = [
	"sire-submission",
	"ose-integration",
	"automatic-entries",
	"report-generation",
];

// ─── Registry ──────────────────────────────────────────

export const fiscalRegistry = {
	/**
	 * Obtiene las capacidades fiscales disponibles para un RUC.
	 * Como Gentle-AI's skill registry scannea skills disponibles,
	 * Drenyra scannea qué capacidades fiscales tiene configurado un tenant.
	 */
	async getForTenant(ruc: string): Promise<FiscalCapability[]> {
		const capabilities: FiscalCapability[] = [];

		// Todos tienen skills por defecto
		for (const skill of fiscalSkills) {
			if (defaultSkills.includes(skill.id)) {
				capabilities.push({
					skill,
					enabled: true,
					configuredAt: new Date(),
				});
			}
		}

		// Skills que requieren setup (simulado)
		for (const skill of fiscalSkills) {
			if (requiresSetup.includes(skill.id)) {
				// En producción: consultar DB si el RUC tiene configurado este skill
				const isConfigured = await this.checkTenantCapability(ruc, skill.id);
				if (isConfigured) {
					capabilities.push({
						skill,
						enabled: true,
						configuredAt: new Date(),
						config: { endpoint: `https://ose.${ruc}.com/api` },
					});
				}
			}
		}

		return capabilities;
	},

	/**
	 * En producción: consulta la BD si un RUC tiene una capacidad específica.
	 */
	async checkTenantCapability(
		_ruc: string,
		_skillId: string,
	): Promise<boolean> {
		// Placeholder: simular consulta a DB
		// En producción: SELECT * FROM tenant_capabilities WHERE ruc = ? AND skill_id = ?
		return false; // Por defecto, skills avanzados no están configurados
	},

	/**
	 * Activa una capacidad para un RUC.
	 */
	async enableForTenant(_ruc: string, _skillId: string): Promise<void> {},

	/**
	 * Lista todas las skills disponibles en el sistema.
	 */
	getAllSkills(): FiscalSkill[] {
		return fiscalSkills;
	},
};
