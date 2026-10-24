import Link from "next/link";
import { redirect } from "next/navigation";
import { getAgenteActual } from "@/lib/auth";
import { getPuestoSeleccionado } from "@/lib/puesto";
import { AppHeader } from "@/components/ui/AppHeader";
import { NOMBRE_RELEVAMIENTOS } from "@/lib/config";
import { RelevamientoForm } from "../RelevamientoForm";

export default async function NuevoRelevamientoPage({
  searchParams,
}: {
  searchParams: Promise<{ modalidad?: string }>;
}) {
  const { modalidad } = await searchParams;
  const agente = await getAgenteActual();
  const puesto = await getPuestoSeleccionado();
  if (!puesto) redirect("/puesto");

  const modalidadValida =
    modalidad === "FINES_LARGOS" || modalidad === "DIA_VIRGEN" ? modalidad : null;

  return (
    <>
      <AppHeader nombreApellido={agente.nombreApellido} legajo={agente.legajo} />
      <main className="w-full max-w-2xl mx-auto px-pad-lg pt-4 pb-10 space-y-4">
        {!modalidadValida ? (
          <>
            <h1 className="text-headline-md font-headline-md text-primary flex items-center gap-2">
              <span className="material-symbols-outlined text-secondary">
                groups
              </span>
              Nuevo Conteo — {NOMBRE_RELEVAMIENTOS}
            </h1>
            <div className="grid gap-pad-md">
              <Link
                href="/relevamientos/nuevo?modalidad=FINES_LARGOS"
                className="block bg-surface-container-lowest rounded-xl border-2 border-outline-variant p-pad-lg shadow-sm hover:border-primary transition-colors"
              >
                <h2 className="text-headline-sm font-headline-sm font-bold text-on-surface flex items-center gap-2">
                  <span className="material-symbols-outlined text-secondary">
                    groups
                  </span>
                  Fines Largos
                </h2>
                <p className="text-body-sm text-on-surface-variant mt-1">
                  Cantidad de personas y provincia de origen.
                </p>
              </Link>
              <Link
                href="/relevamientos/nuevo?modalidad=DIA_VIRGEN"
                className="block bg-surface-container-lowest rounded-xl border-2 border-outline-variant p-pad-lg shadow-sm hover:border-primary transition-colors"
              >
                <h2 className="text-headline-sm font-headline-sm font-bold text-on-surface flex items-center gap-2">
                  <span className="material-symbols-outlined text-secondary">
                    church
                  </span>
                  Día de la Virgen
                </h2>
                <p className="text-body-sm text-on-surface-variant mt-1">
                  Medio de transporte, sexo y procedencia.
                </p>
              </Link>
            </div>
          </>
        ) : (
          <RelevamientoForm modalidad={modalidadValida} />
        )}
      </main>
    </>
  );
}
