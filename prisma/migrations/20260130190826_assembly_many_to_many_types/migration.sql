/*
  Warnings:

  - You are about to drop the column `assemblyTypeId` on the `assemblies` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "assemblies" DROP CONSTRAINT "assemblies_assemblyTypeId_fkey";

-- AlterTable
ALTER TABLE "assemblies" DROP COLUMN "assemblyTypeId";

-- CreateTable
CREATE TABLE "assembly_assembly_types" (
    "id" TEXT NOT NULL,
    "assemblyId" TEXT NOT NULL,
    "assemblyTypeId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "assembly_assembly_types_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "assembly_assembly_types_assemblyId_assemblyTypeId_key" ON "assembly_assembly_types"("assemblyId", "assemblyTypeId");

-- AddForeignKey
ALTER TABLE "assembly_assembly_types" ADD CONSTRAINT "assembly_assembly_types_assemblyId_fkey" FOREIGN KEY ("assemblyId") REFERENCES "assemblies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assembly_assembly_types" ADD CONSTRAINT "assembly_assembly_types_assemblyTypeId_fkey" FOREIGN KEY ("assemblyTypeId") REFERENCES "assembly_types"("id") ON DELETE CASCADE ON UPDATE CASCADE;
