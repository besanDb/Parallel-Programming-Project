-- CreateTable
CREATE TABLE "inventory_reports" (
    "id" SERIAL NOT NULL,
    "product_id" INTEGER NOT NULL,
    "soldQuantity" INTEGER NOT NULL,
    "currentStock" INTEGER NOT NULL,
    "expectedStock" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "inventory_reports_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "inventory_reports" ADD CONSTRAINT "inventory_reports_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;
