import { Request, Response, NextFunction } from 'express';
import prisma from '../config/database';
import { ProductQueryInput } from '../schemas/product';
import { AppError } from '../middleware/errorHandler';

export const getAll = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { page, limit, search, supplyRisk, supplierId, groupId, sortBy, sortOrder } = (req as any).parsedQuery as ProductQueryInput;

    const where: any = {};

    if (search) {
      where.OR = [
        { reference: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (supplyRisk) {
      where.supplyRisk = supplyRisk;
    }

    if (groupId) {
      where.groupId = groupId;
    }

    if (supplierId) {
      where.productSuppliers = {
        some: { supplierId },
      };
    }

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        include: {
          group: true,
          productSuppliers: {
            include: { supplier: true },
            where: { isPrimary: true },
            take: 1,
          },
          stocks: {
            include: { site: true },
          },
        },
        orderBy: { [sortBy || 'reference']: sortOrder || 'asc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.product.count({ where }),
    ]);

    res.json({
      success: true,
      data: products,
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

    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        group: true,
        productSuppliers: {
          include: { supplier: true },
        },
        stocks: {
          include: { site: true },
        },
        movements: {
          include: {
            sourceSite: true,
            targetSite: true,
          },
          orderBy: { movementDate: 'desc' },
          take: 10,
        },
        orders: {
          include: { supplier: true },
          orderBy: { orderDate: 'desc' },
          take: 10,
        },
      },
    });

    if (!product) {
      throw new AppError('Produit non trouvé', 404);
    }

    res.json({ success: true, data: product });
  } catch (error) {
    next(error);
  }
};

export const create = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const product = await prisma.product.create({
      data: req.body,
      include: { group: true },
    });

    res.status(201).json({ success: true, data: product });
  } catch (error) {
    next(error);
  }
};

export const update = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;

    const product = await prisma.product.update({
      where: { id },
      data: req.body,
      include: { group: true },
    });

    res.json({ success: true, data: product });
  } catch (error) {
    next(error);
  }
};

export const remove = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;

    await prisma.product.delete({ where: { id } });

    res.json({ success: true, message: 'Produit supprimé' });
  } catch (error) {
    next(error);
  }
};
