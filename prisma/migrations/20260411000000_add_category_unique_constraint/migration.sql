-- AddUniqueConstraint
CREATE UNIQUE INDEX "categories_parent_id_name_key" ON "categories"("parent_id", "name");
