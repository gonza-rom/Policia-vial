import Link from "next/link";
import { notFound } from "next/navigation";
import { esJefe, getJefeActual } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AppHeader } from "@/components/ui/AppHeader";
import { BottomNav } from "@/components/ui/BottomNav";
import { PuestoEditarForm } from "./PuestoEditarForm";

export default async function EditarPuestoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const jefe = await getJefeActual();

  const puesto = await prisma.puesto.findUnique({ where: { id } });
  if (!puesto) notFound();

  return (
    <>
      <AppHeader />
      <main className="w-full max-w-2xl mx-auto px-pad-lg pt-4 pb-24 space-y-3">
        <Link
          href="/puestos"
          className="flex items-center gap-1 text-secondary text-label-sm font-label-sm uppercase"
        >
          <span className="material-symbols-outlined text-[18px]">arrow_back</span>
          Volver
        </Link>
        <PuestoEditarForm
          puesto={{
            id: puesto.id,
            nombre: puesto.nombre,
            codigo: puesto.codigo,
            ubicacion: puesto.ubicacion,
            kmRuta: puesto.kmRuta,
            latitud: puesto.latitud ? Number(puesto.latitud) : null,
            longitud: puesto.longitud ? Number(puesto.longitud) : null,
            activo: puesto.activo,
            jurisdiccionesMunicipales: puesto.jurisdiccionesMunicipales,
          }}
        />
      </main>
      <BottomNav verAgentes={esJefe(jefe)} />
    </>
  );
}
