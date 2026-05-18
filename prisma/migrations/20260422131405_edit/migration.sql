/*
  Warnings:

  - You are about to drop the column `createdAt` on the `carts` table. All the data in the column will be lost.
  - You are about to drop the column `order_id` on the `carts_items` table. All the data in the column will be lost.
  - Added the required column `cart_id` to the `carts_items` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updated_at` to the `products` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "Status" AS ENUM ('PENDING', 'DELIVERED', 'CANCELLED');

-- DropForeignKey
ALTER TABLE "carts_items" DROP CONSTRAINT "carts_items_order_id_fkey";

-- AlterTable
ALTER TABLE "carts" DROP COLUMN "createdAt",
ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "carts_items" DROP COLUMN "order_id",
ADD COLUMN     "cart_id" INTEGER NOT NULL,
ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "products" ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "refresh_token" TEXT;

-- CreateTable
CREATE TABLE "orders" (
    "id" SERIAL NOT NULL,
    "cart_id" INTEGER NOT NULL,
    "status" "Status" NOT NULL DEFAULT 'PENDING',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "orders_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "carts_items" ADD CONSTRAINT "carts_items_cart_id_fkey" FOREIGN KEY ("cart_id") REFERENCES "carts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
