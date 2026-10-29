-- CreateEnum
CREATE TYPE "CategoriaFotoActa" AS ENUM ('VEHICULO', 'DOCUMENTO');

-- CreateTable
CREATE TABLE "FotoActa" (
    "id" TEXT NOT NULL,
    "actaId" TEXT NOT NULL,
    "categoria" "CategoriaFotoActa" NOT NULL,
    "url" TEXT NOT NULL,
    "orden" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FotoActa_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "FotoActa_actaId_idx" ON "FotoActa"("actaId");

-- AddForeignKey
ALTER TABLE "FotoActa" ADD CONSTRAINT "FotoActa_actaId_fkey" FOREIGN KEY ("actaId") REFERENCES "Acta"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- DataMigration: antes de borrar las columnas viejas, se copia la foto que
-- ya tenían (una por categoría) a la tabla nueva, para no perder evidencia.
INSERT INTO "FotoActa" ("id", "actaId", "categoria", "url", "orden", "createdAt")
SELECT gen_random_uuid()::text, "id", 'VEHICULO', "fotoVehiculoUrl", 0, "createdAt"
FROM "Acta"
WHERE "fotoVehiculoUrl" IS NOT NULL;

INSERT INTO "FotoActa" ("id", "actaId", "categoria", "url", "orden", "createdAt")
SELECT gen_random_uuid()::text, "id", 'DOCUMENTO', "fotoDocumentoUrl", 0, "createdAt"
FROM "Acta"
WHERE "fotoDocumentoUrl" IS NOT NULL;

-- AlterTable
ALTER TABLE "Acta" DROP COLUMN "fotoDocumentoUrl",
DROP COLUMN "fotoVehiculoUrl";
