import Link from "next/link";
import { esJefe, getAgenteActual } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AppHeader } from "@/components/ui/AppHeader";
import { BottomNav } from "@/components/ui/BottomNav";
import { Boton } from "@/components/ui/Boton";
import { FiltroPill } from "@/components/ui/FiltroPill";
import { EstadoVacio } from "@/components/ui/EstadoVacio";
import { formatoFechaHora, numeroActa, TIPO_PROCEDIMIENTO_LABEL, TIPO_PROCEDIMIENTO_ICON } from "@/lib/formato";
import type { TipoProcedimientoValor } from "./ProcedimientoForm";

const TIPOS_VALIDOS: TipoProcedimientoValor[] = [
  "ORDEN_JUDICIAL",
  "SECUESTRO",
  "DEMORA",
  "ARRESTO",
  "DETENCION",
  "UBICACION_PARADERO",
  "ESTUPEFACIENTES",
];

export default async function ProcedimientosPage({
  searchParams,
}: {
  searchParams: Promise<{ tipo?: string }>;
}) {
  const { tipo } = await searchParams;
  const agente = await getAgenteActual();

  const filtroTipo = TIPOS_VALIDOS.includes(tipo as TipoProcedimientoValor)
    ? (tipo as TipoProcedimientoValor)
    : undefined;

  const procedimientos = await prisma.procedimiento.findMany({
    where: filtroTipo ? { tipo: filtroTipo } : undefined,
    orderBy: { fecha: "desc" },
    include: { agente: true, puesto: true, puestoTrabajo: true },
    take: 100,
  });

  return (
    <>
      <AppHeader nombreApellido={agente.nombreApellido} legajo={agente.legajo} />
      <main className="w-full max-w-2xl mx-auto px-pad-lg pt-4 pb-24 space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-headline-md font-headline-md text-primary flex items-center gap-2">
            <span className="material-symbols-outlined text-secondary">gavel</span>
            Procedimientos
          </h1>
          <Boton as={Link} href="/procedimientos/nuevo" icono="add" className="px-4">
            Nuevo
          </Boton>
        </div>
        <p className="text-body-sm text-on-surface-variant -mt-2">
          Órdenes judiciales, secuestros, demoras, arrestos, detenciones,
          ubicación/paradero y estupefacientes.
        </p>

        <div className="flex gap-2 overflow-x-auto pb-1">
          <FiltroPill href="/procedimientos" activo={!filtroTipo}>
            Todos
          </FiltroPill>
          {TIPOS_VALIDOS.map((t) => (
            <FiltroPill key={t} href={`/procedimientos?tipo=${t}`} activo={filtroTipo === t}>
              {TIPO_PROCEDIMIENTO_LABEL[t]}
            </FiltroPill>
          ))}
        </div>

        {procedimientos.length === 0 && (
          <EstadoVacio>No hay procedimientos cargados todavía.</EstadoVacio>
        )}

        <ul className="space-y-3">
          {procedimientos.map((p) => (
            <li key={p.id}>
              <Link
                href={`/procedimientos/${p.id}`}
                className="block bg-surface-container-lowest rounded-lg border border-outline-variant p-3 shadow-sm hover:bg-surface-container transition-colors"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-display text-label-md text-on-surface-variant">
                    PROC. N° {numeroActa(p.numero)}
                  </span>
                  <span className="flex items-center gap-1 text-label-sm font-label-sm bg-error-container text-on-error-container px-2 py-0.5 rounded font-bold">
                    <span className="material-symbols-outlined text-[16px]">
                      {TIPO_PROCEDIMIENTO_ICON[p.tipo]}
                    </span>
                    {TIPO_PROCEDIMIENTO_LABEL[p.tipo]}
                  </span>
                </div>
                <p className="text-body-md font-semibold text-on-surface line-clamp-2">
                  {p.descripcion}
                </p>
                <p className="text-body-sm text-on-surface-variant mt-1">
                  {formatoFechaHora(p.fecha)} Hs ·{" "}
                  {p.modalidadTrabajo === "OTRA_JURISDICCION" && p.puestoTrabajo
                    ? `${p.puestoTrabajo.nombre} (ref. ${p.puesto.nombre})`
                    : p.puesto.nombre}{" "}
                  · {p.agente.nombreApellido}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      </main>
      <BottomNav verAgentes={esJefe(agente)} />
    </>
  );
}
