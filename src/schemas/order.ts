import { z } from 'zod';

export const createOrderSchema = z.object({
  productId: z.string().uuid('ID produit invalide'),
  supplierId: z.string().uuid('ID fournisseur invalide'),
  quantity: z.number().int().positive('La quantité doit être positive'),
  orderDate: z.coerce.date(),
  expectedDate: z.coerce.date().optional(),
  destinationSiteId: z.string().uuid().optional(),
  responsible: z.string().max(50).optional(),
  supplierRef: z.string().max(100).optional(),
  comment: z.string().optional(),
});

export const updateOrderSchema = createOrderSchema.partial();

export const receiveOrderSchema = z.object({
  receivedDate: z.coerce.date(),
  receivedQty: z.number().int().positive('La quantité reçue doit être positive'),
  condition: z.enum(['NEW', 'USED']).default('NEW'),
  comment: z.string().optional(),
});

export const orderQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  status: z.enum(['PENDING', 'COMPLETED', 'CANCELLED']).optional(),
  supplierId: z.string().uuid().optional(),
  productId: z.string().uuid().optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
});

export type CreateOrderInput = z.infer<typeof createOrderSchema>;
export type UpdateOrderInput = z.infer<typeof updateOrderSchema>;
export type ReceiveOrderInput = z.infer<typeof receiveOrderSchema>;
export type OrderQueryInput = z.infer<typeof orderQuerySchema>;
