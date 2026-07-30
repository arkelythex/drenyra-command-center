/**
 * PeriodCloseService — Closes an accounting period using the AccountingPeriod VO.
 *
 * Design §7.3: Uses the domain VO's closeFinal() for validation,
 * then updates the accounting_periods row within the passed transaction.
 */
import { accountingPeriods } from "@drenyra/persistence/schema";
import { AccountingPeriod } from "@drenyra/domain/accounting/accounting-period";
import { eq, and } from "drizzle-orm";
import type { DrizzleClient } from "@drenyra/persistence";

export interface ClosePeriodParams {
  companyId: string;
  year: number;
  month: number;
}

export class PeriodCloseService {
  /**
   * Closes a period to cerrado_final status.
   *
   * @param tx - The Drizzle transaction client
   * @param params - company, year, month to close
   * @throws InvalidAccountingPeriodError if params are invalid
   */
  async closeFinal(
    tx: DrizzleClient,
    params: ClosePeriodParams,
  ): Promise<void> {
    // Uses AccountingPeriod VO for validation
    const period = AccountingPeriod.create(params.year, params.month, "abierto");

    // closeFinal() validates the transition
    const closed = period.closeFinal();

    await tx
      .update(accountingPeriods)
      .set({
        status: closed.status,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(accountingPeriods.companyId, params.companyId as any),
          eq(accountingPeriods.year, params.year),
          eq(accountingPeriods.month, params.month),
        ),
      );
  }
}
