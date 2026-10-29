import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { esJefe, getAgenteActual, puedeEditarActa } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AppHeader } from "@/components/ui/AppHeader";
import { BottomNav } from "@/components/ui/BottomNav";
import { TarjetaSeccion } from "@/components/ui/Tarjeta";
import { BadgeEstadoActa } from "@/components/ui/BadgeEstadoActa";
import { EncabezadoImprimible } from "@/components/ui/EncabezadoImprimible";
import {
  formatoFecha,
  formatoHora,
  formatoMoneda,
  numeroActa,
  TIPO_RODADO_LABEL,
  JURISDICCION_LABEL,
} from "@/lib/formato";
import { ImagenConFallback } from "@/components/ui/ImagenConFallback";
import { AvisoOtraJurisdiccion } from "@/components/ui/AvisoOtraJurisdiccion";
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
      puestoTrabajo: true,
      infracciones: { include: { infraccion: true } },
      fotos: { orderBy: { orden: "asc" } },
    },
  });

  if (!acta) notFound();

  const fotosVehiculo = acta.fotos.filter((f) => f.categoria === "VEHICULO");
  const fotosDocumento = acta.fotos.filter((f) => f.categoria === "DOCUMENTO");

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

  // Para la contravencional, el agente carga fecha/hora a mano (campo
  // dinámico); para la municipal no existe ese campo, así que se usa el
  // momento en que se creó el acta — en ambos casos es "cuándo pasó esto",
  // nunca la fecha de cuando se exporta el PDF.
  const fechaImprimible = datosContravencional.fecha
    ? datosContravencional.fecha.split("-").reverse().join("/")
    : formatoFecha(acta.fecha);
  const horaImprimible = datosContravencional.hora || formatoHora(acta.fecha);

  return (
    <>
      <AppHeader />
      <main
        className="imprimible w-full max-w-2xl mx-auto px-pad-lg pt-4 pb-24 space-y-4"
      >
        <EncabezadoImprimible
          titulo={acta.tipo === "CONTRAVENCIONAL" ? "Acta Contravencional" : "Acta Municipal"}
          lugar={acta.lugarControl || acta.puesto.nombre}
          fecha={fechaImprimible}
          hora={horaImprimible}
        />

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
              // <a> normal, no <Link>: la edición offline necesita que
              // esto sea una navegación dura — ver sw.js.
               
              <a
                href={`/actas/${acta.id}/editar`}
                className="flex items-center gap-1 text-secondary text-label-sm font-label-sm uppercase"
              >
                <span className="material-symbols-outlined text-[18px]">edit</span>
                Editar
              </a>
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
          <BadgeEstadoActa estado={acta.estado} />
          <BotonImprimir />
        </div>

        {acta.modalidadTrabajo === "OTRA_JURISDICCION" && (
          <AvisoOtraJurisdiccion
            titulo="Labrada"
            puestoOrigen={acta.puesto.nombre}
            puestoTrabajo={acta.puestoTrabajo?.nombre}
            motivo={acta.motivoOtraJurisdiccion}
          />
        )}

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
              {acta.tipo === "MUNICIPAL" && acta.jurisdiccion
                ? JURISDICCION_LABEL[acta.jurisdiccion]
                : acta.puesto.nombre}
            </span>
          </div>
          <span className="font-display text-xl tracking-widest">
            {numeroActa(acta.numero)}
          </span>
        </div>

        {acta.tipo === "MUNICIPAL" ? (
          <>
            <TarjetaSeccion icono="person" titulo="Datos del Infractor">
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
            </TarjetaSeccion>

            <TarjetaSeccion icono="directions_car" titulo="Vehículo / Marca y Modelo">
              <div className="flex items-center justify-between">
                <span className="text-body-md">
                  {acta.vehiculoMarcaModelo ?? "—"}
                </span>
                <span className="font-display text-lg tracking-widest bg-surface-container px-2 py-1 rounded">
                  {acta.vehiculoDominio}
                </span>
              </div>
              {acta.vehiculoTipo && (
                <p className="text-body-sm text-on-surface-variant">
                  Tipo:{" "}
                  <span className="font-semibold text-on-surface">
                    {acta.vehiculoTipo === "OTRO" && acta.vehiculoTipoOtro
                      ? acta.vehiculoTipoOtro
                      : TIPO_RODADO_LABEL[acta.vehiculoTipo]}
                  </span>
                </p>
              )}
            </TarjetaSeccion>

            <TarjetaSeccion
              icono="warning"
              iconoTono="error"
              titulo="Infracciones Constatadas"
              badge={`${acta.infracciones.length} Faltas`}
              badgeTono="error"
            >
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
            </TarjetaSeccion>

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
            <TarjetaSeccion key={seccion.nombre} icono="description" titulo={seccion.nombre}>
              <dl className="text-body-sm space-y-1">
                {seccion.campos.map((campo) => {
                  const valor = datosContravencional[campo.clave];
                  const valorMostrado =
                    campo.tipo === "FECHA"
                      ? valor.split("-").reverse().join("/")
                      : campo.tipo === "HORA"
                        ? `${valor} Hs`
                        : valor;
                  return (
                    <div key={campo.clave} className="flex justify-between gap-3">
                      <dt className="text-on-surface-variant shrink-0">
                        {campo.etiqueta}
                      </dt>
                      <dd className="text-right">{valorMostrado}</dd>
                    </div>
                  );
                })}
              </dl>
            </TarjetaSeccion>
          ))
        )}

        {(fotosVehiculo.length > 0 || fotosDocumento.length > 0) && (
          // Sin print:hidden: la evidencia también tiene que salir en el PDF
          // (a diferencia de otras secciones de esta página). object-contain
          // en vez de cover: se ve la foto completa, sin recortar ni
          // deformar — importante tratándose de evidencia con valor legal.
          <TarjetaSeccion icono="photo_camera" titulo="Evidencia Fotográfica">
            <div className="grid grid-cols-2 gap-2 print:break-inside-avoid">
              {fotosVehiculo.map((foto, i) => (
                <figure key={foto.id} className="print:break-inside-avoid">
                  <ImagenConFallback
                    src={foto.url}
                    alt={`Foto del vehículo ${i + 1}`}
                    width={400}
                    height={300}
                    priority={i === 0}
                    className="w-full h-28 print:h-auto object-contain print:aspect-[4/3] rounded border border-outline-variant bg-surface-container-low"
                  />
                  <figcaption className="text-body-sm text-on-surface-variant text-center mt-1">
                    Vehículo{fotosVehiculo.length > 1 ? ` (${i + 1}/${fotosVehiculo.length})` : ""}
                  </figcaption>
                </figure>
              ))}
              {fotosDocumento.map((foto, i) => (
                <figure key={foto.id} className="print:break-inside-avoid">
                  <ImagenConFallback
                    src={foto.url}
                    alt={`Foto de la infracción/documentación ${i + 1}`}
                    width={400}
                    height={300}
                    priority={i === 0}
                    className="w-full h-28 print:h-auto object-contain print:aspect-[4/3] rounded border border-outline-variant bg-surface-container-low"
                  />
                  <figcaption className="text-body-sm text-on-surface-variant text-center mt-1">
                    Documentación / Infracción
                    {fotosDocumento.length > 1 ? ` (${i + 1}/${fotosDocumento.length})` : ""}
                  </figcaption>
                </figure>
              ))}
            </div>
          </TarjetaSeccion>
        )}

        {yaFirmada ? (
          <TarjetaSeccion icono="draw" titulo="Firmas">
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
          </TarjetaSeccion>
        ) : (
          <TarjetaSeccion
            icono="draw"
            titulo="Firmas y Notificación Legal"
            className="print:hidden"
          >
            <FirmaForm
              actaId={acta.id}
              tipo={acta.tipo}
              actuanteNombre={`${acta.agente.grado ?? ""} ${acta.agente.nombreApellido} · Leg. ${acta.agente.legajo}`.trim()}
            />
          </TarjetaSeccion>
        )}
      </main>
      <BottomNav verAgentes={esJefe(agente)} />
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
