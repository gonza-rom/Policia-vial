-- CreateEnum
CREATE TYPE "TipoActa" AS ENUM ('MUNICIPAL', 'CONTRAVENCIONAL');

-- CreateEnum
CREATE TYPE "TipoCampoContravencional" AS ENUM ('TEXTO', 'TEXTO_LARGO', 'NUMERO', 'FECHA');

-- AlterTable
ALTER TABLE "Acta" ADD COLUMN     "datosContravencional" JSONB,
ADD COLUMN     "firmaSecretarioUrl" TEXT,
ADD COLUMN     "tipo" "TipoActa" NOT NULL DEFAULT 'MUNICIPAL',
ALTER COLUMN "conductorNombre" DROP NOT NULL,
ALTER COLUMN "conductorDni" DROP NOT NULL,
ALTER COLUMN "vehiculoDominio" DROP NOT NULL,
ALTER COLUMN "vehiculoTipo" DROP NOT NULL,
ALTER COLUMN "montoBase" DROP NOT NULL,
ALTER COLUMN "montoConDescuento" DROP NOT NULL;

-- CreateTable
CREATE TABLE "CampoContravencional" (
    "id" TEXT NOT NULL,
    "clave" TEXT NOT NULL,
    "etiqueta" TEXT NOT NULL,
    "seccion" TEXT NOT NULL,
    "tipo" "TipoCampoContravencional" NOT NULL DEFAULT 'TEXTO',
    "orden" INTEGER NOT NULL DEFAULT 0,
    "requerido" BOOLEAN NOT NULL DEFAULT false,
    "activo" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "CampoContravencional_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CampoContravencional_clave_key" ON "CampoContravencional"("clave");

-- CreateIndex
CREATE INDEX "Acta_tipo_idx" ON "Acta"("tipo");
