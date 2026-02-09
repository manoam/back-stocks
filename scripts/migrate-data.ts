import { PrismaClient } from '@prisma/client';

// Connexion à la base locale
const localDb = new PrismaClient({
  datasources: {
    db: {
      url: 'postgresql://postgres:postgres@localhost:5432/stock_management',
    },
  },
});

// Connexion à la base de production
const prodDb = new PrismaClient({
  datasources: {
    db: {
      url: process.env.PROD_DATABASE_URL,
    },
  },
});

async function migrateData() {
  console.log('🚀 Début de la migration des données...\n');

  try {
    // 1. Assembly Types
    console.log('📦 Migration des types d\'assemblage...');
    const assemblyTypes = await localDb.assemblyType.findMany();
    for (const item of assemblyTypes) {
      await prodDb.assemblyType.upsert({
        where: { id: item.id },
        update: item,
        create: item,
      });
    }
    console.log(`   ✅ ${assemblyTypes.length} types d'assemblage migrés`);

    // 2. Assemblies
    console.log('📦 Migration des assemblages...');
    const assemblies = await localDb.assembly.findMany();
    for (const item of assemblies) {
      await prodDb.assembly.upsert({
        where: { id: item.id },
        update: item,
        create: item,
      });
    }
    console.log(`   ✅ ${assemblies.length} assemblages migrés`);

    // 3. Assembly-AssemblyType relations
    console.log('📦 Migration des relations assemblage-type...');
    const assemblyAssemblyTypes = await localDb.assemblyAssemblyType.findMany();
    for (const item of assemblyAssemblyTypes) {
      await prodDb.assemblyAssemblyType.upsert({
        where: { id: item.id },
        update: item,
        create: item,
      });
    }
    console.log(`   ✅ ${assemblyAssemblyTypes.length} relations migrées`);

    // 4. Suppliers
    console.log('📦 Migration des fournisseurs...');
    const suppliers = await localDb.supplier.findMany();
    for (const item of suppliers) {
      await prodDb.supplier.upsert({
        where: { id: item.id },
        update: item,
        create: item,
      });
    }
    console.log(`   ✅ ${suppliers.length} fournisseurs migrés`);

    // 5. Sites
    console.log('📦 Migration des sites...');
    const sites = await localDb.site.findMany();
    for (const item of sites) {
      await prodDb.site.upsert({
        where: { id: item.id },
        update: item,
        create: item,
      });
    }
    console.log(`   ✅ ${sites.length} sites migrés`);

    // 6. Products
    console.log('📦 Migration des produits...');
    const products = await localDb.product.findMany();
    for (const item of products) {
      await prodDb.product.upsert({
        where: { id: item.id },
        update: item,
        create: item,
      });
    }
    console.log(`   ✅ ${products.length} produits migrés`);

    // 7. Product Suppliers
    console.log('📦 Migration des liens produit-fournisseur...');
    const productSuppliers = await localDb.productSupplier.findMany();
    for (const item of productSuppliers) {
      await prodDb.productSupplier.upsert({
        where: { id: item.id },
        update: item,
        create: item,
      });
    }
    console.log(`   ✅ ${productSuppliers.length} liens migrés`);

    // 8. Stocks
    console.log('📦 Migration des stocks...');
    const stocks = await localDb.stock.findMany();
    for (const item of stocks) {
      await prodDb.stock.upsert({
        where: { id: item.id },
        update: item,
        create: item,
      });
    }
    console.log(`   ✅ ${stocks.length} stocks migrés`);

    // 9. Stock Movements
    console.log('📦 Migration des mouvements de stock...');
    const movements = await localDb.stockMovement.findMany();
    for (const item of movements) {
      await prodDb.stockMovement.upsert({
        where: { id: item.id },
        update: item,
        create: item,
      });
    }
    console.log(`   ✅ ${movements.length} mouvements migrés`);

    // 10. Orders
    console.log('📦 Migration des commandes...');
    const orders = await localDb.order.findMany();
    for (const item of orders) {
      await prodDb.order.upsert({
        where: { id: item.id },
        update: item,
        create: item,
      });
    }
    console.log(`   ✅ ${orders.length} commandes migrées`);

    // 11. Packs
    console.log('📦 Migration des packs...');
    const packs = await localDb.pack.findMany();
    for (const item of packs) {
      await prodDb.pack.upsert({
        where: { id: item.id },
        update: item,
        create: item,
      });
    }
    console.log(`   ✅ ${packs.length} packs migrés`);

    // 12. Pack Items
    console.log('📦 Migration des éléments de pack...');
    const packItems = await localDb.packItem.findMany();
    for (const item of packItems) {
      await prodDb.packItem.upsert({
        where: { id: item.id },
        update: item,
        create: item,
      });
    }
    console.log(`   ✅ ${packItems.length} éléments de pack migrés`);

    console.log('\n✅ Migration terminée avec succès !');
  } catch (error) {
    console.error('\n❌ Erreur lors de la migration:', error);
    throw error;
  } finally {
    await localDb.$disconnect();
    await prodDb.$disconnect();
  }
}

migrateData();
