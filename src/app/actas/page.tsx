import Link from "next/link";
import { esJefe, getAgenteActual, getGuardiaActiva } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AppHeader } from "@/components/ui/AppHeader";
import { BottomNav } from "@/components/ui/BottomNav";
import { BadgeEstadoActa } from "@/components/ui/BadgeEstadoActa";
import { EstadoVacio } from "@/components/ui/EstadoVacio";
import {
  formatoHora,
  formatoMoneda,
  numeroActa,
  nombreConductorActa,
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
      <AppHeader />
      <main className="w-full max-w-2xl mx-auto px-pad-lg pt-4 pb-24 space-y-4">
        <Link
          href="/guardia"
          className="flex items-center gap-1 text-secondary text-label-sm font-label-sm uppercase"
        >
          <span className="material-symbols-outlined text-[18px]">arrow_back</span>
          Volver
        </Link>
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
              <EstadoVacio>No hay actas registradas en este turno todavía.</EstadoVacio>
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
                      <BadgeEstadoActa estado={acta.estado} />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-body-md font-semibold text-on-surface">
                          {nombreConductorActa(acta)}
                        </p>
                        <p className="text-body-sm text-on-surface-variant">
                          {acta.tipo === "CONTRAVENCIONAL" ? (
                            <>Contravencional · {formatoHora(acta.fecha)} Hs</>
                          ) : (
                            <>
                              {acta.vehiculoDominio} · {formatoHora(acta.fecha)} Hs ·{" "}
                              {acta.infracciones.length} infracc.
                            </>
                          )}
                        </p>
                      </div>
                      {acta.tipo === "MUNICIPAL" && (
                        <span className="font-display text-body-lg font-bold text-primary">
                          {formatoMoneda(Number(acta.montoConDescuento ?? 0))}
                        </span>
                      )}
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          </>
        )}
      </main>
      <BottomNav verAgentes={esJefe(agente)} />
    </>
  );
}
