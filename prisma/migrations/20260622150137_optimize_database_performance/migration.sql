-- CreateIndex
CREATE INDEX "carts_items_cart_id_idx" ON "carts_items"("cart_id");

-- CreateIndex
CREATE INDEX "carts_items_product_id_idx" ON "carts_items"("product_id");

-- CreateIndex
CREATE INDEX "inventory_reports_product_id_idx" ON "inventory_reports"("product_id");

-- CreateIndex
CREATE INDEX "inventory_reports_created_at_idx" ON "inventory_reports"("created_at");

-- CreateIndex
CREATE INDEX "orders_user_id_idx" ON "orders"("user_id");

-- CreateIndex
CREATE INDEX "orders_created_at_idx" ON "orders"("created_at");

-- CreateIndex
CREATE INDEX "orders_items_order_id_idx" ON "orders_items"("order_id");

-- CreateIndex
CREATE INDEX "products_created_at_idx" ON "products"("created_at");

-- CreateIndex
CREATE INDEX "users_refresh_token_idx" ON "users"("refresh_token");
