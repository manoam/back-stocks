-- AlterTable
ALTER TABLE "products" ADD COLUMN     "assemblyTypeId" TEXT;

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_assemblyTypeId_fkey" FOREIGN KEY ("assemblyTypeId") REFERENCES "assembly_types"("id") ON DELETE SET NULL ON UPDATE CASCADE;
