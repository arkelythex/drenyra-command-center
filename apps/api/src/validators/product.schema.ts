import { t } from 'elysia';

export const createProductSchema = t.Object({
  companyId: t.String(),
  sku: t.String(),
  name: t.String(),
  description: t.Optional(t.String()),
  category: t.Optional(t.String()),
  unitPrice: t.String(),
  costPrice: t.Optional(t.String()),
  taxType: t.Optional(t.Union([
    t.Literal('GRAVADO'),
    t.Literal('EXONERADO'),
    t.Literal('INAFECTO')
  ])),
  unit: t.Optional(t.String()),
  stockQuantity: t.Optional(t.String())
});

export const listProductsQuerySchema = t.Object({
  companyId: t.Optional(t.String())
});
