-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "TipoCampoContravencional" ADD VALUE 'HORA';
ALTER TYPE "TipoCampoContravencional" ADD VALUE 'SELECT';

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "TipoRodado" ADD VALUE 'PASAJEROS';
ALTER TYPE "TipoRodado" ADD VALUE 'EMERGENCIAS';
ALTER TYPE "TipoRodado" ADD VALUE 'OTRO';

-- AlterTable
ALTER TABLE "Acta" ADD COLUMN     "vehiculoTipoOtro" TEXT;

-- AlterTable
ALTER TABLE "CampoContravencional" ADD COLUMN     "opciones" TEXT[] DEFAULT ARRAY[]::TEXT[];
