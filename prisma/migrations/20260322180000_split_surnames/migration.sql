-- AlterTable: split last_name into paternal_surname + maternal_surname
ALTER TABLE "users" ADD COLUMN "paternal_surname" TEXT;
ALTER TABLE "users" ADD COLUMN "maternal_surname" TEXT;

-- Migrate existing data: use last_name as paternal_surname, empty string for maternal
UPDATE "users" SET "paternal_surname" = "last_name", "maternal_surname" = '';

-- Make columns required
ALTER TABLE "users" ALTER COLUMN "paternal_surname" SET NOT NULL;
ALTER TABLE "users" ALTER COLUMN "maternal_surname" SET NOT NULL;

-- Drop old column
ALTER TABLE "users" DROP COLUMN "last_name";
