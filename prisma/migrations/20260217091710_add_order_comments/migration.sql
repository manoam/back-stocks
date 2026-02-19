-- CreateTable
CREATE TABLE "order_comments" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "authorUsername" TEXT NOT NULL,
    "authorName" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "order_comments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "order_comments_orderId_idx" ON "order_comments"("orderId");

-- CreateIndex
CREATE INDEX "order_comments_authorId_idx" ON "order_comments"("authorId");

-- AddForeignKey
ALTER TABLE "order_comments" ADD CONSTRAINT "order_comments_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;
