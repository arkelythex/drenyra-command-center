import { z } from 'zod';

export const vendorSchema = z.object({
  id: z.string().optional(),
  companyId: z.string().min(1, 'ID de empresa requerido'),
  taxId: z.string()
    .length(11, 'RUC debe tener exactamente 11 dígitos')
    .regex(/^\d+$/, 'RUC debe contener solo números'),
  legalName: z.string().min(1, 'Razón social es requerida').max(200),
  tradeName: z.string().max(200).optional(),
  address: z.string().min(1, 'Dirección es requerida').max(500),
  email: z.string().email('Email inválido'),
  phone: z.string().max(20).optional(),
  contactPerson: z.string().max(100).optional(),
  paymentTerms: z.number().int().min(0).max(365).optional(), // Days
  status: z.enum(['active', 'inactive']).optional(),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
});

export type Vendor = z.infer<typeof vendorSchema>;
export type CreateVendorDTO = Omit<Vendor, 'id' | 'createdAt' | 'updatedAt'>;
export type UpdateVendorDTO = Partial<CreateVendorDTO>;
