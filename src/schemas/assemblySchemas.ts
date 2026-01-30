import { z } from 'zod';

export const createAssemblySchema = z.object({
  name: z.string().min(1, 'Le nom est requis'),
  description: z.string().optional(),
});

export const updateAssemblySchema = z.object({
  name: z.string().min(1, 'Le nom est requis').optional(),
  description: z.string().optional().nullable(),
});

export const addProductSchema = z.object({
  productId: z.string().uuid('ID produit invalide'),
  quantityUsed: z.number().int().positive('La quantité doit être positive').optional().default(1),
});

export const updateProductQuantitySchema = z.object({
  quantityUsed: z.number().int().positive('La quantité doit être positive'),
});

export const querySchema = z.object({
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().max(100).optional().default(50),
  search: z.string().optional(),
});
