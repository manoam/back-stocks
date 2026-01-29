import { Request, Response, NextFunction } from 'express';
import prisma from '../config/database';
import { AppError } from '../middleware/errorHandler';

export const addSupplier = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const productId = req.params.id as string;
    const { supplierId, supplierRef, unitPrice, leadTime, productUrl, shippingCost, isPrimary } = req.body;

    // Check if product exists
    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product) {
      throw new AppError('Produit non trouvé', 404);
    }

    // Check if supplier exists
    const supplier = await prisma.supplier.findUnique({ where: { id: supplierId } });
    if (!supplier) {
      throw new AppError('Fournisseur non trouvé', 404);
    }

    // Check if link already exists
    const existing = await prisma.productSupplier.findUnique({
      where: { productId_supplierId: { productId, supplierId } },
    });
    if (existing) {
      throw new AppError('Ce fournisseur est déjà lié à ce produit', 400);
    }

    // If isPrimary, unset other primary suppliers
    if (isPrimary) {
      await prisma.productSupplier.updateMany({
        where: { productId },
        data: { isPrimary: false },
      });
    }

    const productSupplier = await prisma.productSupplier.create({
      data: {
        productId,
        supplierId,
        supplierRef,
        unitPrice: unitPrice ? parseFloat(unitPrice) : null,
        leadTime,
        productUrl,
        shippingCost: shippingCost ? parseFloat(shippingCost) : null,
        isPrimary: isPrimary || false,
      },
      include: { supplier: true },
    });

    res.status(201).json({ success: true, data: productSupplier });
  } catch (error) {
    next(error);
  }
};

export const removeSupplier = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const productId = req.params.id as string;
    const supplierId = req.params.supplierId as string;

    const link = await prisma.productSupplier.findUnique({
      where: { productId_supplierId: { productId, supplierId } },
    });

    if (!link) {
      throw new AppError('Lien produit-fournisseur non trouvé', 404);
    }

    await prisma.productSupplier.delete({
      where: { productId_supplierId: { productId, supplierId } },
    });

    res.json({ success: true, message: 'Lien supprimé' });
  } catch (error) {
    next(error);
  }
};

export const setPrimary = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const productId = req.params.id as string;
    const supplierId = req.params.supplierId as string;

    const link = await prisma.productSupplier.findUnique({
      where: { productId_supplierId: { productId, supplierId } },
    });

    if (!link) {
      throw new AppError('Lien produit-fournisseur non trouvé', 404);
    }

    // Unset all primary for this product
    await prisma.productSupplier.updateMany({
      where: { productId },
      data: { isPrimary: false },
    });

    // Set this one as primary
    const updated = await prisma.productSupplier.update({
      where: { productId_supplierId: { productId, supplierId } },
      data: { isPrimary: true },
      include: { supplier: true },
    });

    res.json({ success: true, data: updated });
  } catch (error) {
    next(error);
  }
};
