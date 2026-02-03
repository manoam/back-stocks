-- CreateEnum
CREATE TYPE "PackType" AS ENUM ('IN', 'OUT');

-- CreateTable
CREATE TABLE "packs" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "PackType" NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "packs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pack_items" (
    "id" TEXT NOT NULL,
    "packId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,

    CONSTRAINT "pack_items_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "packs_name_key" ON "packs"("name");

-- CreateIndex
CREATE UNIQUE INDEX "pack_items_packId_productId_key" ON "pack_items"("packId", "productId");

-- AddForeignKey
ALTER TABLE "pack_items" ADD CONSTRAINT "pack_items_packId_fkey" FOREIGN KEY ("packId") REFERENCES "packs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pack_items" ADD CONSTRAINT "pack_items_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;
