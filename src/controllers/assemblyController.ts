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
          _count: {
            select: { productAssemblies: true },
          },
        },
        orderBy: { name: 'asc' },
        skip: (Number(page) - 1) * Number(limit),
        take: Number(limit),
      }),
      prisma.assembly.count({ where }),
    ]);

    res.json({
      success: true,
      data: assemblies,
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
        productAssemblies: {
          include: {
            product: {
              include: {
                group: true,
                stocks: true,
              },
            },
          },
        },
      },
    });

    if (!assembly) {
      throw new AppError('Assemblage non trouvé', 404);
    }

    res.json({ success: true, data: assembly });
  } catch (error) {
    next(error);
  }
};

export const create = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const assembly = await prisma.assembly.create({
      data: req.body,
    });

    res.status(201).json({ success: true, data: assembly });
  } catch (error) {
    next(error);
  }
};

export const update = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;

    const assembly = await prisma.assembly.update({
      where: { id },
      data: req.body,
    });

    res.json({ success: true, data: assembly });
  } catch (error) {
    next(error);
  }
};

export const remove = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;

    await prisma.assembly.delete({ where: { id } });

    res.json({ success: true, message: 'Assemblage supprimé' });
  } catch (error) {
    next(error);
  }
};

// Add product to assembly
export const addProduct = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const assemblyId = req.params.id as string;
    const { productId, quantityUsed = 1 } = req.body;

    const productAssembly = await prisma.productAssembly.create({
      data: {
        assemblyId,
        productId,
        quantityUsed,
      },
      include: {
        product: true,
        assembly: true,
      },
    });

    res.status(201).json({ success: true, data: productAssembly });
  } catch (error) {
    next(error);
  }
};

// Remove product from assembly
export const removeProduct = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const assemblyId = req.params.id as string;
    const productId = req.params.productId as string;

    await prisma.productAssembly.delete({
      where: {
        productId_assemblyId: {
          productId,
          assemblyId,
        },
      },
    });

    res.json({ success: true, message: 'Produit retiré de l\'assemblage' });
  } catch (error) {
    next(error);
  }
};

// Update product quantity in assembly
export const updateProductQuantity = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const assemblyId = req.params.id as string;
    const productId = req.params.productId as string;
    const { quantityUsed } = req.body;

    const productAssembly = await prisma.productAssembly.update({
      where: {
        productId_assemblyId: {
          productId,
          assemblyId,
        },
      },
      data: { quantityUsed },
      include: {
        product: true,
        assembly: true,
      },
    });

    res.json({ success: true, data: productAssembly });
  } catch (error) {
    next(error);
  }
};
