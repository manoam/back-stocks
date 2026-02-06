import { z } from 'zod';

export const createSupplierSchema = z.object({
  name: z.string().min(1, 'Le nom est requis').max(100),
  contact: z.string().max(100).optional(),
  email: z.string().email('Email invalide').optional().or(z.literal('')),
  phone: z.string().max(20).optional(),
  website: z.string().url('URL invalide').optional().or(z.literal('')),
  address: z.string().optional(),
  comment: z.string().optional(),
});

export const updateSupplierSchema = createSupplierSchema.partial();

export const supplierQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(10000).default(20),
  search: z.string().optional(),
  assemblyTypeId: z.string().uuid().optional(),
});

export type CreateSupplierInput = z.infer<typeof createSupplierSchema>;
export type UpdateSupplierInput = z.infer<typeof updateSupplierSchema>;
