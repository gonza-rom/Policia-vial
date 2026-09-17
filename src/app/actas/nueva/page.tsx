import { redirect } from "next/navigation";
import { getAgenteActual, getGuardiaActiva } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AppHeader } from "@/components/ui/AppHeader";
import { NuevaActaForm } from "./NuevaActaForm";

export default async function NuevaActaPage() {
  const agente = await getAgenteActual();
  const guardia = await getGuardiaActiva(agente.id);

  if (!guardia) {
    redirect("/guardia");
  }

  const catalogo = await prisma.infraccionCatalogo.findMany({
    where: { activo: true },
    orderBy: { orden: "asc" },
  });

  return (
    <>
      <AppHeader nombreApellido={agente.nombreApellido} legajo={agente.legajo} />
      <main className="w-full max-w-2xl mx-auto px-pad-lg pt-4 pb-10">
        <NuevaActaForm
          catalogo={catalogo.map((i) => ({
            ...i,
            montoBase: Number(i.montoBase),
          }))}
          lugarControlSugerido={guardia.puesto.kmRuta ?? guardia.puesto.nombre}
        />
      </main>
    </>
  );
}
