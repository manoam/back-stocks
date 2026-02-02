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

    const [assemblies, total] = await Promise.all([
      prisma.assembly.findMany({
        where,
        include: {
          assemblyTypes: {
            include: {
              assemblyType: true,
            },
          },
          _count: {
            select: { products: true },
          },
        },
        orderBy: { name: 'asc' },
        skip: (Number(page) - 1) * Number(limit),
        take: Number(limit),
      }),
      prisma.assembly.count({ where }),
    ]);

    // Transform to flatten assemblyTypes
    const data = assemblies.map((assembly) => ({
      ...assembly,
      assemblyTypes: assembly.assemblyTypes.map((at) => at.assemblyType),
    }));

    res.json({
      success: true,
      data,
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

    const assembly = await prisma.assembly.findUnique({
      where: { id },
      include: {
        assemblyTypes: {
          include: {
            assemblyType: true,
          },
        },
        products: {
          orderBy: { reference: 'asc' },
        },
      },
    });

    if (!assembly) {
      throw new AppError('Assemblage non trouvé', 404);
    }

    // Transform to flatten assemblyTypes
    const data = {
      ...assembly,
      assemblyTypes: assembly.assemblyTypes.map((at) => at.assemblyType),
    };

    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

export const create = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, description, assemblyTypeIds } = req.body;

    const assembly = await prisma.assembly.create({
      data: {
        name,
        description,
        assemblyTypes: assemblyTypeIds?.length
          ? {
              create: assemblyTypeIds.map((typeId: string) => ({
                assemblyTypeId: typeId,
              })),
            }
          : undefined,
      },
      include: {
        assemblyTypes: {
          include: {
            assemblyType: true,
          },
        },
      },
    });

    // Transform to flatten assemblyTypes
    const data = {
      ...assembly,
      assemblyTypes: assembly.assemblyTypes.map((at) => at.assemblyType),
    };

    res.status(201).json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

export const update = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const { name, description, assemblyTypeIds } = req.body;

    // Update assembly and replace assemblyTypes
    await prisma.$transaction(async (tx) => {
      // Delete existing relations
      await tx.assemblyAssemblyType.deleteMany({
        where: { assemblyId: id },
      });

      // Update assembly and create new relations
      await tx.assembly.update({
        where: { id },
        data: {
          name,
          description,
          assemblyTypes: assemblyTypeIds?.length
            ? {
                create: assemblyTypeIds.map((typeId: string) => ({
                  assemblyTypeId: typeId,
                })),
              }
            : undefined,
        },
      });
    });

    // Fetch updated assembly
    const assembly = await prisma.assembly.findUnique({
      where: { id },
      include: {
        assemblyTypes: {
          include: {
            assemblyType: true,
          },
        },
      },
    });

    // Transform to flatten assemblyTypes
    const data = {
      ...assembly,
      assemblyTypes: assembly?.assemblyTypes.map((at) => at.assemblyType) || [],
    };

    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

export const remove = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;

    // Check if there are products with this assembly
    const productsCount = await prisma.product.count({
      where: { assemblyId: id },
    });

    if (productsCount > 0) {
      // Set products' assemblyId to null instead of deleting
      await prisma.product.updateMany({
        where: { assemblyId: id },
        data: { assemblyId: null },
      });
    }

    await prisma.assembly.delete({ where: { id } });

    res.json({ success: true, message: 'Assemblage supprimé' });
  } catch (error) {
    next(error);
  }
};
