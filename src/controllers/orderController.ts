import { Request, Response, NextFunction } from 'express';
import prisma from '../config/database';
import { OrderQueryInput, ReceiveOrderInput } from '../schemas/order';
import { AppError } from '../middleware/errorHandler';

export const getAll = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { page, limit, status, supplierId, productId, startDate, endDate } = (req as any).parsedQuery as OrderQueryInput;

    const where: any = {};

    if (status) where.status = status;
    if (supplierId) where.supplierId = supplierId;
    if (productId) where.productId = productId;

    if (startDate || endDate) {
      where.orderDate = {};
      if (startDate) where.orderDate.gte = new Date(startDate);
      if (endDate) where.orderDate.lte = new Date(endDate);
    }

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        include: {
          product: true,
          supplier: true,
          destinationSite: true,
        },
        orderBy: { orderDate: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.order.count({ where }),
    ]);

    res.json({
      success: true,
      data: orders,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;

    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        product: true,
        supplier: true,
        destinationSite: true,
      },
    });

    if (!order) {
      throw new AppError('Commande non trouvée', 404);
    }

    res.json({ success: true, data: order });
  } catch (error) {
    next(error);
  }
};

export const create = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const order = await prisma.order.create({
      data: req.body,
      include: {
        product: true,
        supplier: true,
        destinationSite: true,
      },
    });

    res.status(201).json({ success: true, data: order });
  } catch (error) {
    next(error);
  }
};

export const update = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;

    const order = await prisma.order.update({
      where: { id },
      data: req.body,
      include: {
        product: true,
        supplier: true,
        destinationSite: true,
      },
    });

    res.json({ success: true, data: order });
  } catch (error) {
    next(error);
  }
};

export const receive = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const { receivedDate, receivedQty, condition, comment }: ReceiveOrderInput = req.body;

    // Récupérer la commande
    const order = await prisma.order.findUnique({
      where: { id },
    });

    if (!order) {
      throw new AppError('Commande non trouvée', 404);
    }

    if (order.status === 'COMPLETED') {
      throw new AppError('Cette commande est déjà terminée', 400);
    }

    if (!order.destinationSiteId) {
      throw new AppError('Site de destination non défini pour cette commande', 400);
    }

    // Transaction: mettre à jour la commande + créer le mouvement
    const result = await prisma.$transaction(async (tx) => {
      // Mettre à jour la commande
      const updatedOrder = await tx.order.update({
        where: { id },
        data: {
          status: 'COMPLETED',
          receivedDate: new Date(receivedDate),
          receivedQty,
        },
        include: {
          product: true,
          supplier: true,
          destinationSite: true,
        },
      });

      // Créer le mouvement d'entrée
      await tx.stockMovement.create({
        data: {
          productId: order.productId,
          type: 'IN',
          targetSiteId: order.destinationSiteId!,
          quantity: receivedQty,
          condition: condition || 'NEW',
          movementDate: new Date(receivedDate),
          operator: order.responsible,
          comment: comment || `Réception commande ${order.supplierRef || id}`,
        },
      });

      // Mettre à jour le stock
      const quantityField = (condition || 'NEW') === 'NEW' ? 'quantityNew' : 'quantityUsed';

      await tx.stock.upsert({
        where: {
          productId_siteId: {
            productId: order.productId,
            siteId: order.destinationSiteId!,
          },
        },
        create: {
          productId: order.productId,
          siteId: order.destinationSiteId!,
          [quantityField]: receivedQty,
        },
        update: {
          [quantityField]: { increment: receivedQty },
        },
      });

      return updatedOrder;
    });

    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

export const remove = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;

    const order = await prisma.order.findUnique({ where: { id } });

    if (order?.status === 'COMPLETED') {
      throw new AppError('Impossible de supprimer une commande terminée', 400);
    }

    await prisma.order.delete({ where: { id } });

    res.json({ success: true, message: 'Commande supprimée' });
  } catch (error) {
    next(error);
  }
};
