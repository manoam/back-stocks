import { z } from 'zod';

export const createAssemblyTypeSchema = z.object({
  name: z.string().min(1, 'Le nom est requis'),
  description: z.string().optional(),
});

export const updateAssemblyTypeSchema = z.object({
  name: z.string().min(1, 'Le nom est requis').optional(),
  description: z.string().optional().nullable(),
});

export const querySchema = z.object({
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().max(100).optional().default(50),
  search: z.string().optional(),
});
