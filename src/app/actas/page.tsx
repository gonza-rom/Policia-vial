import Link from "next/link";
import { getAgenteActual, getGuardiaActiva } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AppHeader } from "@/components/ui/AppHeader";
import { BottomNav } from "@/components/ui/BottomNav";
import {
  formatoHora,
  formatoMoneda,
  numeroActa,
  ESTADO_ACTA_LABEL,
} from "@/lib/formato";

export default async function ActasPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const agente = await getAgenteActual();
  const guardia = await getGuardiaActiva(agente.id);

  const where = q
    ? {
        guardiaId: guardia?.id,
        OR: [
          { conductorNombre: { contains: q, mode: "insensitive" as const } },
          { conductorDni: { contains: q } },
          { vehiculoDominio: { contains: q, mode: "insensitive" as const } },
        ],
      }
    : { guardiaId: guardia?.id };

  const actas = guardia
    ? await prisma.acta.findMany({
        where,
        orderBy: { fecha: "desc" },
        include: { infracciones: { include: { infraccion: true } } },
      })
    : [];

  return (
    <>
      <AppHeader nombreApellido={agente.nombreApellido} legajo={agente.legajo} />
      <main className="w-full max-w-2xl mx-auto px-pad-lg pt-4 pb-24 space-y-4">
        <h1 className="text-headline-md font-headline-md text-primary flex items-center gap-2">
          <span className="material-symbols-outlined text-secondary">
            task_alt
          </span>
          Actas del Turno
        </h1>

        {!guardia && (
          <p className="text-body-md text-on-surface-variant">
            No tenés una guardia activa. Iniciá una desde el menú principal
            para ver sus actas.
          </p>
        )}

        {guardia && (
          <>
            <form className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline">
                search
              </span>
              <input
                type="text"
                name="q"
                defaultValue={q}
                placeholder="Buscar por conductor, DNI o dominio…"
                className="w-full bg-surface-container-low border border-outline rounded pl-11 pr-3 py-2.5 min-h-touch-min text-body-md"
              />
            </form>

            {actas.length === 0 && (
              <p className="text-body-md text-on-surface-variant text-center py-8">
                No hay actas registradas en este turno todavía.
              </p>
            )}

            <ul className="space-y-3">
              {actas.map((acta) => (
                <li key={acta.id}>
                  <Link
                    href={`/actas/${acta.id}/firma`}
                    className="block bg-surface-container-lowest rounded-lg border border-outline-variant p-3 shadow-sm hover:bg-surface-container transition-colors"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-display text-label-md text-on-surface-variant">
                        ACTA N° {numeroActa(acta.numero)}
                      </span>
                      <span
                        className={`text-label-sm font-label-sm px-2 py-0.5 rounded font-bold ${
                          acta.estado === "PENDIENTE_FIRMA"
                            ? "bg-error-container text-on-error-container"
                            : "bg-secondary-container/40 text-on-secondary-container"
                        }`}
                      >
                        {ESTADO_ACTA_LABEL[acta.estado]}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-body-md font-semibold text-on-surface">
                          {acta.conductorNombre}
                        </p>
                        <p className="text-body-sm text-on-surface-variant">
                          {acta.vehiculoDominio} · {formatoHora(acta.fecha)} Hs ·{" "}
                          {acta.infracciones.length} infracc.
                        </p>
                      </div>
                      <span className="font-display text-body-lg font-bold text-primary">
                        {formatoMoneda(Number(acta.montoConDescuento))}
                      </span>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          </>
        )}
      </main>
      <BottomNav />
    </>
  );
}
