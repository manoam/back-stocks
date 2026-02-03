import { PrismaClient, SiteType, OrderStatus, SupplyRisk, MovementType, ProductCondition } from '@prisma/client';
import * as XLSX from 'xlsx';

const prisma = new PrismaClient();

const excelPath = 'C:/Users/manoa/Downloads/Nomenclatures Bornes et Stocks.xlsx';

// Sites prédéfinis basés sur les colonnes du fichier
const PREDEFINED_SITES = [
  { name: 'Siège', type: SiteType.STORAGE },
  { name: 'MBE', type: SiteType.STORAGE },
  { name: 'Homebox', type: SiteType.STORAGE },
  { name: 'Talendi', type: SiteType.STORAGE },
  { name: 'TJMI', type: SiteType.STORAGE },
  { name: 'Michel', type: SiteType.STORAGE },
  { name: 'Sortie Création', type: SiteType.EXIT },
  { name: 'Sortie Rétrofit', type: SiteType.EXIT },
  { name: 'Sortie Poubelle', type: SiteType.EXIT },
];

async function main() {
  console.log('Reading Excel file...');
  const workbook = XLSX.readFile(excelPath);
  console.log('Available sheets:', workbook.SheetNames);

  // Maps for lookups
  const supplierMap = new Map<string, string>();
  const siteMap = new Map<string, string>();
  const productMap = new Map<string, string>();
  const groupMap = new Map<string, string>();

  // 1. Create predefined sites
  console.log('\n--- Creating Sites ---');
  for (const siteData of PREDEFINED_SITES) {
    try {
      const site = await prisma.site.create({
        data: siteData,
      });
      siteMap.set(siteData.name, site.id);
      console.log(`  Created site: ${siteData.name}`);
    } catch (e) {
      // Try to find existing
      const existing = await prisma.site.findUnique({ where: { name: siteData.name } });
      if (existing) {
        siteMap.set(siteData.name, existing.id);
        console.log(`  Found existing site: ${siteData.name}`);
      }
    }
  }

  // 2. Import Suppliers (FOURNISSEURS sheet)
  const suppliersSheet = workbook.Sheets['FOURNISSEURS'];
  if (suppliersSheet) {
    console.log('\n--- Importing Suppliers ---');
    const suppliers = XLSX.utils.sheet_to_json<any>(suppliersSheet);

    for (const row of suppliers) {
      const name = row['FOURNISSEUR'];
      if (name && typeof name === 'string' && name.trim()) {
        try {
          const supplier = await prisma.supplier.create({
            data: {
              name: name.trim(),
              contact: row['CONTACT'] || null,
              email: row['EMAIL'] || null,
              phone: row['TEL']?.toString() || null,
              website: row['LIEN'] || null,
              address: row['ADRESSE'] || null,
              comment: row['COMMENTAIRE'] || null,
            },
          });
          supplierMap.set(name.trim(), supplier.id);
          console.log(`  Created supplier: ${name}`);
        } catch (e) {
          // Try to find existing
          const existing = await prisma.supplier.findUnique({ where: { name: name.trim() } });
          if (existing) {
            supplierMap.set(name.trim(), existing.id);
            console.log(`  Found existing supplier: ${name}`);
          }
        }
      }
    }
  }

  // 3. Import Products (PRODUITS sheet)
  const productsSheet = workbook.Sheets['PRODUITS'];
  if (productsSheet) {
    console.log('\n--- Importing Products ---');
    const products = XLSX.utils.sheet_to_json<any>(productsSheet);

    for (const row of products) {
      const reference = row['Référence produit'];
      if (reference && typeof reference === 'string' && reference.trim()) {
        try {
          // Handle ensemble (assembly)
          let assemblyId: string | null = null;
          const ensemble = row['Ensemble'];
          if (ensemble && typeof ensemble === 'string' && ensemble.trim()) {
            if (!groupMap.has(ensemble)) {
              try {
                const assembly = await prisma.assembly.create({
                  data: { name: ensemble.trim() },
                });
                groupMap.set(ensemble, assembly.id);
              } catch {
                const existing = await prisma.assembly.findUnique({ where: { name: ensemble.trim() } });
                if (existing) groupMap.set(ensemble, existing.id);
              }
            }
            assemblyId = groupMap.get(ensemble) || null;
          }

          // Map risk level
          let supplyRisk: SupplyRisk | null = null;
          const risk = row['Risques appro']?.toUpperCase?.();
          if (risk === 'FORT' || risk === 'HIGH') supplyRisk = SupplyRisk.HIGH;
          else if (risk === 'MOYEN' || risk === 'MEDIUM') supplyRisk = SupplyRisk.MEDIUM;
          else if (risk === 'FAIBLE' || risk === 'LOW') supplyRisk = SupplyRisk.LOW;

          const product = await prisma.product.create({
            data: {
              reference: reference.trim(),
              description: row['Description'] || null,
              qtyPerUnit: row['Qté 1 borne'] || 1,
              supplyRisk,
              location: row['Emplacement'] || null,
              assemblyId,
              comment: row['Commentaire'] || null,
            },
          });
          productMap.set(reference.trim(), product.id);
          console.log(`  Created product: ${reference}`);
        } catch (e) {
          // Try to find existing
          const existing = await prisma.product.findUnique({ where: { reference: reference.trim() } });
          if (existing) {
            productMap.set(reference.trim(), existing.id);
            console.log(`  Found existing product: ${reference}`);
          }
        }
      }
    }
  }

  // 4. Import Product-Supplier links (REF FOURNISSEURS sheet)
  const refFournisseursSheet = workbook.Sheets['REF FOURNISSEURS'];
  if (refFournisseursSheet) {
    console.log('\n--- Importing Product-Supplier Links ---');
    const refs = XLSX.utils.sheet_to_json<any>(refFournisseursSheet);

    for (const row of refs) {
      const productRef = row['Produit'];
      const supplierName = row['Fournisseur'];

      const productId = productMap.get(productRef);
      const supplierId = supplierMap.get(supplierName);

      if (productId && supplierId) {
        try {
          await prisma.productSupplier.create({
            data: {
              productId,
              supplierId,
              supplierRef: row['Ref fournisseur'] || null,
              leadTime: row['Délai'] || null,
              unitPrice: row['PU HT'] || null,
              productUrl: row['Lien fournisseur'] || null,
              shippingCost: row['Frais livraison'] || null,
              isPrimary: row['Principal ?'] === true,
            },
          });
          console.log(`  Linked: ${productRef} <-> ${supplierName}`);
        } catch (e) {
          console.log(`  Skipped link (may exist): ${productRef} <-> ${supplierName}`);
        }
      }
    }
  }

  // 5. Import Initial Stocks (STOCK INITIAL sheet)
  const stockSheet = workbook.Sheets['STOCK INITIAL'];
  if (stockSheet) {
    console.log('\n--- Importing Initial Stocks ---');
    const stocks = XLSX.utils.sheet_to_json<any>(stockSheet);

    // Site column mappings
    const siteColumns: { colNeuf: string; colOccasion: string; siteName: string }[] = [
      { colNeuf: 'SI Siège : neuf', colOccasion: 'SI Siège : occasion', siteName: 'Siège' },
      { colNeuf: 'SI MBE : neuf', colOccasion: 'SI MBE : occasion', siteName: 'MBE' },
      { colNeuf: 'SI Homebox : neuf', colOccasion: 'SI Homebox : occasion', siteName: 'Homebox' },
      { colNeuf: 'SI Talendi : neuf', colOccasion: 'SI Talendi : occasion', siteName: 'Talendi' },
      { colNeuf: 'SI TJMI : neuf', colOccasion: 'SI TJMI : occasion', siteName: 'TJMI' },
      { colNeuf: 'SI Michel : neuf', colOccasion: 'SI Michel : occasion', siteName: 'Michel' },
    ];

    for (const row of stocks) {
      const productRef = row['Produit'];
      const productId = productMap.get(productRef);

      if (productId) {
        for (const mapping of siteColumns) {
          const qtyNeuf = row[mapping.colNeuf] || 0;
          const qtyOccasion = row[mapping.colOccasion] || 0;
          const siteId = siteMap.get(mapping.siteName);

          if (siteId && (qtyNeuf > 0 || qtyOccasion > 0)) {
            try {
              await prisma.stock.create({
                data: {
                  productId,
                  siteId,
                  quantityNew: qtyNeuf,
                  quantityUsed: qtyOccasion,
                },
              });
              console.log(`  Stock: ${productRef} @ ${mapping.siteName}: ${qtyNeuf} neuf, ${qtyOccasion} occasion`);
            } catch (e) {
              console.log(`  Skipped stock (may exist): ${productRef} @ ${mapping.siteName}`);
            }
          }
        }
      }
    }
  }

  // 6. Import Orders (COMMANDES CLASSIK sheet)
  const ordersSheet = workbook.Sheets['COMMANDES CLASSIK'];
  if (ordersSheet) {
    console.log('\n--- Importing Orders ---');
    const orders = XLSX.utils.sheet_to_json<any>(ordersSheet);

    for (const row of orders) {
      const productRef = row['Produit'];
      const supplierName = row['Fournisseur'];

      const productId = productMap.get(productRef);
      const supplierId = supplierMap.get(supplierName);

      if (productId && supplierId) {
        try {
          // Map status
          let status: OrderStatus = OrderStatus.PENDING;
          const st = row['État commande']?.toUpperCase?.();
          if (st === 'TERMINÉ' || st === 'TERMINE' || st === 'REÇU' || st === 'COMPLETED') {
            status = OrderStatus.COMPLETED;
          } else if (st === 'ANNULÉ' || st === 'CANCELLED') {
            status = OrderStatus.CANCELLED;
          }

          // Parse dates (Excel serial)
          const parseExcelDate = (val: any): Date => {
            if (typeof val === 'number') {
              return new Date((val - 25569) * 86400 * 1000);
            }
            return val ? new Date(val) : new Date();
          };

          // Parse destination site
          let destinationSiteId: string | null = null;
          const dest = row['Destination'];
          if (dest) {
            // Extract site name from "Siège : neuf" format
            const siteName = dest.split(':')[0].trim();
            destinationSiteId = siteMap.get(siteName) || null;
          }

          await prisma.order.create({
            data: {
              productId,
              supplierId,
              quantity: row['Qté'] || 1,
              orderDate: parseExcelDate(row['Date']),
              expectedDate: row['Réception prévue'] ? parseExcelDate(row['Réception prévue']) : null,
              receivedDate: row['Réception réelle '] ? parseExcelDate(row['Réception réelle ']) : null,
              receivedQty: row['Qté reçue'] || null,
              status,
              supplierRef: row['Réf fournisseur'] || null,
              destinationSiteId,
              responsible: row['Resp.'] || null,
              comment: row['Commentaire'] || null,
            },
          });
          console.log(`  Order: ${productRef} from ${supplierName} (${status})`);
        } catch (e) {
          console.log(`  Skipped order: ${productRef}`);
        }
      }
    }
  }

  // 7. Import Movements (MVT CLASSIK sheet)
  const movementsSheet = workbook.Sheets['MVT CLASSIK'];
  if (movementsSheet) {
    console.log('\n--- Importing Movements ---');
    const movements = XLSX.utils.sheet_to_json<any>(movementsSheet);

    for (const row of movements) {
      const productRef = row['Produit'];
      const productId = productMap.get(productRef);

      if (productId) {
        try {
          // Map movement type
          let type: MovementType = MovementType.IN;
          const mvt = row['Mouvement']?.toUpperCase?.();
          if (mvt === 'SORTIE' || mvt === 'OUT') type = MovementType.OUT;
          else if (mvt === 'TRANSFERT' || mvt === 'TRANSFER') type = MovementType.TRANSFER;
          else if (mvt === 'ENTRÉE' || mvt === 'ENTREE' || mvt === 'IN') type = MovementType.IN;

          // Parse source/target sites
          const parseConditionFromSite = (site: string): ProductCondition => {
            if (site?.toLowerCase().includes('occasion')) return ProductCondition.USED;
            return ProductCondition.NEW;
          };

          const parseSiteId = (siteStr: string): string | null => {
            if (!siteStr) return null;
            const siteName = siteStr.split(':')[0].trim();
            return siteMap.get(siteName) || null;
          };

          const source = row['Source'] || '';
          const target = row['Cible'] || '';

          const condition = parseConditionFromSite(source) || parseConditionFromSite(target);

          // Parse date
          const parseExcelDate = (val: any): Date => {
            if (typeof val === 'number') {
              return new Date((val - 25569) * 86400 * 1000);
            }
            return val ? new Date(val) : new Date();
          };

          await prisma.stockMovement.create({
            data: {
              productId,
              type,
              sourceSiteId: parseSiteId(source),
              targetSiteId: parseSiteId(target),
              quantity: row['Qté'] || 1,
              condition,
              movementDate: parseExcelDate(row['Date']),
              operator: row['Opérateur'] || null,
              comment: row['Commentaire'] || null,
            },
          });
          console.log(`  Movement: ${productRef} (${type})`);
        } catch (e: any) {
          console.log(`  Skipped movement: ${productRef} - ${e.message || e}`);
        }
      }
    }
  }

  console.log('\n========== Import Complete ==========');
  console.log(`Suppliers: ${supplierMap.size}`);
  console.log(`Sites: ${siteMap.size}`);
  console.log(`Products: ${productMap.size}`);
  console.log(`Assemblies: ${groupMap.size}`);

  // Verify counts
  const counts = {
    products: await prisma.product.count(),
    suppliers: await prisma.supplier.count(),
    sites: await prisma.site.count(),
    stocks: await prisma.stock.count(),
    orders: await prisma.order.count(),
    movements: await prisma.stockMovement.count(),
  };
  console.log('\nDatabase counts:', counts);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
