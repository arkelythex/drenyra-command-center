import type { IGVSummary } from '@drenyra/domain';
import type {
  BalanceSheetReport,
  CashFlowReport,
  ProfitLossReport,
} from '../../reports/reports.schemas';
import type {
  LedgerFlowStatus,
  LedgerNpifBasicQuery,
  LedgerNpifBasicResult,
} from '../ledger-mvp.types';
import { resolveLedgerPeriodRange } from './period-range';

const NPIF_MANUAL_VALIDATION_WARNING =
  'Resultado NPIF asistido, no autónomo: requiere validación contable manual del contador antes de presentación oficial.';

function parseBooleanEnv(value: string | undefined): boolean {
  if (!value) return false;
  const normalized = value.trim().toLowerCase();
  return normalized === '1' || normalized === 'true' || normalized === 'yes';
}

export interface LedgerNpifBasicPorts {
  getProfitLoss: (
    companyId: string,
    startDate: Date,
    endDate: Date,
  ) => Promise<ProfitLossReport>;
  getBalanceSheet: (
    companyId: string,
    asOfDate: Date,
  ) => Promise<BalanceSheetReport>;
  getCashFlow: (
    companyId: string,
    startDate: Date,
    endDate: Date,
  ) => Promise<CashFlowReport>;
  getIgvSummary: (
    companyId: string,
    year: number,
    month: number,
  ) => Promise<IGVSummary>;
  traceIdFactory: () => string;
  nowFactory: () => Date;
}

export class LedgerNpifBasicService {
  constructor(private readonly ports: LedgerNpifBasicPorts) {}

  async run(query: LedgerNpifBasicQuery): Promise<LedgerNpifBasicResult> {
    const periodRange = resolveLedgerPeriodRange(query.period);

    const [profitLoss, balanceSheet, cashFlow, igvSummary] = await Promise.all([
      this.ports.getProfitLoss(
        query.companyId,
        periodRange.startDate,
        periodRange.endDate,
      ),
      this.ports.getBalanceSheet(query.companyId, periodRange.endDate),
      this.ports.getCashFlow(
        query.companyId,
        periodRange.startDate,
        periodRange.endDate,
      ),
      this.ports.getIgvSummary(
        query.companyId,
        periodRange.year,
        periodRange.month,
      ),
    ]);

    const hasActivity = this.hasNpifActivity(profitLoss, balanceSheet, cashFlow);
    const status: LedgerFlowStatus = hasActivity ? 'ready' : 'manual_review';

    const recommendedActions = hasActivity
      ? ['Validar notas de revelación NPIF antes de cierre mensual.']
      : [
          'Clasificar comprobantes faltantes para completar rubros NPIF.',
          'Completar catálogos contables antes de publicar estados definitivos.',
        ];

    return {
      traceId: this.ports.traceIdFactory(),
      flow: 'npif_basic',
      generatedAt: this.ports.nowFactory().toISOString(),
      period: query.period,
      status,
      evidence: {
        profitLoss,
        balanceSheet,
        cashFlow,
        igvSummary,
      },
      recommendedActions,
      warnings: this.resolveWarnings(),
    };
  }

  private resolveWarnings(): string[] {
    // Governance invariant: warning cannot be disabled by feature flags.
    const warningSuppressionRequested =
      parseBooleanEnv(process.env.LEDGER_MVP_DISABLE_NPIF_WARNING) ||
      parseBooleanEnv(process.env.FLUX_MVP_DISABLE_NPIF_WARNING);

    if (warningSuppressionRequested) {
      return [NPIF_MANUAL_VALIDATION_WARNING];
    }

    const extraWarning = process.env.LEDGER_MVP_NPIF_EXTRA_WARNING?.trim();
    const warnings = [NPIF_MANUAL_VALIDATION_WARNING];
    if (extraWarning) warnings.push(extraWarning);

    return warnings;
  }

  private hasNpifActivity(
    profitLoss: ProfitLossReport,
    balanceSheet: BalanceSheetReport,
    cashFlow: CashFlowReport,
  ): boolean {
    const checks = [
      profitLoss.revenue,
      profitLoss.expenses,
      balanceSheet.assets.total,
      balanceSheet.liabilities.total,
      balanceSheet.equity.total,
      cashFlow.netCashFlow,
    ];

    return checks.some((value) => value !== '0.00');
  }
}
