/*
  Warnings:

  - You are about to drop the column `groupId` on the `products` table. All the data in the column will be lost.
  - You are about to drop the `product_assemblies` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `product_groups` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "product_assemblies" DROP CONSTRAINT "product_assemblies_assemblyId_fkey";

-- DropForeignKey
ALTER TABLE "product_assemblies" DROP CONSTRAINT "product_assemblies_productId_fkey";

-- DropForeignKey
ALTER TABLE "products" DROP CONSTRAINT "products_groupId_fkey";

-- AlterTable
ALTER TABLE "products" DROP COLUMN "groupId",
ADD COLUMN     "productTypeId" TEXT;

-- DropTable
DROP TABLE "product_assemblies";

-- DropTable
DROP TABLE "product_groups";

-- CreateTable
CREATE TABLE "product_types" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "assemblyId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "product_types_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "product_types_name_key" ON "product_types"("name");

-- AddForeignKey
ALTER TABLE "product_types" ADD CONSTRAINT "product_types_assemblyId_fkey" FOREIGN KEY ("assemblyId") REFERENCES "assemblies"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_productTypeId_fkey" FOREIGN KEY ("productTypeId") REFERENCES "product_types"("id") ON DELETE SET NULL ON UPDATE CASCADE;
