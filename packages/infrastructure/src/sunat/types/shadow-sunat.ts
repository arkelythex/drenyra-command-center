/**
 * RiskSeverity type.
 *
 * @example
 * ```ts
 * const value: RiskSeverity = {} as RiskSeverity;
 * console.log(value);
 * ```
 */
export type RiskSeverity = "WARNING" | "CRITICAL";

/**
 * TaxArea type.
 *
 * @example
 * ```ts
 * const value: TaxArea = {} as TaxArea;
 * console.log(value);
 * ```
 */
export type TaxArea =
	| "IGV_CREDITO_FISCAL"
	| "RENTA_GASTOS"
	| "BANCARIZACION"
	| "INVENTARIO_VENTAS"
	| "RATIOS_FINANCIEROS"
	| "DETRACCIONES";

/**
 * RiskLevel type.
 *
 * @example
 * ```ts
 * const value: RiskLevel = {} as RiskLevel;
 * console.log(value);
 * ```
 */
export type RiskLevel = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

/**
 * SUNATExpectedAction type.
 *
 * @example
 * ```ts
 * const value: SUNATExpectedAction = {} as SUNATExpectedAction;
 * console.log(value);
 * ```
 */
export type SUNATExpectedAction =
	| "NONE"
	| "CARTA_INDUCTIVA"
	| "REQUERIMIENTO"
	| "VERIFICACION"
	| "FISCALIZACION_PARCIAL"
	| "FISCALIZACION_DEFINITIVA";

/**
 * TaxData interface.
 *
 * @example
 * ```ts
 * const value: TaxData = {} as TaxData;
 * console.log(value);
 * ```
 */
export interface TaxData {
	organizationId: string;
	fiscalYear: number;
	period: string;
	ciiu: string;

	// IGV
	debitoFiscal: number;
	creditoFiscal: number;
	proveedoresNoHabidos: number;

	// Renta
	ingresosBrutos: number;
	gastosRepresentacion: number;
	gastosSinBancarizar: number; // céntimos

	// Inventario
	inventarioReal: number;
	inventarioTeoricoFinal: number;

	// Ratios
	margenBruto: number;
	margenBrutoSector: number;
	aniosConPerdida: number;

	// Detracciones
	detraccionesPendientes: number;
}

/**
 * RiskRule interface.
 *
 * @example
 * ```ts
 * const value: RiskRule = {} as RiskRule;
 * console.log(value);
 * ```
 */
export interface RiskRule {
	id: string;
	area: TaxArea;
	name: string;
	description: string;
	condition: (data: TaxData) => boolean;
	severity: RiskSeverity;
	auditImpact: number;
	legalBasis: string;
}

/**
 * PreAuditAlert interface.
 *
 * @example
 * ```ts
 * const value: PreAuditAlert = {} as PreAuditAlert;
 * console.log(value);
 * ```
 */
export interface PreAuditAlert {
	id: string;
	area: TaxArea;
	severity: RiskSeverity;
	title: string;
	description: string;
	legalBasis: string;
	auditProbabilityImpact: number;
}

/**
 * RecommendationPriority type.
 *
 * @example
 * ```ts
 * const value: RecommendationPriority = {} as RecommendationPriority;
 * console.log(value);
 * ```
 */
export type RecommendationPriority =
	| "IMMEDIATE"
	| "BEFORE_DECLARATION"
	| "NEXT_PERIOD";

/**
 * PreAuditRecommendation interface.
 *
 * @example
 * ```ts
 * const value: PreAuditRecommendation = {} as PreAuditRecommendation;
 * console.log(value);
 * ```
 */
export interface PreAuditRecommendation {
	id: string;
	alertId: string;
	action: string;
	priority: RecommendationPriority;
	riskReductionEstimate: number;
	canAutoFix: boolean;
	autoFixAction?: string;
}

/**
 * AreaMetric interface.
 *
 * @example
 * ```ts
 * const value: AreaMetric = {} as AreaMetric;
 * console.log(value);
 * ```
 */
export interface AreaMetric {
	name: string;
	value: number;
	sectorAverage: number;
	deviation: number;
	threshold: number;
	isSuspicious: boolean;
}

/**
 * AreaRiskAssessment interface.
 *
 * @example
 * ```ts
 * const value: AreaRiskAssessment = {} as AreaRiskAssessment;
 * console.log(value);
 * ```
 */
export interface AreaRiskAssessment {
	area: TaxArea;
	riskScore: number;
	riskLevel: RiskLevel;
	findings: string[];
	metrics: AreaMetric[];
}

/**
 * SectorBenchmark interface.
 *
 * @example
 * ```ts
 * const value: SectorBenchmark = {} as SectorBenchmark;
 * console.log(value);
 * ```
 */
export interface SectorBenchmark {
	sectorCode: string;
	sectorName: string;
	marginBruteSector: number;
	marginBruteCompany: number;
	marginDeviation: number;
	creditRatioSector: number;
	creditRatioCompany: number;
	creditDeviation: number;
	percentilePosition: number;
	suspiciousThreshold: number;
}

/**
 * PreAuditResult interface.
 *
 * @example
 * ```ts
 * const value: PreAuditResult = {} as PreAuditResult;
 * console.log(value);
 * ```
 */
export interface PreAuditResult {
	id: string;
	organizationId: string;
	fiscalYear: number;
	period: string;
	analysisDate: Date;
	overallRiskScore: number;
	riskLevel: RiskLevel;
	auditProbability: number;
	expectedAction: SUNATExpectedAction;
	areaRisks: AreaRiskAssessment[];
	alerts: PreAuditAlert[];
	recommendations: PreAuditRecommendation[];
	sectorBenchmark: SectorBenchmark;
}

