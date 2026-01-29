import { Request, Response, NextFunction } from 'express';
import prisma from '../config/database';

export const getStats = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const [
      totalProducts,
      totalSuppliers,
      totalSites,
      pendingOrders,
      stocks,
      highRiskProducts,
    ] = await Promise.all([
      prisma.product.count(),
      prisma.supplier.count(),
      prisma.site.count({ where: { type: 'STORAGE', isActive: true } }),
      prisma.order.count({ where: { status: 'PENDING' } }),
      prisma.stock.findMany({
        include: {
          product: {
            include: {
              productSuppliers: {
                where: { isPrimary: true },
                take: 1,
              },
            },
          },
        },
      }),
      prisma.product.count({ where: { supplyRisk: 'HIGH' } }),
    ]);

    // Calculer la valeur totale du stock
    let totalStockValue = 0;
    let totalItems = 0;

    stocks.forEach((stock) => {
      const qty = stock.quantityNew + stock.quantityUsed;
      totalItems += qty;
      const price = stock.product.productSuppliers[0]?.unitPrice;
      if (price) {
        totalStockValue += qty * Number(price);
      }
    });

    res.json({
      success: true,
      data: {
        totalProducts,
        totalSuppliers,
        totalSites,
        pendingOrders,
        totalItems,
        totalStockValue: Math.round(totalStockValue * 100) / 100,
        highRiskProducts,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getRecentMovements = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const movements = await prisma.stockMovement.findMany({
      include: {
        product: true,
        sourceSite: true,
        targetSite: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    res.json({ success: true, data: movements });
  } catch (error) {
    next(error);
  }
};

export const getPendingOrders = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const orders = await prisma.order.findMany({
      where: { status: 'PENDING' },
      include: {
        product: true,
        supplier: true,
        destinationSite: true,
      },
      orderBy: { expectedDate: 'asc' },
      take: 10,
    });

    res.json({ success: true, data: orders });
  } catch (error) {
    next(error);
  }
};
