import { z } from 'zod';

export const createPartCategorySchema = z.object({
  name: z.string().min(1, 'Le nom est requis').max(100),
  description: z.string().optional(),
});

export const updatePartCategorySchema = z.object({
  name: z.string().min(1, 'Le nom est requis').max(100).optional(),
  description: z.string().optional().nullable(),
});

export type CreatePartCategoryInput = z.infer<typeof createPartCategorySchema>;
export type UpdatePartCategoryInput = z.infer<typeof updatePartCategorySchema>;
