import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { esJefe, getAgenteActual, puedeEditarRegistroPropio } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AppHeader } from "@/components/ui/AppHeader";
import { BottomNav } from "@/components/ui/BottomNav";
import { RequerimientoForm } from "../../RequerimientoForm";

export default async function EditarRequerimientoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const agente = await getAgenteActual();

  const requerimiento = await prisma.requerimiento.findUnique({ where: { id } });
  if (!requerimiento) notFound();

  if (!puedeEditarRegistroPropio(agente, requerimiento)) {
    redirect(`/requerimientos/${id}`);
  }

  return (
    <>
      <AppHeader />
      <main className="w-full max-w-2xl mx-auto px-pad-lg pt-4 pb-24 space-y-3">
        <Link
          href={`/requerimientos/${id}`}
          className="flex items-center gap-1 text-secondary text-label-sm font-label-sm uppercase"
        >
          <span className="material-symbols-outlined text-[18px]">arrow_back</span>
          Volver
        </Link>
        <RequerimientoForm requerimientoExistente={requerimiento} />
      </main>
      <BottomNav verAgentes={esJefe(agente)} />
    </>
  );
}
