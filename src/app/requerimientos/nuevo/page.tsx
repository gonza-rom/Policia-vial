import Link from "next/link";
import { redirect } from "next/navigation";
import { esJefe, getAgenteActual } from "@/lib/auth";
import { getPuestoSeleccionado } from "@/lib/puesto";
import { AppHeader } from "@/components/ui/AppHeader";
import { BottomNav } from "@/components/ui/BottomNav";
import { RequerimientoForm } from "../RequerimientoForm";

export default async function NuevoRequerimientoPage() {
  const agente = await getAgenteActual();
  const puesto = await getPuestoSeleccionado();
  if (!puesto) redirect("/puesto");

  return (
    <>
      <AppHeader />
      <main className="w-full max-w-2xl mx-auto px-pad-lg pt-4 pb-24 space-y-3">
        <Link
          href="/requerimientos"
          className="flex items-center gap-1 text-secondary text-label-sm font-label-sm uppercase"
        >
          <span className="material-symbols-outlined text-[18px]">arrow_back</span>
          Volver
        </Link>
        <RequerimientoForm />
      </main>
      <BottomNav verAgentes={esJefe(agente)} />
    </>
  );
}
