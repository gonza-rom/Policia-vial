import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { getAgenteActual } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AppHeader } from "@/components/ui/AppHeader";
import {
  formatoMoneda,
  numeroActa,
  TIPO_RODADO_LABEL,
  ESTADO_ACTA_LABEL,
} from "@/lib/formato";
import { FirmaForm } from "./FirmaForm";

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

  const yaFirmada = acta.estado !== "PENDIENTE_FIRMA";

  return (
    <>
      <AppHeader nombreApellido={agente.nombreApellido} legajo={agente.legajo} />
      <main className="w-full max-w-2xl mx-auto px-pad-lg pt-4 pb-10 space-y-4">
        <div className="flex items-center justify-between">
          <Link
            href="/actas"
            className="flex items-center gap-1 text-secondary text-label-sm font-label-sm uppercase"
          >
            <span className="material-symbols-outlined text-[18px]">
              arrow_back
            </span>
            Volver
          </Link>
          <span
            className={`text-label-sm font-label-sm px-2 py-0.5 rounded font-bold uppercase ${
              yaFirmada
                ? "bg-secondary-container/40 text-on-secondary-container"
                : "bg-error-container text-on-error-container"
            }`}
          >
            {ESTADO_ACTA_LABEL[acta.estado]}
          </span>
        </div>

        <div className="bg-primary-container text-on-primary rounded-lg p-pad-lg flex items-center justify-between">
          <span className="text-body-sm text-primary-fixed-dim uppercase">
            Acta N°
          </span>
          <span className="font-display text-xl tracking-widest">
            {numeroActa(acta.numero)}
          </span>
        </div>

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
              {acta.vehiculoMarcaModelo ?? TIPO_RODADO_LABEL[acta.vehiculoTipo]}
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
            {formatoMoneda(Number(acta.montoConDescuento))}
          </span>
          <p className="text-body-sm text-primary-fixed-dim mt-1">
            Base: {formatoMoneda(Number(acta.montoBase))} · Art. 70° Ord. N°
            385/12
          </p>
        </section>

        {yaFirmada ? (
          <section className="bg-surface-container-lowest rounded-lg border border-outline-variant p-4 shadow-sm space-y-3">
            <h2 className="text-label-lg font-label-lg text-primary uppercase">
              Firmas
            </h2>
            <div className="grid grid-cols-2 gap-3">
              <FirmaPreview
                titulo="Infractor"
                url={acta.firmaInfractorUrl}
                negativa={acta.infractorSeNiegaAFirmar}
              />
              <FirmaPreview titulo="Actuante" url={acta.firmaActuanteUrl} />
            </div>
          </section>
        ) : (
          <section className="bg-surface-container-lowest rounded-lg border border-outline-variant p-4 shadow-sm space-y-3">
            <h2 className="text-label-lg font-label-lg text-primary uppercase flex items-center gap-2">
              <span className="material-symbols-outlined text-secondary">
                draw
              </span>
              Firmas y Notificación Legal
            </h2>
            <FirmaForm
              actaId={acta.id}
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
