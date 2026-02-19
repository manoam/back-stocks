-- AlterTable: add minStock to products
ALTER TABLE "products" ADD COLUMN "minStock" INTEGER;

-- CreateTable: part_categories
CREATE TABLE "part_categories" (
    "id" TEXT NOT NULL,
    "assemblyTypeId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "part_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable: product_part_categories (junction)
CREATE TABLE "product_part_categories" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "partCategoryId" TEXT NOT NULL,

    CONSTRAINT "product_part_categories_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "part_categories_assemblyTypeId_name_key" ON "part_categories"("assemblyTypeId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "product_part_categories_productId_partCategoryId_key" ON "product_part_categories"("productId", "partCategoryId");

-- AddForeignKey
ALTER TABLE "part_categories" ADD CONSTRAINT "part_categories_assemblyTypeId_fkey" FOREIGN KEY ("assemblyTypeId") REFERENCES "assembly_types"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_part_categories" ADD CONSTRAINT "product_part_categories_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_part_categories" ADD CONSTRAINT "product_part_categories_partCategoryId_fkey" FOREIGN KEY ("partCategoryId") REFERENCES "part_categories"("id") ON DELETE CASCADE ON UPDATE CASCADE;
