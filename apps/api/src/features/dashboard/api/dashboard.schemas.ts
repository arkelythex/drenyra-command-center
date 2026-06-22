import { t } from 'elysia';

/**
 * CompanyQuerySchema const.
 *
 * @example
 * ```ts
 * console.log(CompanyQuerySchema);
 * ```
 */
export const CompanyQuerySchema = t.Object({
  companyId: t.String({ format: 'uuid' }),
});

/**
 * OverviewQuerySchema const.
 *
 * @example
 * ```ts
 * console.log(OverviewQuerySchema);
 * ```
 */
export const OverviewQuerySchema = t.Object({
  companyId: t.String({ format: 'uuid' }),
  currency: t.Optional(t.Union([t.Literal('PEN'), t.Literal('USD')])),
});

/**
 * DateRangeQuerySchema const.
 *
 * @example
 * ```ts
 * console.log(DateRangeQuerySchema);
 * ```
 */
export const DateRangeQuerySchema = t.Object({
  companyId: t.String({ format: 'uuid' }),
  startDate: t.Optional(t.String()),
  endDate: t.Optional(t.String()),
  currency: t.Optional(t.Union([t.Literal('PEN'), t.Literal('USD')])),
});

/**
 * LiquidityQuerySchema const.
 *
 * @example
 * ```ts
 * console.log(LiquidityQuerySchema);
 * ```
 */
export const LiquidityQuerySchema = t.Object({
  companyId: t.String({ format: 'uuid' }),
  months: t.Optional(t.Numeric({ default: 12 })),
});

/**
 * TaxCalendarQuerySchema const.
 *
 * @example
 * ```ts
 * console.log(TaxCalendarQuerySchema);
 * ```
 */
export const TaxCalendarQuerySchema = t.Object({
  companyId: t.String({ format: 'uuid' }),
  month: t.Optional(t.Numeric()),
  year: t.Optional(t.Numeric()),
});

/**
 * SireStatusQuerySchema const.
 *
 * @example
 * ```ts
 * console.log(SireStatusQuerySchema);
 * ```
 */
export const SireStatusQuerySchema = t.Object({
  companyId: t.String({ format: 'uuid' }),
  period: t.Optional(t.String({ pattern: '^\\d{4}-\\d{2}$' })),
});
