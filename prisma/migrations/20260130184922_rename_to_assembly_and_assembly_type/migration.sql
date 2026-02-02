/*
  Warnings:

  - You are about to drop the column `productTypeId` on the `products` table. All the data in the column will be lost.
  - You are about to drop the `product_types` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "product_types" DROP CONSTRAINT "product_types_assemblyId_fkey";

-- DropForeignKey
ALTER TABLE "products" DROP CONSTRAINT "products_productTypeId_fkey";

-- AlterTable
ALTER TABLE "assemblies" ADD COLUMN     "assemblyTypeId" TEXT;

-- AlterTable
ALTER TABLE "products" DROP COLUMN "productTypeId",
ADD COLUMN     "assemblyId" TEXT;

-- DropTable
DROP TABLE "product_types";

-- CreateTable
CREATE TABLE "assembly_types" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "assembly_types_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "assembly_types_name_key" ON "assembly_types"("name");

-- AddForeignKey
ALTER TABLE "assemblies" ADD CONSTRAINT "assemblies_assemblyTypeId_fkey" FOREIGN KEY ("assemblyTypeId") REFERENCES "assembly_types"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_assemblyId_fkey" FOREIGN KEY ("assemblyId") REFERENCES "assemblies"("id") ON DELETE SET NULL ON UPDATE CASCADE;
