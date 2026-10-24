import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { esJefe, getAgenteActual, puedeEditarActa } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AppHeader } from "@/components/ui/AppHeader";
import {
  formatoMoneda,
  numeroActa,
  TIPO_RODADO_LABEL,
  ESTADO_ACTA_LABEL,
} from "@/lib/formato";
import { FirmaForm } from "./FirmaForm";
import { BotonImprimir } from "@/components/ui/BotonImprimir";
import { BotonEliminarConConfirmacion } from "@/components/ui/BotonEliminarConConfirmacion";
import { eliminarActa } from "./actions";

export default async function FirmaActaPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const agente = await getAgenteActual();

  const acta = await prisma.acta.findUnique({
    where: { id },
    include: {
      agente: true,
      puesto: true,
      infracciones: { include: { infraccion: true } },
    },
  });

  if (!acta) notFound();

  const campos =
    acta.tipo === "CONTRAVENCIONAL"
      ? await prisma.campoContravencional.findMany({ orderBy: { orden: "asc" } })
      : [];

  const yaFirmada = acta.estado !== "PENDIENTE_FIRMA";
  const puedeEditar = puedeEditarActa(agente, acta);
  const datosContravencional = (acta.datosContravencional ?? {}) as Record<string, string>;

  const secciones: { nombre: string; campos: typeof campos }[] = [];
  for (const campo of campos) {
    if (!datosContravencional[campo.clave]) continue;
    let seccion = secciones.find((s) => s.nombre === campo.seccion);
    if (!seccion) {
      seccion = { nombre: campo.seccion, campos: [] };
      secciones.push(seccion);
    }
    seccion.campos.push(campo);
  }

  return (
    <>
      <AppHeader nombreApellido={agente.nombreApellido} legajo={agente.legajo} />
      <main
        className="imprimible w-full max-w-2xl mx-auto px-pad-lg pt-4 pb-10 space-y-4"
      >
        <div className="flex items-center justify-between print:hidden">
          <Link
            href="/actas"
            className="flex items-center gap-1 text-secondary text-label-sm font-label-sm uppercase"
          >
            <span className="material-symbols-outlined text-[18px]">
              arrow_back
            </span>
            Volver
          </Link>
          <div className="flex items-center gap-2">
            {puedeEditar && (
              <Link
                href={`/actas/${acta.id}/editar`}
                className="flex items-center gap-1 text-secondary text-label-sm font-label-sm uppercase"
              >
                <span className="material-symbols-outlined text-[18px]">edit</span>
                Editar
              </Link>
            )}
            {esJefe(agente) && (
              <form action={eliminarActa}>
                <input type="hidden" name="actaId" value={acta.id} />
                <BotonEliminarConConfirmacion
                  mensaje={`¿Eliminar el acta N° ${numeroActa(acta.numero)}? Esta acción no se puede deshacer.`}
                />
              </form>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between print:hidden">
          <span
            className={`text-label-sm font-label-sm px-2 py-0.5 rounded font-bold uppercase ${
              yaFirmada
                ? "bg-secondary-container/40 text-on-secondary-container"
                : "bg-error-container text-on-error-container"
            }`}
          >
            {ESTADO_ACTA_LABEL[acta.estado]}
          </span>
          <BotonImprimir />
        </div>

        <div className="bg-primary-container text-on-primary rounded-lg p-pad-lg flex items-center justify-between">
          <div>
            <span className="text-body-sm text-primary-fixed-dim uppercase block">
              {acta.tipo === "CONTRAVENCIONAL" ? "Acta Contravencional N°" : "Acta N°"}
            </span>
            <span className="text-label-sm text-primary-fixed-dim">
              {acta.tipo === "CONTRAVENCIONAL"
                ? "Ley Prov. N° 5171/05"
                : "Ordenanza N° 385/12"}
              {" · "}
              {acta.puesto.nombre}
            </span>
          </div>
          <span className="font-display text-xl tracking-widest">
            {numeroActa(acta.numero)}
          </span>
        </div>

        {acta.tipo === "MUNICIPAL" ? (
          <>
            <section className="bg-surface-container-lowest rounded-lg border border-outline-variant p-4 shadow-sm space-y-2">
              <h2 className="text-label-lg font-label-lg text-primary uppercase flex items-center gap-2">
                <span className="material-symbols-outlined text-secondary">
                  person
                </span>
                Datos del Infractor
              </h2>
              <dl className="text-body-sm grid grid-cols-2 gap-y-1 gap-x-2">
                <dt className="text-on-surface-variant">Apellido y Nombre</dt>
                <dd className="text-right font-semibold">{acta.conductorNombre}</dd>
                <dt className="text-on-surface-variant">D.N.I.</dt>
                <dd className="text-right font-display">{acta.conductorDni}</dd>
                <dt className="text-on-surface-variant">Domicilio</dt>
                <dd className="text-right">{acta.conductorDomicilio ?? "—"}</dd>
                <dt className="text-on-surface-variant">Licencia N° / Clase</dt>
                <dd className="text-right font-display">
                  {acta.conductorLicenciaNro ?? "—"} {acta.conductorLicenciaClase ?? ""}
                </dd>
              </dl>
            </section>

            <section className="bg-surface-container-lowest rounded-lg border border-outline-variant p-4 shadow-sm space-y-2">
              <h2 className="text-label-lg font-label-lg text-primary uppercase flex items-center gap-2">
                <span className="material-symbols-outlined text-secondary">
                  directions_car
                </span>
                Vehículo / Marca y Modelo
              </h2>
              <div className="flex items-center justify-between">
                <span className="text-body-md">
                  {acta.vehiculoMarcaModelo ??
                    (acta.vehiculoTipo ? TIPO_RODADO_LABEL[acta.vehiculoTipo] : "—")}
                </span>
                <span className="font-display text-lg tracking-widest bg-surface-container px-2 py-1 rounded">
                  {acta.vehiculoDominio}
                </span>
              </div>
            </section>

            <section className="bg-surface-container-lowest rounded-lg border border-outline-variant p-4 shadow-sm space-y-2">
              <div className="flex items-center justify-between">
                <h2 className="text-label-lg font-label-lg text-primary uppercase flex items-center gap-2">
                  <span className="material-symbols-outlined text-error">
                    warning
                  </span>
                  Infracciones Constatadas
                </h2>
                <span className="text-label-sm font-label-sm bg-error-container text-on-error-container px-2 py-0.5 rounded font-bold">
                  {acta.infracciones.length} Faltas
                </span>
              </div>
              <ul className="space-y-1">
                {acta.infracciones.map((ai) => (
                  <li
                    key={ai.id}
                    className="flex items-start gap-2 text-body-sm border-b border-outline-variant/60 pb-1"
                  >
                    <span className="material-symbols-outlined text-error text-[18px] shrink-0">
                      check_box
                    </span>
                    <span>
                      {ai.infraccion.descripcion}
                      {ai.detalleOperativo ? ` — ${ai.detalleOperativo}` : ""}
                    </span>
                  </li>
                ))}
              </ul>
            </section>

            <section className="bg-primary rounded-lg p-4 shadow-sm text-on-primary">
              <span className="text-label-sm font-label-sm uppercase text-primary-fixed-dim block">
                Importe a Pagar con Descuento
              </span>
              <span className="font-display text-2xl font-bold">
                {formatoMoneda(Number(acta.montoConDescuento ?? 0))}
              </span>
              <p className="text-body-sm text-primary-fixed-dim mt-1">
                Base: {formatoMoneda(Number(acta.montoBase ?? 0))} · Art. 70° Ord. N°
                385/12
              </p>
            </section>
          </>
        ) : (
          secciones.map((seccion) => (
            <section
              key={seccion.nombre}
              className="bg-surface-container-lowest rounded-lg border border-outline-variant p-4 shadow-sm space-y-2"
            >
              <h2 className="text-label-lg font-label-lg text-primary uppercase flex items-center gap-2">
                <span className="material-symbols-outlined text-secondary">
                  description
                </span>
                {seccion.nombre}
              </h2>
              <dl className="text-body-sm space-y-1">
                {seccion.campos.map((campo) => (
                  <div key={campo.clave} className="flex justify-between gap-3">
                    <dt className="text-on-surface-variant shrink-0">
                      {campo.etiqueta}
                    </dt>
                    <dd className="text-right">
                      {datosContravencional[campo.clave]}
                    </dd>
                  </div>
                ))}
              </dl>
            </section>
          ))
        )}

        {(acta.fotoVehiculoUrl || acta.fotoDocumentoUrl) && (
          <section className="bg-surface-container-lowest rounded-lg border border-outline-variant p-4 shadow-sm space-y-2 print:hidden">
            <h2 className="text-label-lg font-label-lg text-primary uppercase flex items-center gap-2">
              <span className="material-symbols-outlined text-secondary">
                photo_camera
              </span>
              Evidencia Fotográfica
            </h2>
            <div className="grid grid-cols-2 gap-2">
              {acta.fotoVehiculoUrl && (
                <Image
                  src={acta.fotoVehiculoUrl}
                  alt="Foto del vehículo"
                  width={200}
                  height={150}
                  className="w-full h-28 object-cover rounded border border-outline-variant"
                />
              )}
              {acta.fotoDocumentoUrl && (
                <Image
                  src={acta.fotoDocumentoUrl}
                  alt="Foto de la infracción/documentación"
                  width={200}
                  height={150}
                  className="w-full h-28 object-cover rounded border border-outline-variant"
                />
              )}
            </div>
          </section>
        )}

        {yaFirmada ? (
          <section className="bg-surface-container-lowest rounded-lg border border-outline-variant p-4 shadow-sm space-y-3">
            <h2 className="text-label-lg font-label-lg text-primary uppercase">
              Firmas
            </h2>
            <div className="grid grid-cols-2 gap-3">
              <FirmaPreview
                titulo={acta.tipo === "CONTRAVENCIONAL" ? "Conductor" : "Infractor"}
                url={acta.firmaInfractorUrl}
                negativa={acta.infractorSeNiegaAFirmar}
              />
              <FirmaPreview
                titulo={acta.tipo === "CONTRAVENCIONAL" ? "Instructor" : "Actuante"}
                url={acta.firmaActuanteUrl}
              />
              {acta.tipo === "CONTRAVENCIONAL" && (
                <FirmaPreview titulo="Secretario Autorizante" url={acta.firmaSecretarioUrl} />
              )}
            </div>
          </section>
        ) : (
          <section className="bg-surface-container-lowest rounded-lg border border-outline-variant p-4 shadow-sm space-y-3 print:hidden">
            <h2 className="text-label-lg font-label-lg text-primary uppercase flex items-center gap-2">
              <span className="material-symbols-outlined text-secondary">
                draw
              </span>
              Firmas y Notificación Legal
            </h2>
            <FirmaForm
              actaId={acta.id}
              tipo={acta.tipo}
              actuanteNombre={`${acta.agente.grado ?? ""} ${acta.agente.nombreApellido} · Leg. ${acta.agente.legajo}`.trim()}
            />
          </section>
        )}
      </main>
    </>
  );
}

function FirmaPreview({
  titulo,
  url,
  negativa,
}: {
  titulo: string;
  url: string | null;
  negativa?: boolean;
}) {
  return (
    <div className="border border-outline-variant rounded p-2 bg-surface-container-low">
      <p className="text-label-sm font-label-sm text-on-surface-variant uppercase mb-1">
        {titulo}
      </p>
      {negativa ? (
        <p className="text-body-sm text-error font-semibold">Se negó a firmar</p>
      ) : url ? (
        <Image
          src={url}
          alt={`Firma ${titulo}`}
          width={160}
          height={64}
          className="h-16 w-full object-contain bg-surface-container-lowest rounded"
        />
      ) : (
        <p className="text-body-sm text-on-surface-variant">Sin imagen</p>
      )}
    </div>
  );
}
