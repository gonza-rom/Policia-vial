import { notFound, redirect } from "next/navigation";
import { esJefe, getAgenteActual, puedeEditarActa } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AppHeader } from "@/components/ui/AppHeader";
import { BottomNav } from "@/components/ui/BottomNav";
import { NuevaActaForm } from "../../nueva/NuevaActaForm";
import { ContravencionalActaForm } from "../../nueva/ContravencionalActaForm";

export default async function EditarActaPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const agente = await getAgenteActual();

  const acta = await prisma.acta.findUnique({
    where: { id },
    include: { infracciones: true },
  });
  if (!acta) notFound();

  if (!puedeEditarActa(agente, acta)) {
    redirect(`/actas/${id}/firma`);
  }

  if (acta.tipo === "CONTRAVENCIONAL") {
    const campos = await prisma.campoContravencional.findMany({
      where: { activo: true },
      orderBy: { orden: "asc" },
    });
    return (
      <>
        <AppHeader />
        <main className="w-full max-w-2xl mx-auto px-pad-lg pt-4 pb-24 space-y-3">
          {/* <a> normal, no <Link>: esta pantalla ahora se puede editar sin
          conexión si ya se abrió con señal alguna vez — ver sw.js. */}
          <a
            href={`/actas/${id}/firma`}
            className="flex items-center gap-1 text-secondary text-label-sm font-label-sm uppercase"
          >
            <span className="material-symbols-outlined text-[18px]">arrow_back</span>
            Volver
          </a>
          <ContravencionalActaForm
            campos={campos}
            actaExistente={{
              id: acta.id,
              lugarControl: acta.lugarControl,
              datos: (acta.datosContravencional ?? {}) as Record<string, string>,
            }}
          />
        </main>
        <BottomNav verAgentes={esJefe(agente)} />
      </>
    );
  }

  const catalogo = await prisma.infraccionCatalogo.findMany({
    where: { activo: true },
    orderBy: { orden: "asc" },
  });

  return (
    <>
      <AppHeader />
      <main className="w-full max-w-2xl mx-auto px-pad-lg pt-4 pb-24 space-y-3">
        <a
          href={`/actas/${id}/firma`}
          className="flex items-center gap-1 text-secondary text-label-sm font-label-sm uppercase"
        >
          <span className="material-symbols-outlined text-[18px]">arrow_back</span>
          Volver
        </a>
        <NuevaActaForm
          catalogo={catalogo.map((i) => ({ ...i, montoBase: Number(i.montoBase) }))}
          lugarControlSugerido={acta.lugarControl ?? ""}
          actaExistente={{
            id: acta.id,
            lugarControl: acta.lugarControl,
            conductorNombre: acta.conductorNombre,
            conductorDomicilio: acta.conductorDomicilio,
            conductorDni: acta.conductorDni,
            conductorEdad: acta.conductorEdad,
            conductorExpedidoPor: acta.conductorExpedidoPor,
            conductorLicenciaNro: acta.conductorLicenciaNro,
            conductorLicenciaClase: acta.conductorLicenciaClase,
            vehiculoDominio: acta.vehiculoDominio,
            vehiculoMarcaModelo: acta.vehiculoMarcaModelo,
            vehiculoTipo: acta.vehiculoTipo,
            vehiculoTipoOtro: acta.vehiculoTipoOtro,
            vehiculoRemitidoA: acta.vehiculoRemitidoA,
            otrosDatosAmpliatorios: acta.otrosDatosAmpliatorios,
            retencionPreventiva: acta.retencionPreventiva,
            tipoRetencion: acta.tipoRetencion,
            montoBase: Number(acta.montoBase ?? 0),
            infraccionIds: acta.infracciones.map((i) => i.infraccionId),
            detalleOtraInfraccion:
              acta.infracciones.find((i) => i.detalleOperativo)?.detalleOperativo ?? null,
            alcoholemiaGraduacion: acta.alcoholemiaGraduacion
              ? Number(acta.alcoholemiaGraduacion)
              : null,
          }}
        />
      </main>
      <BottomNav verAgentes={esJefe(agente)} />
    </>
  );
}
