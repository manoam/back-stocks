import { z } from 'zod';

export const createSupplierContactSchema = z.object({
  firstName: z.string().min(1, 'Le prénom est requis').max(100),
  lastName: z.string().min(1, 'Le nom est requis').max(100),
  email: z.string().email('Email invalide').optional().or(z.literal('')),
  phone: z.string().max(20).optional(),
  position: z.string().max(100).optional(),
  description: z.string().optional(),
});

export const updateSupplierContactSchema = createSupplierContactSchema.partial();

export type CreateSupplierContactInput = z.infer<typeof createSupplierContactSchema>;
export type UpdateSupplierContactInput = z.infer<typeof updateSupplierContactSchema>;
