-- AlterTable
ALTER TABLE "modules" ADD COLUMN "subject" TEXT;

-- Populate existing modules with their subjects
UPDATE "modules" SET "subject" = 'Dashboard' WHERE "slug" = 'dashboard';
UPDATE "modules" SET "subject" = 'User' WHERE "slug" = 'usuarios';
UPDATE "modules" SET "subject" = 'Report' WHERE "slug" = 'reportes';
UPDATE "modules" SET "subject" = 'Document' WHERE "slug" = 'documentos';
UPDATE "modules" SET "subject" = 'Institution' WHERE "slug" = 'instituciones';
UPDATE "modules" SET "subject" = 'Notification' WHERE "slug" = 'notificaciones';
UPDATE "modules" SET "subject" = 'Role' WHERE "slug" = 'roles';
UPDATE "modules" SET "subject" = 'Module' WHERE "slug" = 'modulos';
UPDATE "modules" SET "subject" = 'Setting' WHERE "slug" = 'configuracion';

-- CreateIndex
CREATE UNIQUE INDEX "modules_subject_key" ON "modules"("subject");
