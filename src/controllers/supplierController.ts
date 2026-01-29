import { Request, Response, NextFunction } from 'express';
import prisma from '../config/database';
import { AppError } from '../middleware/errorHandler';

export const getAll = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { page = 1, limit = 20, search } = (req as any).parsedQuery || req.query;

    const where: any = {};

    if (search) {
      where.OR = [
        { name: { contains: search as string, mode: 'insensitive' } },
        { contact: { contains: search as string, mode: 'insensitive' } },
        { email: { contains: search as string, mode: 'insensitive' } },
      ];
    }

    const [suppliers, total] = await Promise.all([
      prisma.supplier.findMany({
        where,
        include: {
          _count: {
            select: { productSuppliers: true, orders: true },
          },
        },
        orderBy: { name: 'asc' },
        skip: (Number(page) - 1) * Number(limit),
        take: Number(limit),
      }),
      prisma.supplier.count({ where }),
    ]);

    res.json({
      success: true,
      data: suppliers,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;

    const supplier = await prisma.supplier.findUnique({
      where: { id },
      include: {
        productSuppliers: {
          include: { product: true },
        },
        orders: {
          orderBy: { orderDate: 'desc' },
          take: 10,
        },
      },
    });

    if (!supplier) {
      throw new AppError('Fournisseur non trouvé', 404);
    }

    res.json({ success: true, data: supplier });
  } catch (error) {
    next(error);
  }
};

export const create = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const supplier = await prisma.supplier.create({
      data: req.body,
    });

    res.status(201).json({ success: true, data: supplier });
  } catch (error) {
    next(error);
  }
};

export const update = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;

    const supplier = await prisma.supplier.update({
      where: { id },
      data: req.body,
    });

    res.json({ success: true, data: supplier });
  } catch (error) {
    next(error);
  }
};

export const remove = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;

    await prisma.supplier.delete({ where: { id } });

    res.json({ success: true, message: 'Fournisseur supprimé' });
  } catch (error) {
    next(error);
  }
};
