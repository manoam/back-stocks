import { Request, Response, NextFunction } from 'express';
import prisma from '../config/database';
import { AppError } from '../middleware/errorHandler';

// Get all part categories for an assembly type
export const getAll = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const assemblyTypeId = req.params.assemblyTypeId as string;

    const categories = await prisma.partCategory.findMany({
      where: { assemblyTypeId },
      include: {
        _count: {
          select: { products: true },
        },
      },
      orderBy: { name: 'asc' },
    });

    res.json({ success: true, data: categories });
  } catch (error) {
    next(error);
  }
};

// Create a part category
export const create = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const assemblyTypeId = req.params.assemblyTypeId as string;
    const { name, description } = req.body;

    // Check assembly type exists
    const assemblyType = await prisma.assemblyType.findUnique({ where: { id: assemblyTypeId } });
    if (!assemblyType) {
      throw new AppError('Type de borne non trouvé', 404);
    }

    const category = await prisma.partCategory.create({
      data: {
        assemblyTypeId,
        name,
        description,
      },
    });

    res.status(201).json({ success: true, data: category });
  } catch (error) {
    next(error);
  }
};

// Update a part category
export const update = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const { name, description } = req.body;

    const existing = await prisma.partCategory.findUnique({ where: { id } });
    if (!existing) {
      throw new AppError('Catégorie non trouvée', 404);
    }

    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;

    const category = await prisma.partCategory.update({
      where: { id },
      data: updateData,
    });

    res.json({ success: true, data: category });
  } catch (error) {
    next(error);
  }
};

// Delete a part category
export const remove = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;

    const existing = await prisma.partCategory.findUnique({ where: { id } });
    if (!existing) {
      throw new AppError('Catégorie non trouvée', 404);
    }

    await prisma.partCategory.delete({ where: { id } });

    res.json({ success: true, message: 'Catégorie supprimée' });
  } catch (error) {
    next(error);
  }
};
