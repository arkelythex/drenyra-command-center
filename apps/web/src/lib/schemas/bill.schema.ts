import { z } from 'zod';

export const billItemSchema = z.object({
  id: z.string().optional(),
  productId: z.string().optional(),
  description: z.string().min(1, 'Descripción requerida'),
  quantity: z.number().min(1, 'Cantidad debe ser mayor a 0'),
  unitPrice: z.number().min(0, 'Precio debe ser mayor o igual a 0'),
  total: z.number().min(0),
});

export const billSchema = z.object({
  id: z.string().optional(),
  companyId: z.string().min(1, 'ID de empresa requerido'),
  vendorId: z.string().min(1, 'Proveedor requerido'),
  billNumber: z.string().min(1, 'Número de factura requerido'),
  issueDate: z.date(),
  dueDate: z.date(),
  subtotal: z.number().min(0),
  tax: z.number().min(0),
  total: z.number().min(0),
  status: z.enum(['PENDING', 'PARTIAL', 'PAID', 'OVERDUE']),
  items: z.array(billItemSchema).min(1, 'Debe haber al menos un item'),
  notes: z.string().max(1000).optional(),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
});

export type BillItem = z.infer<typeof billItemSchema>;
export type Bill = z.infer<typeof billSchema>;
export type CreateBillDTO = Omit<Bill, 'id' | 'createdAt' | 'updatedAt'>;
export type UpdateBillDTO = Partial<CreateBillDTO>;

export const BILL_STATUS_LABELS: Record<Bill['status'], string> = {
  PENDING: 'Pendiente',
  PARTIAL: 'Pago Parcial',
  PAID: 'Pagado',
  OVERDUE: 'Vencido',
};
