import { RUC } from '@drenyra/domain';
import { openRouterChatJson } from '../../lib/llm/openrouter-client';

type CheckStatus = 'pass' | 'warn' | 'fail';

/**
 * PseComplianceInput interface.
 *
 * @example
 * ```ts
 * const value: PseComplianceInput = {} as PseComplianceInput;
 * console.log(value);
 * ```
 */
export interface PseComplianceInput {
  companyId: string;
  period: string; // YYYY-MM
  ruc: string;
  ple: {
    salesRecords: number;
    purchaseRecords: number;
    salesTotalPen: number;
    purchaseTotalPen: number;
  };
  pdt: {
    form: '621' | '626';
    declaredIgvPen: number;
    declaredNetSalesPen: number;
  };
  sire?: {
    rvieRecords: number;
    rceRecords: number;
    accepted?: boolean;
  };
}

interface SubagentCheck {
  subagent: 'igv-subagent' | 'rce-subagent' | 'pdt-subagent';
  status: CheckStatus;
  confidence: number;
  message: string;
  evidence: Record<string, unknown>;
}

interface AiAlert {
  level: 'info' | 'warning' | 'critical';
  message: string;
  action: string;
}

const TARGET_MS = 5_000;
const IGV_TOLERANCE_PEN = 2;

function resolveTopStatus(checks: SubagentCheck[]): 'ready' | 'manual_review' | 'blocked' {
  if (checks.some((check) => check.status === 'fail')) return 'blocked';
  if (checks.some((check) => check.status === 'warn')) return 'manual_review';
  return 'ready';
}

function buildRecommendedActions(checks: SubagentCheck[]): string[] {
  const actions = new Set<string>();

  for (const check of checks) {
    if (check.status === 'pass') continue;
    if (check.subagent === 'igv-subagent') {
      actions.add('Recalcular IGV y alinear PDT 621 antes del envio.');
    }
    if (check.subagent === 'rce-subagent') {
      actions.add('Conciliar RVIE/RCE vs PLE y resolver diferencias de registros.');
    }
    if (check.subagent === 'pdt-subagent') {
      actions.add('Validar estado de RUC y consistencia de ventas declaradas.');
    }
  }

  if (actions.size === 0) {
    actions.add('Continuar con envio PSE de forma automatizada.');
  }

  return [...actions];
}

function toPeriodDate(period: string): Date {
  return new Date(`${period}-01T00:00:00.000Z`);
}

async function runIgvSubagent(input: PseComplianceInput): Promise<SubagentCheck> {
  const expectedIgv = Number((input.ple.salesTotalPen * 0.18).toFixed(2));
  const gap = Number(Math.abs(input.pdt.declaredIgvPen - expectedIgv).toFixed(2));
  const status: CheckStatus = gap > IGV_TOLERANCE_PEN ? 'fail' : 'pass';

  return {
    subagent: 'igv-subagent',
    status,
    confidence: status === 'pass' ? 0.96 : 0.78,
    message:
      status === 'pass'
        ? 'IGV declarado consistente con PLE ventas.'
        : `Brecha IGV detectada: S/ ${gap.toFixed(2)}.`,
    evidence: {
      expectedIgvPen: expectedIgv,
      declaredIgvPen: input.pdt.declaredIgvPen,
      gapPen: gap,
      tolerancePen: IGV_TOLERANCE_PEN,
    },
  };
}

async function runRceSubagent(input: PseComplianceInput): Promise<SubagentCheck> {
  if (!input.sire) {
    return {
      subagent: 'rce-subagent',
      status: 'warn',
      confidence: 0.7,
      message: 'Sin propuesta SIRE cargada para cruce RVIE/RCE.',
      evidence: {},
    };
  }

  const rvieGap = input.sire.rvieRecords - input.ple.salesRecords;
  const rceGap = input.sire.rceRecords - input.ple.purchaseRecords;
  const hasGap = rvieGap !== 0 || rceGap !== 0;
  const status: CheckStatus = hasGap ? 'warn' : 'pass';

  return {
    subagent: 'rce-subagent',
    status,
    confidence: hasGap ? 0.74 : 0.95,
    message: hasGap
      ? 'Diferencias detectadas entre propuesta SIRE y PLE.'
      : 'RVIE/RCE consistente con PLE.',
    evidence: {
      rvieGap,
      rceGap,
      sireAccepted: input.sire.accepted ?? false,
    },
  };
}

async function runPdtSubagent(input: PseComplianceInput): Promise<SubagentCheck> {
  const isValidRuc = RUC.isValid(input.ruc);
  const periodDate = toPeriodDate(input.period);
  const now = new Date();
  const isFuturePeriod = periodDate.getTime() > new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)).getTime();
  const hasSalesGap = Math.abs(input.ple.salesTotalPen - input.pdt.declaredNetSalesPen) > 5;

  let status: CheckStatus = 'pass';
  if (!isValidRuc || isFuturePeriod) status = 'fail';
  else if (hasSalesGap) status = 'warn';

  return {
    subagent: 'pdt-subagent',
    status,
    confidence: status === 'pass' ? 0.94 : status === 'warn' ? 0.75 : 0.62,
    message:
      status === 'fail'
        ? 'PDT no apto para envio: revisar RUC o periodo.'
        : status === 'warn'
          ? 'PDT con diferencias menores vs PLE ventas.'
          : 'PDT listo para envio por PSE.',
    evidence: {
      isValidRuc,
      isFuturePeriod,
      salesGapPen: Number((input.ple.salesTotalPen - input.pdt.declaredNetSalesPen).toFixed(2)),
      form: input.pdt.form,
    },
  };
}

async function buildAiAlerts(
  input: PseComplianceInput,
  checks: SubagentCheck[]
): Promise<AiAlert[]> {
  if (!process.env.OPENROUTER_API_KEY || !process.env.OPENROUTER_DEFAULT_MODEL) {
    return buildFallbackAiAlerts(
      checks,
      'OPENROUTER credentials missing; using deterministic fallback alerts.',
    );
  }

  const compactSummary = {
    period: input.period,
    ruc: input.ruc,
    checks: checks.map((check) => ({
      subagent: check.subagent,
      status: check.status,
      message: check.message,
      evidence: check.evidence,
    })),
  };

  try {
    const { data } = await openRouterChatJson<{ alerts: AiAlert[] }>({
      temperature: 0.1,
      max_tokens: 400,
      messages: [
        {
          role: 'system',
          content:
            'Eres un analista de compliance peruano. Devuelve JSON estricto: {"alerts":[{"level":"info|warning|critical","message":"...","action":"..."}]}',
        },
        {
          role: 'user',
          content: `Resume alertas proactivas para PLE/PDT/SIRE: ${JSON.stringify(compactSummary)}`,
        },
      ],
    });
    if (Array.isArray(data.alerts) && data.alerts.length > 0) {
      return data.alerts.slice(0, 3);
    }

    return buildFallbackAiAlerts(
      checks,
      'OpenRouter returned no alerts; using deterministic fallback alerts.',
    );
  } catch {
    return buildFallbackAiAlerts(
      checks,
      'OpenRouter unavailable; using deterministic fallback alerts.',
    );
  }
}

function buildFallbackAiAlerts(checks: SubagentCheck[], reason: string): AiAlert[] {
  const alerts: AiAlert[] = [];
  const criticalCheck = checks.find((check) => check.status === 'fail');
  if (criticalCheck) {
    alerts.push({
      level: 'critical',
      message: criticalCheck.message,
      action: `Corregir hallazgo crítico del ${criticalCheck.subagent} antes del envío.`,
    });
  }

  const warningCheck = checks.find((check) => check.status === 'warn');
  if (warningCheck) {
    alerts.push({
      level: 'warning',
      message: warningCheck.message,
      action: `Revisar hallazgo del ${warningCheck.subagent} con el contador responsable.`,
    });
  }

  if (!criticalCheck && !warningCheck) {
    alerts.push({
      level: 'info',
      message: 'No se detectaron brechas críticas en validación PLE/PDT/SIRE.',
      action: 'Continuar con revisión final antes del envío PSE.',
    });
  }

  alerts.push({
    level: 'info',
    message: reason,
    action: 'Configurar OpenRouter para habilitar alertas AI enriquecidas en producción.',
  });

  return alerts.slice(0, 3);
}

/**
 * PseProactiveValidatorService class.
 *
 * @example
 * ```ts
 * const value = new PseProactiveValidatorService();
 * console.log(value);
 * ```
 */
export class PseProactiveValidatorService {
  async validate(input: PseComplianceInput): Promise<{
    companyId: string;
    period: string;
    status: 'ready' | 'manual_review' | 'blocked';
    confidence: number;
    checks: SubagentCheck[];
    proactiveAlerts: AiAlert[];
    recommendedActions: string[];
    execution: {
      targetMs: number;
      durationMs: number;
      withinTarget: boolean;
      mode: 'parallel-subagents';
    };
  }> {
    const startedAt = Date.now();
    const checks = await Promise.all([
      runIgvSubagent(input),
      runRceSubagent(input),
      runPdtSubagent(input),
    ]);
    const proactiveAlerts = await buildAiAlerts(input, checks);
    const status = resolveTopStatus(checks);
    const confidence = Number(
      (checks.reduce((sum, check) => sum + check.confidence, 0) / checks.length).toFixed(2)
    );
    const durationMs = Date.now() - startedAt;

    return {
      companyId: input.companyId,
      period: input.period,
      status,
      confidence,
      checks,
      proactiveAlerts,
      recommendedActions: buildRecommendedActions(checks),
      execution: {
        targetMs: TARGET_MS,
        durationMs,
        withinTarget: durationMs <= TARGET_MS,
        mode: 'parallel-subagents',
      },
    };
  }
}
