import { Request, Response, NextFunction } from 'express';
import prisma from '../config/database';
import { AppError } from '../middleware/errorHandler';

export const getAll = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { page = 1, limit = 50, search } = (req as any).parsedQuery || req.query;

    const where: any = {};

    if (search) {
      where.OR = [
        { name: { contains: search as string, mode: 'insensitive' } },
        { description: { contains: search as string, mode: 'insensitive' } },
      ];
    }

    const [assemblyTypes, total] = await Promise.all([
      prisma.assemblyType.findMany({
        where,
        include: {
          _count: {
            select: { assemblies: true },
          },
        },
        orderBy: { name: 'asc' },
        skip: (Number(page) - 1) * Number(limit),
        take: Number(limit),
      }),
      prisma.assemblyType.count({ where }),
    ]);

    res.json({
      success: true,
      data: assemblyTypes,
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

    const assemblyType = await prisma.assemblyType.findUnique({
      where: { id },
      include: {
        assemblies: {
          include: {
            assembly: {
              include: {
                products: {
                  include: {
                    stocks: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!assemblyType) {
      throw new AppError('Type borne non trouvé', 404);
    }

    // Transform to flatten assemblies
    const data = {
      ...assemblyType,
      assemblies: assemblyType.assemblies.map((a) => a.assembly),
    };

    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

export const create = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const assemblyType = await prisma.assemblyType.create({
      data: req.body,
    });

    res.status(201).json({ success: true, data: assemblyType });
  } catch (error) {
    next(error);
  }
};

export const update = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;

    const assemblyType = await prisma.assemblyType.update({
      where: { id },
      data: req.body,
    });

    res.json({ success: true, data: assemblyType });
  } catch (error) {
    next(error);
  }
};

export const remove = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;

    // The relations in assembly_assembly_types will be deleted automatically via CASCADE
    await prisma.assemblyType.delete({ where: { id } });

    res.json({ success: true, message: 'Type borne supprimé' });
  } catch (error) {
    next(error);
  }
};
