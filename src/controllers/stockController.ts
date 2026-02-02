import { Request, Response, NextFunction } from 'express';
import prisma from '../config/database';

export const getAll = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const stocks = await prisma.stock.findMany({
      include: {
        product: {
          include: {
            assembly: {
              include: {
                assemblyTypes: {
                  include: { assemblyType: true },
                },
              },
            },
          },
        },
        site: true,
      },
      orderBy: [
        { product: { reference: 'asc' } },
        { site: { name: 'asc' } },
      ],
    });

    res.json({ success: true, data: stocks });
  } catch (error) {
    next(error);
  }
};

export const getByProduct = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const productId = req.params.productId as string;

    const stocks = await prisma.stock.findMany({
      where: { productId },
      include: {
        site: true,
      },
      orderBy: { site: { name: 'asc' } },
    });

    // Calculer le total
    const totals = stocks.reduce(
      (acc, stock) => ({
        totalNew: acc.totalNew + stock.quantityNew,
        totalUsed: acc.totalUsed + stock.quantityUsed,
      }),
      { totalNew: 0, totalUsed: 0 }
    );

    res.json({
      success: true,
      data: {
        stocks,
        totals: {
          ...totals,
          total: totals.totalNew + totals.totalUsed,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getBySite = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const siteId = req.params.siteId as string;

    const stocks = await prisma.stock.findMany({
      where: { siteId },
      include: {
        product: {
          include: {
            productSuppliers: {
              where: { isPrimary: true },
              include: { supplier: true },
              take: 1,
            },
          },
        },
      },
      orderBy: { product: { reference: 'asc' } },
    });

    res.json({ success: true, data: stocks });
  } catch (error) {
    next(error);
  }
};

export const getAlerts = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Produits avec risque appro HIGH et stock faible
    const products = await prisma.product.findMany({
      where: {
        supplyRisk: 'HIGH',
      },
      include: {
        stocks: {
          include: { site: true },
        },
        productSuppliers: {
          where: { isPrimary: true },
          include: { supplier: true },
          take: 1,
        },
      },
    });

    // Filtrer les produits avec stock total <= qtyPerUnit * 5 (seuil arbitraire)
    const alerts = products
      .map((product) => {
        const totalStock = product.stocks.reduce(
          (sum, s) => sum + s.quantityNew + s.quantityUsed,
          0
        );
        const threshold = product.qtyPerUnit * 5;
        return {
          ...product,
          totalStock,
          threshold,
          isCritical: totalStock <= threshold,
        };
      })
      .filter((p) => p.isCritical)
      .sort((a, b) => a.totalStock - b.totalStock);

    res.json({ success: true, data: alerts });
  } catch (error) {
    next(error);
  }
};
