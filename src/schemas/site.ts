import { z } from 'zod';

export const createSiteSchema = z.object({
  name: z.string().min(1, 'Le nom est requis').max(50),
  type: z.enum(['STORAGE', 'EXIT']),
  address: z.string().optional(),
  isActive: z.boolean().default(true),
});

export const updateSiteSchema = createSiteSchema.partial();

export type CreateSiteInput = z.infer<typeof createSiteSchema>;
export type UpdateSiteInput = z.infer<typeof updateSiteSchema>;
