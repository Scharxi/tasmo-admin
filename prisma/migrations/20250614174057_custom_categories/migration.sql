/*
  Warnings:

  - You are about to drop the column `category` on the `devices` table. All the data in the column will be lost.
  - You are about to drop the column `room` on the `devices` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "devices" DROP COLUMN "category",
DROP COLUMN "room",
ADD COLUMN     "category_id" TEXT;

-- DropEnum
DROP TYPE "DeviceCategory";

-- CreateTable
CREATE TABLE "categories" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "color" TEXT NOT NULL,
    "icon" TEXT,
    "description" TEXT,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "categories_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "categories_name_key" ON "categories"("name");

-- AddForeignKey
ALTER TABLE "devices" ADD CONSTRAINT "devices_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;
