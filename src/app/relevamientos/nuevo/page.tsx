import { redirect } from "next/navigation";
import { esJefe, getAgenteActual } from "@/lib/auth";
import { getPuestoSeleccionado } from "@/lib/puesto";
import { AppHeader } from "@/components/ui/AppHeader";
import { BottomNav } from "@/components/ui/BottomNav";
import { NOMBRE_RELEVAMIENTOS } from "@/lib/config";
import {
  MODALIDAD_LABEL,
  MODALIDAD_ICON,
  MODALIDADES_RELEVAMIENTO,
  type ModalidadRelevamientoValor,
} from "@/lib/relevamientos";
import { RelevamientoForm } from "../RelevamientoForm";

const DESCRIPCION_MODALIDAD: Record<ModalidadRelevamientoValor, string> = {
  FINES_LARGOS: "Cantidad de personas y provincia de origen.",
  DIA_VIRGEN: "Medio de transporte, sexo y procedencia.",
  SEMANA_ESTUDIANTIL: "Cantidad de personas y procedencia.",
  FESTIVALES: "Cantidad de personas y procedencia.",
  PONCHO: "Cantidad de personas y procedencia.",
};

export default async function NuevoRelevamientoPage({
  searchParams,
}: {
  searchParams: Promise<{ modalidad?: string }>;
}) {
  const { modalidad } = await searchParams;
  const agente = await getAgenteActual();
  const puesto = await getPuestoSeleccionado();
  if (!puesto) redirect("/puesto");

  const modalidadValida = MODALIDADES_RELEVAMIENTO.includes(
    modalidad as ModalidadRelevamientoValor,
  )
    ? (modalidad as ModalidadRelevamientoValor)
    : null;

  return (
    <>
      <AppHeader />
      <main className="w-full max-w-2xl mx-auto px-pad-lg pt-4 pb-24 space-y-4">
        {/* <a> normal, no <Link>: esta pantalla tiene que poder abrirse (y
        volver) sin conexión — ver sw.js. */}
        {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
        <a
          href="/relevamientos"
          className="flex items-center gap-1 text-secondary text-label-sm font-label-sm uppercase"
        >
          <span className="material-symbols-outlined text-[18px]">arrow_back</span>
          Volver
        </a>
        {!modalidadValida ? (
          <>
            <h1 className="text-headline-md font-headline-md text-primary flex items-center gap-2">
              <span className="material-symbols-outlined text-secondary">
                groups
              </span>
              Nuevo Conteo — {NOMBRE_RELEVAMIENTOS}
            </h1>
            <div className="grid gap-pad-md">
              {/* <a> normal, no <Link>: cada modalidad es una URL propia
              que el Service Worker tiene que poder cachear y servir sin
              conexión (ver sw.js) — una transición cliente no pasa por ahí. */}
              {MODALIDADES_RELEVAMIENTO.map((m) => (
                <a
                  key={m}
                  href={`/relevamientos/nuevo?modalidad=${m}`}
                  className="block bg-surface-container-lowest rounded-xl border-2 border-outline-variant p-pad-lg shadow-sm hover:border-primary transition-colors"
                >
                  <h2 className="text-headline-sm font-headline-sm font-bold text-on-surface flex items-center gap-2">
                    <span className="material-symbols-outlined text-secondary">
                      {MODALIDAD_ICON[m]}
                    </span>
                    {MODALIDAD_LABEL[m]}
                  </h2>
                  <p className="text-body-sm text-on-surface-variant mt-1">
                    {DESCRIPCION_MODALIDAD[m]}
                  </p>
                </a>
              ))}
            </div>
          </>
        ) : (
          <RelevamientoForm
            modalidad={modalidadValida}
            puestoOrigenId={puesto.id}
            agenteId={agente.id}
          />
        )}
      </main>
      <BottomNav verAgentes={esJefe(agente)} />
    </>
  );
}
