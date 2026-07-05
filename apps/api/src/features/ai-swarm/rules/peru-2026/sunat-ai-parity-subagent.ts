import type { InvoiceData, ValidationError, ValidationWarning } from '../../config/types';
import { PERU_FISCAL_THRESHOLDS_2026, PERU_RULE_PACK_2026 } from './rule-pack';
import type { PeruRule2026, PeruRuleDomain } from './types';

const TARGET_MS = 1_000;
const SIRE_TRANSITION_WARNING_FROM = '2026-03-01';
const SIRE_ADAPTATION_END = '2026-06-30';

type AlertSeverity = 'info' | 'warning' | 'critical';

interface SunatParityAlert {
  code: string;
  severity: AlertSeverity;
  field: string;
  message: string;
  suggestion?: string;
  relatedRuleIds: string[];
}

/**
 * SunatParityResult interface.
 *
 * @example
 * ```ts
 * const value: SunatParityResult = {} as SunatParityResult;
 * console.log(value);
 * ```
 */
export interface SunatParityResult {
  alerts: SunatParityAlert[];
  relevantRules: PeruRule2026[];
  execution: {
    targetMs: number;
    durationMs: number;
    withinTarget: boolean;
    mode: 'sunat-ai-parity-subagent';
  };
}

function toDate(dateYmd: string): Date {
  return new Date(`${dateYmd}T00:00:00.000Z`);
}

function isLikelyServiceInvoice(invoice: InvoiceData): boolean {
  return invoice.items.some((item) =>
    /servicio|consultor|asesori|honorario|mantenimiento/i.test(item.descripcion),
  );
}

function collectRelevantRules(domains: PeruRuleDomain[]): PeruRule2026[] {
  const wanted = new Set(domains);
  return PERU_RULE_PACK_2026.filter((rule) => wanted.has(rule.domain));
}

function buildRuleIdsByDomain(rules: PeruRule2026[], domain: PeruRuleDomain): string[] {
  return rules.filter((rule) => rule.domain === domain).map((rule) => rule.id);
}

/**
 * runSunatAiParitySubagent operation.
 *
 * @param invoice - Input for invoice.
 * @returns Result of runSunatAiParitySubagent.
 * @example
 * ```ts
 * const result = runSunatAiParitySubagent({} as InvoiceData);
 * console.log(result);
 * ```
 */
export function runSunatAiParitySubagent(invoice: InvoiceData): SunatParityResult {
  const startedAt = Date.now();
  const alerts: SunatParityAlert[] = [];
  const neededDomains = new Set<PeruRuleDomain>(['igv', 'cpe', 'sire', 'ruc']);
  const thresholds = PERU_FISCAL_THRESHOLDS_2026;

  const expectedIgv = Math.round(invoice.subtotal * thresholds.igvRate * 100) / 100;
  const igvGap = Number(Math.abs(invoice.igv - expectedIgv).toFixed(2));
  if (igvGap > thresholds.amountTolerancePen) {
    alerts.push({
      code: 'SUNAT_AI_IGV_DRIFT',
      severity: 'critical',
      field: 'igv',
      message: `Brecha IGV detectada: esperado S/ ${expectedIgv.toFixed(2)}, recibido S/ ${invoice.igv.toFixed(2)}.`,
      suggestion: 'Corregir base imponible y volver a validar antes del envio.',
      relatedRuleIds: [],
    });
  }

  if (invoice.total >= thresholds.defaultBancarizacionMinimumPen) {
    neededDomains.add('bancarizacion');
    alerts.push({
      code: 'SUNAT_AI_BANCARIZACION',
      severity: 'warning',
      field: 'total',
      message: `Operacion sobre S/ ${thresholds.defaultBancarizacionMinimumPen}; SUNAT suele exigir evidencia de bancarizacion.`,
      suggestion: 'Adjuntar medio de pago y numero de operacion bancaria.',
      relatedRuleIds: [],
    });
  }

  if (isLikelyServiceInvoice(invoice) && invoice.total >= thresholds.detraccionMinimumPen) {
    neededDomains.add('detraccion');
    alerts.push({
      code: 'SUNAT_AI_DETRACCION_RISK',
      severity: 'warning',
      field: 'total',
      message: `Servicio sobre S/ ${thresholds.detraccionMinimumPen}; posible alerta AI por SPOT no sustentado.`,
      suggestion: 'Verificar codigo SPOT y constancia de detraccion.',
      relatedRuleIds: [],
    });
  }

  const issueDate = toDate(invoice.fecha);
  const sireFrom = toDate(thresholds.sireMandatoryFrom);
  const transitionFrom = toDate(SIRE_TRANSITION_WARNING_FROM);
  const adaptationEnd = toDate(SIRE_ADAPTATION_END);

  if (issueDate <= adaptationEnd) {
    alerts.push({
      code: 'SUNAT_AI_SIRE_ADAPTATION',
      severity: 'info',
      field: 'fecha',
      message: `Periodo en ventana de adaptacion con facultad discrecional SUNAT hasta ${SIRE_ADAPTATION_END}.`,
      suggestion: 'Regularizar diferencias antes del cierre para evitar contingencias futuras.',
      relatedRuleIds: [],
    });
  }

  if (issueDate >= transitionFrom && issueDate < sireFrom) {
    alerts.push({
      code: 'SUNAT_AI_SIRE_TRANSITION',
      severity: 'warning',
      field: 'fecha',
      message: `Periodo en ventana de transicion SIRE (${SIRE_TRANSITION_WARNING_FROM} a ${thresholds.sireMandatoryFrom}).`,
      suggestion: 'Correr conciliacion RVIE/RCE antes del cierre mensual.',
      relatedRuleIds: [],
    });
  } else if (issueDate >= sireFrom) {
    alerts.push({
      code: 'SUNAT_AI_SIRE_MANDATORY',
      severity: 'info',
      field: 'fecha',
      message: `Periodo dentro de obligatoriedad SIRE desde ${thresholds.sireMandatoryFrom}.`,
      suggestion: 'Confirmar aceptacion o reemplazo de propuesta RVIE/RCE.',
      relatedRuleIds: [],
    });
  }

  const relevantRules = collectRelevantRules([...neededDomains]);
  const ruleIdsByDomain = new Map<PeruRuleDomain, string[]>(
    [...neededDomains].map((domain) => [domain, buildRuleIdsByDomain(relevantRules, domain)]),
  );

  const alertsWithRules = alerts.map((alert) => {
    const domain =
      alert.code.includes('IGV')
        ? 'igv'
        : alert.code.includes('DETRACCION')
          ? 'detraccion'
          : alert.code.includes('BANCARIZACION')
            ? 'bancarizacion'
            : 'sire';

    return {
      ...alert,
      relatedRuleIds: ruleIdsByDomain.get(domain) ?? [],
    };
  });

  const durationMs = Date.now() - startedAt;

  return {
    alerts: alertsWithRules,
    relevantRules,
    execution: {
      targetMs: TARGET_MS,
      durationMs,
      withinTarget: durationMs <= TARGET_MS,
      mode: 'sunat-ai-parity-subagent',
    },
  };
}

function renderRuleLine(rule: PeruRule2026): string {
  const source = rule.sources[0];
  const sourceText = source ? ` [${source.title}](${source.url})` : '';
  return `- ${rule.id} (${rule.domain}, ${rule.severity}): ${rule.summary}${sourceText}`;
}

/**
 * buildSunatRagContext operation.
 *
 * @param invoice - Input for invoice.
 * @returns Result of buildSunatRagContext.
 * @example
 * ```ts
 * const result = buildSunatRagContext({} as InvoiceData);
 * console.log(result);
 * ```
 */
export function buildSunatRagContext(invoice: InvoiceData): string {
  const parity = runSunatAiParitySubagent(invoice);
  const lines = [
    'Contexto RAG SUNAT 2026 (deterministico):',
    `- IGV: ${Math.round(PERU_FISCAL_THRESHOLDS_2026.igvRate * 100)}%`,
    `- Tolerancia monto: S/ ${PERU_FISCAL_THRESHOLDS_2026.amountTolerancePen.toFixed(2)}`,
    `- Umbral detraccion: S/ ${PERU_FISCAL_THRESHOLDS_2026.detraccionMinimumPen}`,
    `- Umbral bancarizacion: S/ ${PERU_FISCAL_THRESHOLDS_2026.defaultBancarizacionMinimumPen}`,
    `- Inicio SIRE obligatorio: ${PERU_FISCAL_THRESHOLDS_2026.sireMandatoryFrom}`,
    ...parity.relevantRules.slice(0, 8).map(renderRuleLine),
  ];

  if (parity.alerts.length > 0) {
    lines.push('Alertas pre-envio detectadas por subagente:');
    lines.push(
      ...parity.alerts.map(
        (alert) => `- ${alert.code} (${alert.severity}): ${alert.message}`,
      ),
    );
  }

  return lines.join('\n');
}

/**
 * Enhanced RAG context — combines deterministic rules (sync) with DB knowledge (async).
 * Enriches the existing `buildSunatRagContext` with relevant chunks from the
 * SUNAT knowledge base (PostgreSQL FTS), grounding AI reasoning in actual legal text.
 *
 * Falls back gracefully to the sync version if DB is unavailable.
 * @param invoice - Input for invoice.
 * @returns Result of buildSunatRagContextAsync.
 * @example
 * ```ts
 * const result = await buildSunatRagContextAsync({} as InvoiceData);
 * console.log(result);
 * ```
 */

export async function buildSunatRagContextAsync(
  invoice: InvoiceData,
): Promise<string> {
  const deterministicContext = buildSunatRagContext(invoice);

  try {
    const { sunatKnowledgeService } = await import('@drenyra/ai/services/sunat-knowledge');

    // Build a query from invoice characteristics to retrieve relevant norms
    const queryTerms: string[] = ['IGV factura'];
    if (invoice.total >= 3500) queryTerms.push('bancarizacion medio pago');
    if (invoice.items.some((i) => i.descripcion.toLowerCase().includes('servicio'))) {
      queryTerms.push('detraccion servicios SPOT');
    }

    const context = await sunatKnowledgeService.buildContext({
      query: queryTerms.join(' '),
      limit: 4,
    });

    if (!context.formatted) return deterministicContext;

    return [deterministicContext, '', context.formatted].join('\n');
  } catch {
    // DB unavailable — deterministic context is always sufficient for compliance
    return deterministicContext;
  }
}

/**
 * mapParityAlertsToValidation operation.
 *
 * @param alerts - Input for alerts.
 * @returns Result of mapParityAlertsToValidation.
 * @example
 * ```ts
 * const result = mapParityAlertsToValidation([]);
 * console.log(result);
 * ```
 */
export function mapParityAlertsToValidation(
  alerts: SunatParityAlert[],
): { errors: ValidationError[]; warnings: ValidationWarning[] } {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];

  for (const alert of alerts) {
    if (alert.severity === 'critical') {
      errors.push({
        field: alert.field,
        code: alert.code,
        message: `${alert.message} Reglas: ${alert.relatedRuleIds.join(', ') || 'N/A'}`,
        severity: 'critical',
      });
      continue;
    }

    warnings.push({
      field: alert.field,
      code: alert.code,
      message: `${alert.message} Reglas: ${alert.relatedRuleIds.join(', ') || 'N/A'}`,
      suggestion: alert.suggestion,
    });
  }

  return { errors, warnings };
}
