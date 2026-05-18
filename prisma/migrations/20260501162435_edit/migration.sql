-- CreateTable
CREATE TABLE "loggings" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "log" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "loggings_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "loggings" ADD CONSTRAINT "loggings_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
