import Link from "next/link";
import { esJefe, getAgenteActual, getGuardiaActiva } from "@/lib/auth";
import { getPuestoSeleccionado } from "@/lib/puesto";
import { prisma } from "@/lib/prisma";
import { AppHeader } from "@/components/ui/AppHeader";
import { BottomNav } from "@/components/ui/BottomNav";
import { EstadoVacio } from "@/components/ui/EstadoVacio";
import { SelectorPuesto } from "./SelectorPuesto";

export default async function PuestoPage() {
  const agente = await getAgenteActual();
  const [puestos, contexto, guardiaActiva] = await Promise.all([
    prisma.puesto.findMany({
      where: { activo: true },
      orderBy: { orden: "asc" },
    }),
    getPuestoSeleccionado(),
    getGuardiaActiva(agente.id),
  ]);
  // Con guardia abierta, lo que manda es el puesto de ESA guardia (lo que
  // se ve en /guardia), no el contexto de sesión — así el resaltado coincide
  // con lo que el agente ve ahí.
  const actual = guardiaActiva ? guardiaActiva.puesto : contexto;

  return (
    <>
      <AppHeader />
      <main className="w-full max-w-2xl mx-auto px-pad-lg pt-4 pb-24 space-y-4">
        {actual && (
          <Link
            href="/guardia"
            className="flex items-center gap-1 text-secondary text-label-sm font-label-sm uppercase"
          >
            <span className="material-symbols-outlined text-[18px]">arrow_back</span>
            Volver
          </Link>
        )}

        <div>
          <h1 className="text-headline-md font-headline-md text-primary flex items-center gap-2">
            <span className="material-symbols-outlined text-secondary">location_on</span>
            Elegí tu puesto
          </h1>
          <p className="text-body-sm text-on-surface-variant">
            {guardiaActiva
              ? "Ya tenés un turno abierto. Si elegís otro puesto, se reasigna tu guardia actual a ese puesto."
              : "Define dónde vas a trabajar en esta sesión. Podés cambiarlo cuando quieras desde el menú principal."}
          </p>
        </div>

        <SelectorPuesto puestos={puestos} actualId={actual?.id} />

        {puestos.length === 0 && (
          <EstadoVacio>No hay puestos cargados todavía.</EstadoVacio>
        )}
      </main>
      <BottomNav verAgentes={esJefe(agente)} />
    </>
  );
}
