-- AlterTable: Add orderNumber (nullable initially) and createdBy
ALTER TABLE "orders" ADD COLUMN "orderNumber" TEXT;
ALTER TABLE "orders" ADD COLUMN "createdBy" TEXT;

-- Backfill orderNumber for existing orders
WITH numbered AS (
  SELECT
    id,
    EXTRACT(YEAR FROM "createdAt")::INTEGER AS yr,
    ROW_NUMBER() OVER (
      PARTITION BY EXTRACT(YEAR FROM "createdAt")
      ORDER BY "createdAt", id
    ) AS seq
  FROM "orders"
)
UPDATE "orders" o
SET "orderNumber" = 'CMD-' || n.yr || '-' || LPAD(n.seq::TEXT, 4, '0')
FROM numbered n
WHERE o.id = n.id;

-- Make orderNumber NOT NULL and UNIQUE
ALTER TABLE "orders" ALTER COLUMN "orderNumber" SET NOT NULL;
CREATE UNIQUE INDEX "orders_orderNumber_key" ON "orders"("orderNumber");
