-- AlterTable
ALTER TABLE "suppliers" ADD COLUMN     "city" TEXT,
ADD COLUMN     "country" TEXT,
ADD COLUMN     "latitude" DECIMAL(10,8),
ADD COLUMN     "longitude" DECIMAL(11,8),
ADD COLUMN     "postalCode" TEXT;
