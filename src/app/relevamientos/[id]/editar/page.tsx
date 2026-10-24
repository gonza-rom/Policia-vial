import { notFound, redirect } from "next/navigation";
import { getAgenteActual, puedeEditarRegistroPropio } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AppHeader } from "@/components/ui/AppHeader";
import { RelevamientoForm } from "../../RelevamientoForm";

export default async function EditarRelevamientoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const agente = await getAgenteActual();

  const relevamiento = await prisma.relevamiento.findUnique({ where: { id } });
  if (!relevamiento) notFound();

  if (!puedeEditarRegistroPropio(agente, relevamiento)) {
    redirect("/relevamientos");
  }

  return (
    <>
      <AppHeader nombreApellido={agente.nombreApellido} legajo={agente.legajo} />
      <main className="w-full max-w-2xl mx-auto px-pad-lg pt-4 pb-10">
        <RelevamientoForm
          modalidad={relevamiento.modalidad}
          relevamientoExistente={relevamiento}
        />
      </main>
    </>
  );
}
