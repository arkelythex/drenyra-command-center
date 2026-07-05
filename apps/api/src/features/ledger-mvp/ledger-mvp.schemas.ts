import { RUC } from '@drenyra/domain';
import { z } from 'zod';

const PERIOD_PATTERN = /^\d{4}-(0[1-9]|1[0-2])$/;
const PEN_CENTS_SCHEMA = z.number().int().nonnegative();
const RUC_SCHEMA = z
  .string()
  .length(11, 'ruc must be an 11-digit string')
  .refine((value) => RUC.isValid(value), 'ruc must pass modulo 11 checksum');

export const LedgerSireAutopilotInputSchema = z.object({
  companyId: z.string().min(1),
  period: z.string().regex(PERIOD_PATTERN, 'period must use YYYY-MM format'),
  ruc: RUC_SCHEMA,
  razonSocial: z.string().min(1),
  percepcionesCents: PEN_CENTS_SCHEMA.default(0),
  retencionesCents: PEN_CENTS_SCHEMA.default(0),
  totalTolerance: z.number().nonnegative().optional(),
  igvTolerance: z.number().nonnegative().optional(),
  recordTolerance: z.number().nonnegative().optional(),
});

export const LedgerNpifBasicQuerySchema = z.object({
  companyId: z.string().min(1),
  period: z.string().regex(PERIOD_PATTERN, 'period must use YYYY-MM format'),
});

export const LedgerMonitorFiscalInputSchema = z.object({
  companyId: z.string().min(1),
  period: z.string().regex(PERIOD_PATTERN, 'period must use YYYY-MM format'),
  ruc: RUC_SCHEMA,
  ple: z.object({
    salesRecords: z.number().int().nonnegative(),
    purchaseRecords: z.number().int().nonnegative(),
    salesTotalCents: PEN_CENTS_SCHEMA,
    purchaseTotalCents: PEN_CENTS_SCHEMA,
  }),
  pdt: z.object({
    form: z.union([z.literal('621'), z.literal('626')]),
    declaredIgvCents: PEN_CENTS_SCHEMA,
    declaredNetSalesCents: PEN_CENTS_SCHEMA,
  }),
  sire: z
    .object({
      rvieRecords: z.number().int().nonnegative(),
      rceRecords: z.number().int().nonnegative(),
      accepted: z.boolean().optional(),
    })
    .optional(),
});

export type LedgerSireAutopilotInputParsed = z.infer<
  typeof LedgerSireAutopilotInputSchema
>;

export type LedgerNpifBasicQueryParsed = z.infer<typeof LedgerNpifBasicQuerySchema>;

export type LedgerMonitorFiscalInputParsed = z.infer<
  typeof LedgerMonitorFiscalInputSchema
>;
