-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "RolAgente" AS ENUM ('AGENTE', 'JEFE', 'ADMIN');

-- CreateEnum
CREATE TYPE "EstadoGuardia" AS ENUM ('ACTIVA', 'CERRADA');

-- CreateEnum
CREATE TYPE "CategoriaInfraccion" AS ENUM ('DOCUMENTACION', 'ESTADO_RODADO', 'ALCOHOLEMIA_CONDUCTA', 'OTRA');

-- CreateEnum
CREATE TYPE "GravedadInfraccion" AS ENUM ('LEVE', 'GRAVE', 'GRAVISIMA');

-- CreateEnum
CREATE TYPE "TipoRodado" AS ENUM ('AUTO', 'MOTO', 'PICKUP', 'CARGA');

-- CreateEnum
CREATE TYPE "TipoRetencion" AS ENUM ('NINGUNA', 'LICENCIA', 'VEHICULO', 'LICENCIA_Y_VEHICULO');

-- CreateEnum
CREATE TYPE "EstadoActa" AS ENUM ('PENDIENTE_FIRMA', 'FIRMADA', 'REMITIDA_RENTAS', 'ANULADA');

-- CreateTable
CREATE TABLE "Agente" (
    "id" TEXT NOT NULL,
    "legajo" TEXT NOT NULL,
    "authEmail" TEXT NOT NULL,
    "nombreApellido" TEXT NOT NULL,
    "grado" TEXT,
    "rol" "RolAgente" NOT NULL DEFAULT 'AGENTE',
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "jefeId" TEXT,

    CONSTRAINT "Agente_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Puesto" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "kmRuta" TEXT,
    "ubicacion" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Puesto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Guardia" (
    "id" TEXT NOT NULL,
    "agenteId" TEXT NOT NULL,
    "puestoId" TEXT NOT NULL,
    "turnoInicio" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "turnoFin" TIMESTAMP(3),
    "horaCierre" TIMESTAMP(3),
    "estado" "EstadoGuardia" NOT NULL DEFAULT 'ACTIVA',
    "notasCierre" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Guardia_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InfraccionCatalogo" (
    "id" TEXT NOT NULL,
    "categoria" "CategoriaInfraccion" NOT NULL,
    "descripcion" TEXT NOT NULL,
    "detalle" TEXT,
    "gravedad" "GravedadInfraccion" NOT NULL,
    "montoBase" DECIMAL(12,2) NOT NULL,
    "orden" INTEGER NOT NULL DEFAULT 0,
    "activo" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "InfraccionCatalogo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Acta" (
    "id" TEXT NOT NULL,
    "numero" SERIAL NOT NULL,
    "guardiaId" TEXT NOT NULL,
    "agenteId" TEXT NOT NULL,
    "puestoId" TEXT NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lugarControl" TEXT,
    "conductorNombre" TEXT NOT NULL,
    "conductorDni" TEXT NOT NULL,
    "conductorEdad" INTEGER,
    "conductorDomicilio" TEXT,
    "conductorLicenciaNro" TEXT,
    "conductorLicenciaClase" TEXT,
    "conductorExpedidoPor" TEXT,
    "vehiculoDominio" TEXT NOT NULL,
    "vehiculoMarcaModelo" TEXT,
    "vehiculoTipo" "TipoRodado" NOT NULL,
    "vehiculoRemitidoA" TEXT,
    "otrosDatosAmpliatorios" TEXT,
    "montoBase" DECIMAL(12,2) NOT NULL,
    "porcentajeDescuento" DECIMAL(5,2) NOT NULL DEFAULT 40,
    "montoConDescuento" DECIMAL(12,2) NOT NULL,
    "fotoVehiculoUrl" TEXT,
    "fotoDocumentoUrl" TEXT,
    "firmaInfractorUrl" TEXT,
    "firmaActuanteUrl" TEXT,
    "infractorSeNiegaAFirmar" BOOLEAN NOT NULL DEFAULT false,
    "retencionPreventiva" BOOLEAN NOT NULL DEFAULT false,
    "tipoRetencion" "TipoRetencion" NOT NULL DEFAULT 'NINGUNA',
    "alcoholemiaGraduacion" DECIMAL(4,2),
    "estado" "EstadoActa" NOT NULL DEFAULT 'PENDIENTE_FIRMA',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Acta_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ActaInfraccion" (
    "id" TEXT NOT NULL,
    "actaId" TEXT NOT NULL,
    "infraccionId" TEXT NOT NULL,
    "detalleOperativo" TEXT,

    CONSTRAINT "ActaInfraccion_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Agente_legajo_key" ON "Agente"("legajo");

-- CreateIndex
CREATE UNIQUE INDEX "Agente_authEmail_key" ON "Agente"("authEmail");

-- CreateIndex
CREATE INDEX "Agente_jefeId_idx" ON "Agente"("jefeId");

-- CreateIndex
CREATE INDEX "Guardia_agenteId_estado_idx" ON "Guardia"("agenteId", "estado");

-- CreateIndex
CREATE UNIQUE INDEX "Acta_numero_key" ON "Acta"("numero");

-- CreateIndex
CREATE INDEX "Acta_fecha_idx" ON "Acta"("fecha");

-- CreateIndex
CREATE INDEX "Acta_estado_idx" ON "Acta"("estado");

-- CreateIndex
CREATE INDEX "Acta_guardiaId_idx" ON "Acta"("guardiaId");

-- CreateIndex
CREATE INDEX "Acta_vehiculoDominio_idx" ON "Acta"("vehiculoDominio");

-- CreateIndex
CREATE INDEX "Acta_conductorDni_idx" ON "Acta"("conductorDni");

-- CreateIndex
CREATE UNIQUE INDEX "ActaInfraccion_actaId_infraccionId_key" ON "ActaInfraccion"("actaId", "infraccionId");

-- AddForeignKey
ALTER TABLE "Agente" ADD CONSTRAINT "Agente_jefeId_fkey" FOREIGN KEY ("jefeId") REFERENCES "Agente"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Guardia" ADD CONSTRAINT "Guardia_agenteId_fkey" FOREIGN KEY ("agenteId") REFERENCES "Agente"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Guardia" ADD CONSTRAINT "Guardia_puestoId_fkey" FOREIGN KEY ("puestoId") REFERENCES "Puesto"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Acta" ADD CONSTRAINT "Acta_guardiaId_fkey" FOREIGN KEY ("guardiaId") REFERENCES "Guardia"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Acta" ADD CONSTRAINT "Acta_agenteId_fkey" FOREIGN KEY ("agenteId") REFERENCES "Agente"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Acta" ADD CONSTRAINT "Acta_puestoId_fkey" FOREIGN KEY ("puestoId") REFERENCES "Puesto"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActaInfraccion" ADD CONSTRAINT "ActaInfraccion_actaId_fkey" FOREIGN KEY ("actaId") REFERENCES "Acta"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActaInfraccion" ADD CONSTRAINT "ActaInfraccion_infraccionId_fkey" FOREIGN KEY ("infraccionId") REFERENCES "InfraccionCatalogo"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

