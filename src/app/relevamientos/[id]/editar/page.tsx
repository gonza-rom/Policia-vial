import { notFound, redirect } from "next/navigation";
import { esJefe, getAgenteActual, puedeEditarRegistroPropio } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AppHeader } from "@/components/ui/AppHeader";
import { BottomNav } from "@/components/ui/BottomNav";
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
      <AppHeader />
      <main className="w-full max-w-2xl mx-auto px-pad-lg pt-4 pb-24 space-y-3">
        <a
          href={`/relevamientos/${id}`}
          className="flex items-center gap-1 text-secondary text-label-sm font-label-sm uppercase"
        >
          <span className="material-symbols-outlined text-[18px]">arrow_back</span>
          Volver
        </a>
        <RelevamientoForm
          modalidad={relevamiento.modalidad}
          relevamientoExistente={relevamiento}
          agenteId={agente.id}
        />
      </main>
      <BottomNav verAgentes={esJefe(agente)} />
    </>
  );
}
