import { z } from 'zod';

const orderTemplateItemSchema = z.object({
  productId: z.string().uuid(),
  quantity: z.number().int().positive('La quantité doit être positive'),
  unitPrice: z.coerce.number().positive('Le prix doit être positif').optional(),
});

export const createOrderTemplateSchema = z.object({
  name: z.string().min(1, 'Le nom est requis').max(200),
  supplierId: z.string().uuid('ID fournisseur invalide'),
  destinationSiteId: z.string().uuid().optional(),
  responsible: z.string().max(100).optional(),
  comment: z.string().optional(),
  items: z.array(orderTemplateItemSchema).min(1, 'Au moins un produit est requis'),
});

export const updateOrderTemplateSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  supplierId: z.string().uuid().optional(),
  destinationSiteId: z.string().uuid().optional().nullable(),
  responsible: z.string().max(100).optional().nullable(),
  comment: z.string().optional().nullable(),
  items: z.array(orderTemplateItemSchema).min(1, 'Au moins un produit est requis').optional(),
});
