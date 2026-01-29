import { Request, Response, NextFunction } from 'express';
import prisma from '../config/database';
import { AppError } from '../middleware/errorHandler';

export const getAll = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { type, isActive } = req.query;

    const where: any = {};

    if (type) {
      where.type = type;
    }

    if (isActive !== undefined) {
      where.isActive = isActive === 'true';
    }

    const sites = await prisma.site.findMany({
      where,
      include: {
        _count: {
          select: { stocks: true },
        },
      },
      orderBy: { name: 'asc' },
    });

    res.json({ success: true, data: sites });
  } catch (error) {
    next(error);
  }
};

export const getById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;

    const site = await prisma.site.findUnique({
      where: { id },
      include: {
        stocks: {
          include: { product: true },
        },
      },
    });

    if (!site) {
      throw new AppError('Site non trouvé', 404);
    }

    res.json({ success: true, data: site });
  } catch (error) {
    next(error);
  }
};

export const create = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const site = await prisma.site.create({
      data: req.body,
    });

    res.status(201).json({ success: true, data: site });
  } catch (error) {
    next(error);
  }
};

export const update = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;

    const site = await prisma.site.update({
      where: { id },
      data: req.body,
    });

    res.json({ success: true, data: site });
  } catch (error) {
    next(error);
  }
};

export const remove = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;

    await prisma.site.delete({ where: { id } });

    res.json({ success: true, message: 'Site supprimé' });
  } catch (error) {
    next(error);
  }
};
