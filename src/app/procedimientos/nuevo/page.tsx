import { redirect } from "next/navigation";
import { esJefe, getAgenteActual } from "@/lib/auth";
import { getPuestoSeleccionado } from "@/lib/puesto";
import { prisma } from "@/lib/prisma";
import { AppHeader } from "@/components/ui/AppHeader";
import { BottomNav } from "@/components/ui/BottomNav";
import { ProcedimientoForm, type TipoProcedimientoValor } from "../ProcedimientoForm";

const ERROR_LABEL: Record<string, string> = {
  motivo: "Si elegís \"Otra Jurisdicción\" tenés que indicar el motivo.",
};

export default async function NuevoProcedimientoPage({
  searchParams,
}: {
  searchParams: Promise<{ tipo?: string; error?: string }>;
}) {
  const { tipo, error } = await searchParams;
  const agente = await getAgenteActual();
  const puesto = await getPuestoSeleccionado();
  if (!puesto) redirect("/puesto");

  const puestosDisponibles = await prisma.puesto.findMany({
    where: { activo: true },
    orderBy: { orden: "asc" },
    select: { id: true, nombre: true },
  });

  return (
    <>
      <AppHeader />
      <main className="w-full max-w-2xl mx-auto px-pad-lg pt-4 pb-24 space-y-3">
        {/* <a> normal, no <Link>: esta pantalla tiene que poder abrirse (y
        volver) sin conexión — ver sw.js. */}
        {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
        <a
          href="/procedimientos"
          className="flex items-center gap-1 text-secondary text-label-sm font-label-sm uppercase"
        >
          <span className="material-symbols-outlined text-[18px]">arrow_back</span>
          Volver
        </a>
        {error && ERROR_LABEL[error] && (
          <p className="text-body-sm text-error bg-error-container/40 border border-error rounded p-2">
            {ERROR_LABEL[error]}
          </p>
        )}
        <ProcedimientoForm
          tipoInicial={tipo as TipoProcedimientoValor | undefined}
          puestosDisponibles={puestosDisponibles}
          puestoOrigenId={puesto.id}
          agenteId={agente.id}
        />
      </main>
      <BottomNav verAgentes={esJefe(agente)} />
    </>
  );
}
