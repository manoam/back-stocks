-- CreateTable: order_items
CREATE TABLE "order_items" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unitPrice" DECIMAL(10,2),
    "receivedQty" INTEGER,
    "receivedDate" TIMESTAMP(3),
    "condition" TEXT,

    CONSTRAINT "order_items_pkey" PRIMARY KEY ("id")
);

-- Migrate existing orders data into order_items
INSERT INTO "order_items" ("id", "orderId", "productId", "quantity", "receivedQty", "receivedDate", "condition")
SELECT
    gen_random_uuid()::text,
    o."id",
    o."productId",
    o."quantity",
    o."receivedQty",
    o."receivedDate",
    CASE WHEN o."status" = 'COMPLETED' THEN 'NEW' ELSE NULL END
FROM "orders" o;

-- Add title column to orders
ALTER TABLE "orders" ADD COLUMN "title" TEXT;

-- Drop old columns from orders
ALTER TABLE "orders" DROP COLUMN "productId";
ALTER TABLE "orders" DROP COLUMN "quantity";
ALTER TABLE "orders" DROP COLUMN "receivedQty";

-- AddForeignKey
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;
