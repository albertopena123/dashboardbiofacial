-- CreateEnum
CREATE TYPE "DocumentType" AS ENUM ('DNI', 'CE', 'PASAPORTE');

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "document_type" "DocumentType" NOT NULL DEFAULT 'DNI';
