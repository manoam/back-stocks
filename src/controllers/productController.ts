import { Request, Response, NextFunction } from 'express';
import prisma from '../config/database';
import { ProductQueryInput } from '../schemas/product';
import { AppError } from '../middleware/errorHandler';

export const getAll = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { page, limit, search, supplyRisk, supplierId, assemblyId, assemblyTypeId, sortBy, sortOrder } = (req as any).parsedQuery as ProductQueryInput;

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

    if (assemblyId) {
      where.assemblyId = assemblyId;
    }

    if (assemblyTypeId) {
      where.assemblyTypeId = assemblyTypeId;
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
          assembly: {
            include: {
              assemblyTypes: {
                include: { assemblyType: true },
              },
            },
          },
          assemblyType: true,
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
        assembly: {
          include: {
            assemblyTypes: {
              include: { assemblyType: true },
            },
          },
        },
        assemblyType: true,
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
    const { imageData, imageMimeType, ...productData } = req.body;

    // Create product first
    let product = await prisma.product.create({
      data: productData,
      include: { assembly: true, assemblyType: true },
    });

    // If image data was provided, update the product with the image
    if (imageData && imageMimeType) {
      product = await prisma.product.update({
        where: { id: product.id },
        data: {
          imageData,
          imageMimeType,
          imageUrl: `/api/upload/image/${product.id}`,
        },
        include: { assembly: true, assemblyType: true },
      });
    }

    res.status(201).json({ success: true, data: product });
  } catch (error) {
    next(error);
  }
};

export const update = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const { imageData, imageMimeType, ...productData } = req.body;

    // Prepare update data
    const updateData: any = { ...productData };

    // If new image data was provided, include it
    if (imageData && imageMimeType) {
      updateData.imageData = imageData;
      updateData.imageMimeType = imageMimeType;
      updateData.imageUrl = `/api/upload/image/${id}`;
    }

    // If imageUrl is empty/null, clear the image data too
    if (productData.imageUrl === '' || productData.imageUrl === null) {
      updateData.imageData = null;
      updateData.imageMimeType = null;
      updateData.imageUrl = null;
    }

    const product = await prisma.product.update({
      where: { id },
      data: updateData,
      include: { assembly: true, assemblyType: true },
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
