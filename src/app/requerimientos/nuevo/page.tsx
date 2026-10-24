import { redirect } from "next/navigation";
import { getAgenteActual } from "@/lib/auth";
import { getPuestoSeleccionado } from "@/lib/puesto";
import { AppHeader } from "@/components/ui/AppHeader";
import { RequerimientoForm } from "../RequerimientoForm";

export default async function NuevoRequerimientoPage() {
  const agente = await getAgenteActual();
  const puesto = await getPuestoSeleccionado();
  if (!puesto) redirect("/puesto");

  return (
    <>
      <AppHeader nombreApellido={agente.nombreApellido} legajo={agente.legajo} />
      <main className="w-full max-w-2xl mx-auto px-pad-lg pt-4 pb-10">
        <RequerimientoForm />
      </main>
    </>
  );
}
