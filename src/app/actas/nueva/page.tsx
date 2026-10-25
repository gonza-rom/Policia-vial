import { redirect } from "next/navigation";
import { getAgenteActual, getGuardiaActiva } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AppHeader } from "@/components/ui/AppHeader";
import { NuevaActaForm } from "./NuevaActaForm";
import { ContravencionalActaForm } from "./ContravencionalActaForm";

export default async function NuevaActaPage({
  searchParams,
}: {
  searchParams: Promise<{ tipo?: string }>;
}) {
  const { tipo } = await searchParams;
  const agente = await getAgenteActual();
  const guardia = await getGuardiaActiva(agente.id);

  if (!guardia) {
    redirect("/guardia");
  }

  if (tipo !== "municipal" && tipo !== "contravencional") {
    return (
      <>
        <AppHeader nombreApellido={agente.nombreApellido} legajo={agente.legajo} />
        <main className="w-full max-w-2xl mx-auto px-pad-lg pt-4 pb-10 space-y-4">
          <h1 className="text-headline-md font-headline-md text-primary flex items-center gap-2">
            <span className="material-symbols-outlined text-secondary">note_add</span>
            ¿Qué tipo de acta vas a labrar?
          </h1>
          <div className="grid gap-pad-md">
            {/* <a> normal, no <Link>: para que el Service Worker cachee el
            HTML de cada tipo de acta (con su catálogo ya incluido) y quede
            disponible sin conexión — una transición cliente no pasa por el SW. */}
            <a
              href="/actas/nueva?tipo=municipal"
              className="block bg-surface-container-lowest rounded-xl border-2 border-outline-variant p-pad-lg shadow-sm hover:border-primary transition-colors"
            >
              <h2 className="text-headline-sm font-headline-sm font-bold text-on-surface flex items-center gap-2">
                <span className="material-symbols-outlined text-secondary">account_balance</span>
                Acta Municipal
              </h2>
              <p className="text-body-sm text-on-surface-variant mt-1">
                Ordenanza N° 385/12 — infracciones de tránsito con liquidación
                de multa y 40% de descuento por pago voluntario.
              </p>
            </a>
            <a
              href="/actas/nueva?tipo=contravencional"
              className="block bg-surface-container-lowest rounded-xl border-2 border-outline-variant p-pad-lg shadow-sm hover:border-primary transition-colors"
            >
              <h2 className="text-headline-sm font-headline-sm font-bold text-on-surface flex items-center gap-2">
                <span className="material-symbols-outlined text-secondary">local_police</span>
                Acta Contravencional
              </h2>
              <p className="text-body-sm text-on-surface-variant mt-1">
                Código de Faltas de la Provincia (Ley N° 5171/05) — acta
                policial de comprobación.
              </p>
            </a>
          </div>
        </main>
      </>
    );
  }

  if (tipo === "contravencional") {
    const campos = await prisma.campoContravencional.findMany({
      where: { activo: true },
      orderBy: { orden: "asc" },
    });
    return (
      <>
        <AppHeader nombreApellido={agente.nombreApellido} legajo={agente.legajo} />
        <main className="w-full max-w-2xl mx-auto px-pad-lg pt-4 pb-10">
          <ContravencionalActaForm campos={campos} />
        </main>
      </>
    );
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
          guardiaId={guardia.id}
          puestoId={guardia.puestoId}
        />
      </main>
    </>
  );
}
