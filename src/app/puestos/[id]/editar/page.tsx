import { notFound } from "next/navigation";
import { getJefeActual } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AppHeader } from "@/components/ui/AppHeader";
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
      <AppHeader nombreApellido={jefe.nombreApellido} legajo={jefe.legajo} />
      <main className="w-full max-w-2xl mx-auto px-pad-lg pt-4 pb-10">
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
    </>
  );
}
