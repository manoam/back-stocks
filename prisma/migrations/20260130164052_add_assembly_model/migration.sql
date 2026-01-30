-- CreateTable
CREATE TABLE "assemblies" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "assemblies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_assemblies" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "assemblyId" TEXT NOT NULL,
    "quantityUsed" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "product_assemblies_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "assemblies_name_key" ON "assemblies"("name");

-- CreateIndex
CREATE UNIQUE INDEX "product_assemblies_productId_assemblyId_key" ON "product_assemblies"("productId", "assemblyId");

-- AddForeignKey
ALTER TABLE "product_assemblies" ADD CONSTRAINT "product_assemblies_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_assemblies" ADD CONSTRAINT "product_assemblies_assemblyId_fkey" FOREIGN KEY ("assemblyId") REFERENCES "assemblies"("id") ON DELETE CASCADE ON UPDATE CASCADE;
