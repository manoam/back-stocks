import { Request, Response, NextFunction } from 'express';
import * as XLSX from 'xlsx';
import prisma from '../config/database';

// Export products to Excel
export const exportProducts = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const format = (req.query.format as string) || 'xlsx';

    const products = await prisma.product.findMany({
      include: {
        group: true,
        productSuppliers: {
          include: { supplier: true },
          where: { isPrimary: true },
          take: 1,
        },
        stocks: {
          include: { site: true },
        },
      },
      orderBy: { reference: 'asc' },
    });

    // Get all storage sites for column headers
    const sites = await prisma.site.findMany({
      where: { type: 'STORAGE', isActive: true },
      orderBy: { name: 'asc' },
    });

    // Build headers
    const baseHeaders = [
      'Référence produit',
      'Description',
      'Groupe',
      'Qté 1 borne',
      'Risque appro',
      'Emplacement',
      'Fournisseur principal',
      'PA unit.',
      'Délai appro',
      'Frais livraison',
    ];

    // Add stock columns for each site
    const stockHeaders: string[] = [];
    sites.forEach(site => {
      stockHeaders.push(`${site.name} : neuf`);
      stockHeaders.push(`${site.name} : occasion`);
    });
    stockHeaders.push('Stock total neuf', 'Stock total occasion', 'Stock total', 'Bornes possibles avec stock');

    const headers = [...baseHeaders, ...stockHeaders];

    // Build data rows
    const rows = products.map(product => {
      const primarySupplier = product.productSuppliers[0];

      // Calculate total stocks
      let totalNew = 0;
      let totalUsed = 0;
      const stockBySite: Record<string, { new: number; used: number }> = {};

      product.stocks.forEach(stock => {
        totalNew += stock.quantityNew;
        totalUsed += stock.quantityUsed;
        stockBySite[stock.site.name] = {
          new: stock.quantityNew,
          used: stock.quantityUsed,
        };
      });

      const total = totalNew + totalUsed;
      const possibleUnits = product.qtyPerUnit > 0 ? Math.floor(total / product.qtyPerUnit) : 0;

      const baseData = [
        product.reference,
        product.description || '',
        product.group?.name || '',
        product.qtyPerUnit,
        mapRiskToFrench(product.supplyRisk),
        product.location || '',
        primarySupplier?.supplier?.name || '',
        primarySupplier?.unitPrice ? Number(primarySupplier.unitPrice) : '',
        primarySupplier?.leadTime || '',
        primarySupplier?.shippingCost ? Number(primarySupplier.shippingCost) : '',
      ];

      // Add stock data for each site
      const stockData: (number | string)[] = [];
      sites.forEach(site => {
        const siteStock = stockBySite[site.name] || { new: 0, used: 0 };
        stockData.push(siteStock.new || '');
        stockData.push(siteStock.used || '');
      });
      stockData.push(totalNew || '', totalUsed || '', total || '', possibleUnits || '');

      return [...baseData, ...stockData];
    });

    // Create workbook
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.aoa_to_sheet([headers, ...rows]);

    // Set column widths
    worksheet['!cols'] = headers.map((_, i) => ({
      wch: i < baseHeaders.length ? 20 : 12,
    }));

    XLSX.utils.book_append_sheet(workbook, worksheet, 'SYNTHESE');

    // Send file
    if (format === 'csv') {
      const csv = XLSX.utils.sheet_to_csv(worksheet);
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', 'attachment; filename=produits.csv');
      res.send('\uFEFF' + csv); // BOM for Excel UTF-8 compatibility
    } else {
      const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', 'attachment; filename=produits.xlsx');
      res.send(buffer);
    }
  } catch (error) {
    next(error);
  }
};

// Export stock matrix to Excel
export const exportStockMatrix = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const format = (req.query.format as string) || 'xlsx';

    const stocks = await prisma.stock.findMany({
      include: {
        product: true,
        site: true,
      },
      orderBy: [
        { product: { reference: 'asc' } },
        { site: { name: 'asc' } },
      ],
    });

    const sites = await prisma.site.findMany({
      where: { type: 'STORAGE', isActive: true },
      orderBy: { name: 'asc' },
    });

    // Build matrix
    const headers = ['Référence produit'];
    sites.forEach(site => {
      headers.push(`${site.name} : neuf`);
      headers.push(`${site.name} : occasion`);
      headers.push(`Total ${site.name}`);
    });
    headers.push('Stock total neuf', 'Stock total occasion', 'Stock total');

    // Group stocks by product
    const productStocks = new Map<string, { reference: string; stocks: Map<string, { new: number; used: number }> }>();

    stocks.forEach(stock => {
      if (!productStocks.has(stock.productId)) {
        productStocks.set(stock.productId, {
          reference: stock.product.reference,
          stocks: new Map(),
        });
      }
      productStocks.get(stock.productId)!.stocks.set(stock.site.name, {
        new: stock.quantityNew,
        used: stock.quantityUsed,
      });
    });

    const rows: (string | number)[][] = [];
    productStocks.forEach(product => {
      const row: (string | number)[] = [product.reference];
      let totalNew = 0;
      let totalUsed = 0;

      sites.forEach(site => {
        const siteStock = product.stocks.get(site.name) || { new: 0, used: 0 };
        row.push(siteStock.new || '');
        row.push(siteStock.used || '');
        row.push(siteStock.new + siteStock.used || '');
        totalNew += siteStock.new;
        totalUsed += siteStock.used;
      });

      row.push(totalNew || '', totalUsed || '', totalNew + totalUsed || '');
      rows.push(row);
    });

    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.aoa_to_sheet([headers, ...rows]);
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Matrice Stock');

    if (format === 'csv') {
      const csv = XLSX.utils.sheet_to_csv(worksheet);
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', 'attachment; filename=matrice_stock.csv');
      res.send('\uFEFF' + csv);
    } else {
      const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', 'attachment; filename=matrice_stock.xlsx');
      res.send(buffer);
    }
  } catch (error) {
    next(error);
  }
};

// Export movements to Excel
export const exportMovements = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const format = (req.query.format as string) || 'xlsx';
    const startDate = req.query.startDate ? new Date(req.query.startDate as string) : undefined;
    const endDate = req.query.endDate ? new Date(req.query.endDate as string) : undefined;

    const where: any = {};
    if (startDate || endDate) {
      where.movementDate = {};
      if (startDate) where.movementDate.gte = startDate;
      if (endDate) where.movementDate.lte = endDate;
    }

    const movements = await prisma.stockMovement.findMany({
      where,
      include: {
        product: true,
        sourceSite: true,
        targetSite: true,
      },
      orderBy: { movementDate: 'desc' },
    });

    const headers = [
      'Date',
      'Produit',
      'Type',
      'Source',
      'Destination',
      'Quantité',
      'État',
      'Opérateur',
      'Commentaire',
    ];

    const rows = movements.map(mvt => [
      mvt.movementDate.toISOString().split('T')[0],
      mvt.product.reference,
      mapMovementType(mvt.type),
      mvt.sourceSite ? `${mvt.sourceSite.name} : ${mvt.condition === 'NEW' ? 'neuf' : 'occasion'}` : '',
      mvt.targetSite ? `${mvt.targetSite.name} : ${mvt.condition === 'NEW' ? 'neuf' : 'occasion'}` : '',
      mvt.quantity,
      mvt.condition === 'NEW' ? 'Neuf' : 'Occasion',
      mvt.operator || '',
      mvt.comment || '',
    ]);

    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.aoa_to_sheet([headers, ...rows]);
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Mouvements');

    if (format === 'csv') {
      const csv = XLSX.utils.sheet_to_csv(worksheet);
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', 'attachment; filename=mouvements.csv');
      res.send('\uFEFF' + csv);
    } else {
      const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', 'attachment; filename=mouvements.xlsx');
      res.send(buffer);
    }
  } catch (error) {
    next(error);
  }
};

// Export orders to Excel
export const exportOrders = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const format = (req.query.format as string) || 'xlsx';
    const status = req.query.status as string | undefined;

    const where: any = {};
    if (status) where.status = status;

    const orders = await prisma.order.findMany({
      where,
      include: {
        product: true,
        supplier: true,
        destinationSite: true,
      },
      orderBy: { orderDate: 'desc' },
    });

    const headers = [
      'Date commande',
      'Produit',
      'Fournisseur',
      'Qté',
      'État commande',
      'Destination',
      'Date prévue',
      'Date réception',
      'Qté reçue',
      'Ref fournisseur',
      'Responsable',
      'Commentaire',
    ];

    const rows = orders.map(order => [
      order.orderDate.toISOString().split('T')[0],
      order.product.reference,
      order.supplier.name,
      order.quantity,
      mapOrderStatus(order.status),
      order.destinationSite?.name || '',
      order.expectedDate?.toISOString().split('T')[0] || '',
      order.receivedDate?.toISOString().split('T')[0] || '',
      order.receivedQty || '',
      order.supplierRef || '',
      order.responsible || '',
      order.comment || '',
    ]);

    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.aoa_to_sheet([headers, ...rows]);
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Commandes');

    if (format === 'csv') {
      const csv = XLSX.utils.sheet_to_csv(worksheet);
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', 'attachment; filename=commandes.csv');
      res.send('\uFEFF' + csv);
    } else {
      const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', 'attachment; filename=commandes.xlsx');
      res.send(buffer);
    }
  } catch (error) {
    next(error);
  }
};

// Export full database to Excel (multiple sheets)
export const exportAll = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const workbook = XLSX.utils.book_new();

    // 1. SYNTHESE (Products with stocks)
    const products = await prisma.product.findMany({
      include: {
        group: true,
        productSuppliers: {
          include: { supplier: true },
          where: { isPrimary: true },
          take: 1,
        },
        stocks: { include: { site: true } },
      },
      orderBy: { reference: 'asc' },
    });

    const sites = await prisma.site.findMany({
      where: { type: 'STORAGE', isActive: true },
      orderBy: { name: 'asc' },
    });

    const syntheseHeaders = [
      'Référence produit', 'Description', 'Groupe', 'Qté 1 borne', 'Risque appro', 'Emplacement',
      'Fournisseur principal', 'PA unit.', 'Délai appro', 'Frais livraison',
    ];
    sites.forEach(site => {
      syntheseHeaders.push(`${site.name} : neuf`, `${site.name} : occasion`);
    });
    syntheseHeaders.push('Stock total neuf', 'Stock total occasion', 'Stock total', 'Bornes possibles');

    const syntheseRows = products.map(product => {
      const ps = product.productSuppliers[0];
      const stockBySite: Record<string, { new: number; used: number }> = {};
      let totalNew = 0, totalUsed = 0;

      product.stocks.forEach(s => {
        totalNew += s.quantityNew;
        totalUsed += s.quantityUsed;
        stockBySite[s.site.name] = { new: s.quantityNew, used: s.quantityUsed };
      });

      const row: any[] = [
        product.reference, product.description || '', product.group?.name || '',
        product.qtyPerUnit, mapRiskToFrench(product.supplyRisk), product.location || '',
        ps?.supplier?.name || '', ps?.unitPrice ? Number(ps.unitPrice) : '',
        ps?.leadTime || '', ps?.shippingCost ? Number(ps.shippingCost) : '',
      ];

      sites.forEach(site => {
        const ss = stockBySite[site.name] || { new: 0, used: 0 };
        row.push(ss.new || '', ss.used || '');
      });

      const total = totalNew + totalUsed;
      row.push(totalNew || '', totalUsed || '', total || '');
      row.push(product.qtyPerUnit > 0 ? Math.floor(total / product.qtyPerUnit) || '' : '');

      return row;
    });

    XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet([syntheseHeaders, ...syntheseRows]), 'SYNTHESE');

    // 2. REF FOURNISSEURS
    const productSuppliers = await prisma.productSupplier.findMany({
      include: { product: true, supplier: true },
      orderBy: [{ product: { reference: 'asc' } }, { isPrimary: 'desc' }],
    });

    const suppliersHeaders = ['Produit', 'Fournisseur', 'Principal ?', 'PU HT', 'Délai', 'Frais livraison', 'Ref fournisseur', 'URL'];
    const suppliersRows = productSuppliers.map(ps => [
      ps.product.reference, ps.supplier.name, ps.isPrimary,
      ps.unitPrice ? Number(ps.unitPrice) : '', ps.leadTime || '',
      ps.shippingCost ? Number(ps.shippingCost) : '', ps.supplierRef || '', ps.productUrl || '',
    ]);

    XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet([suppliersHeaders, ...suppliersRows]), 'REF FOURNISSEURS');

    // 3. MVT CLASSIK
    const movements = await prisma.stockMovement.findMany({
      include: { product: true, sourceSite: true, targetSite: true },
      orderBy: { movementDate: 'desc' },
    });

    const mvtHeaders = ['Produit', 'Mouvement', 'Source', 'Cible', 'Qté', 'Date', 'Opérateur', 'Commentaire'];
    const mvtRows = movements.map(m => [
      m.product.reference, mapMovementType(m.type),
      m.sourceSite ? `${m.sourceSite.name} : ${m.condition === 'NEW' ? 'neuf' : 'occasion'}` : '',
      m.targetSite ? `${m.targetSite.name} : ${m.condition === 'NEW' ? 'neuf' : 'occasion'}` : '',
      m.quantity, m.movementDate.toISOString().split('T')[0],
      m.operator || '', m.comment || '',
    ]);

    XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet([mvtHeaders, ...mvtRows]), 'MVT CLASSIK');

    // 4. COMMANDES CLASSIK
    const orders = await prisma.order.findMany({
      include: { product: true, supplier: true, destinationSite: true },
      orderBy: { orderDate: 'desc' },
    });

    const orderHeaders = ['Produit', 'Fournisseur', 'Qté', 'État commande', 'Destination', 'Date commande', 'Date prévue', 'Qté reçue', 'Responsable', 'Commentaire'];
    const orderRows = orders.map(o => [
      o.product.reference, o.supplier.name, o.quantity, mapOrderStatus(o.status),
      o.destinationSite?.name || '', o.orderDate.toISOString().split('T')[0],
      o.expectedDate?.toISOString().split('T')[0] || '', o.receivedQty || '',
      o.responsible || '', o.comment || '',
    ]);

    XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet([orderHeaders, ...orderRows]), 'COMMANDES CLASSIK');

    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=export_complet_${new Date().toISOString().split('T')[0]}.xlsx`);
    res.send(buffer);
  } catch (error) {
    next(error);
  }
};

// Helper functions
function mapRiskToFrench(risk: string | null): string {
  if (!risk) return '';
  const map: Record<string, string> = {
    HIGH: 'Élevé',
    MEDIUM: 'Moyen',
    LOW: 'Faible',
  };
  return map[risk] || risk;
}

function mapMovementType(type: string): string {
  const map: Record<string, string> = {
    IN: 'Entrée',
    OUT: 'Sortie',
    TRANSFER: 'Déplacement',
  };
  return map[type] || type;
}

function mapOrderStatus(status: string): string {
  const map: Record<string, string> = {
    PENDING: 'En cours',
    COMPLETED: 'Terminé',
    CANCELLED: 'Annulé',
  };
  return map[status] || status;
}
