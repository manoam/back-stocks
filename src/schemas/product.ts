import { z } from 'zod';

export const createProductSchema = z.object({
  reference: z.string().min(1, 'La référence est requise').max(50),
  description: z.string().max(255).optional(),
  qtyPerUnit: z.number().int().positive().default(1),
  supplyRisk: z.enum(['HIGH', 'MEDIUM', 'LOW']).optional(),
  location: z.string().max(20).optional(),
  groupId: z.string().uuid().optional(),
  comment: z.string().optional(),
  imageUrl: z.string().url().optional(),
});

export const updateProductSchema = createProductSchema.partial();

export const productQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(10000).default(20),
  search: z.string().optional(),
  supplyRisk: z.enum(['HIGH', 'MEDIUM', 'LOW']).optional(),
  supplierId: z.string().uuid().optional(),
  groupId: z.string().uuid().optional(),
  sortBy: z.string().default('reference'),
  sortOrder: z.enum(['asc', 'desc']).default('asc'),
});

export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
export type ProductQueryInput = z.infer<typeof productQuerySchema>;
