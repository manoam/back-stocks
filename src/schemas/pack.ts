import { z } from 'zod';

export const packItemSchema = z.object({
  productId: z.string().uuid(),
  quantity: z.number().int().positive('La quantité doit être positive'),
});

export const createPackSchema = z.object({
  name: z.string().min(1, 'Le nom est requis').max(100),
  type: z.enum(['IN', 'OUT']),
  description: z.string().optional(),
  items: z.array(packItemSchema).min(1, 'Au moins un produit est requis'),
});

export const updatePackSchema = z.object({
  name: z.string().min(1, 'Le nom est requis').max(100).optional(),
  type: z.enum(['IN', 'OUT']).optional(),
  description: z.string().optional().nullable(),
  items: z.array(packItemSchema).min(1, 'Au moins un produit est requis').optional(),
});

export type CreatePackInput = z.infer<typeof createPackSchema>;
export type UpdatePackInput = z.infer<typeof updatePackSchema>;
