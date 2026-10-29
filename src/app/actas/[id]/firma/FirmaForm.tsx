"use client";

import { useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import { firmarActa } from "./actions";
import { FirmaCanvas, type FirmaCanvasHandle } from "@/components/ui/FirmaCanvas";
import { Boton } from "@/components/ui/Boton";
import { soportaIndexedDB } from "@/lib/offline/db";
import { encolarFirma } from "@/lib/offline/colaFirmas";
import { avisarCambioDeCola } from "@/lib/offline/sincronizar";

/** `canvas.toDataURL()` da un string base64 — para guardarlo en IndexedDB
 * y subirlo después a Cloudinary (mismo mecanismo que las fotos offline)
 * hace falta como Blob, no como string. */
function dataUrlABlob(dataUrl: string): Blob {
  const [header, base64] = dataUrl.split(",");
  const mime = header.match(/:(.*?);/)?.[1] ?? "image/png";
  const binario = atob(base64);
  const bytes = new Uint8Array(binario.length);
  for (let i = 0; i < binario.length; i++) bytes[i] = binario.charCodeAt(i);
  return new Blob([bytes], { type: mime });
}

export function FirmaForm({
  actaId,
  tipo,
  actuanteNombre,
}: {
  actaId: string;
  tipo: "MUNICIPAL" | "CONTRAVENCIONAL";
  actuanteNombre: string;
}) {
  const esContravencional = tipo === "CONTRAVENCIONAL";
  const canvasInfractor = useRef<FirmaCanvasHandle>(null);
  const canvasActuante = useRef<FirmaCanvasHandle>(null);
  const canvasSecretario = useRef<FirmaCanvasHandle>(null);
  const inputFirmaInfractor = useRef<HTMLInputElement>(null);
  const inputFirmaActuante = useRef<HTMLInputElement>(null);
  const inputFirmaSecretario = useRef<HTMLInputElement>(null);
  const [seNiega, setSeNiega] = useState(false);
  const [errorFirma, setErrorFirma] = useState<string | null>(null);
  const [guardadoOffline, setGuardadoOffline] = useState(false);
  const [guardandoOffline, setGuardandoOffline] = useState(false);

  /** Firmar offline solo aplica a un acta YA sincronizada — esta pantalla
   * (`/actas/[id]/firma`) solo se llega a abrir para una que ya tiene
   * número real, así que no hace falta distinguir casos como en los
   * demás formularios. */
  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    const firmaActuante = canvasActuante.current?.obtenerDataUrl() ?? null;
    if (!firmaActuante) {
      e.preventDefault();
      setErrorFirma(
        `Falta la firma del ${esContravencional ? "instructor" : "actuante"} para cerrar el acta.`,
      );
      return;
    }
    let firmaInfractor: string | null = null;
    if (!seNiega) {
      firmaInfractor = canvasInfractor.current?.obtenerDataUrl() ?? null;
      if (!firmaInfractor) {
        e.preventDefault();
        setErrorFirma(
          `Falta la firma del ${esContravencional ? "conductor" : "infractor"}. Si se niega a firmar, marcá la casilla correspondiente.`,
        );
        return;
      }
    }
    let firmaSecretario: string | null = null;
    if (esContravencional) {
      firmaSecretario = canvasSecretario.current?.obtenerDataUrl() ?? null;
      if (!firmaSecretario) {
        e.preventDefault();
        setErrorFirma("Falta la firma del secretario autorizante.");
        return;
      }
    }
    setErrorFirma(null);

    if (navigator.onLine || !soportaIndexedDB()) {
      // Hay señal (o no hay forma de guardar local): sigue el submit
      // normal, solo hay que volcar los data URL a los inputs ocultos.
      if (inputFirmaInfractor.current) inputFirmaInfractor.current.value = firmaInfractor ?? "";
      if (inputFirmaActuante.current) inputFirmaActuante.current.value = firmaActuante;
      if (inputFirmaSecretario.current) inputFirmaSecretario.current.value = firmaSecretario ?? "";
      return;
    }

    e.preventDefault();
    setGuardandoOffline(true);

    await encolarFirma({
      id: actaId,
      tipo,
      infractorSeNiegaAFirmar: seNiega,
      firmaInfractorBlob: firmaInfractor ? dataUrlABlob(firmaInfractor) : null,
      firmaActuanteBlob: dataUrlABlob(firmaActuante),
      firmaSecretarioBlob: firmaSecretario ? dataUrlABlob(firmaSecretario) : null,
      creadoEnCliente: new Date().toISOString(),
    });
    avisarCambioDeCola();
    setGuardandoOffline(false);
    setGuardadoOffline(true);
  }

  if (guardadoOffline) {
    return (
      <div className="bg-surface-container-lowest rounded-xl border border-outline-variant shadow-sm p-pad-xl text-center space-y-4">
        <span className="material-symbols-outlined text-5xl text-secondary">
          cloud_off
        </span>
        <h2 className="text-headline-md font-headline-md text-primary">
          Guardado sin conexión
        </h2>
        <p className="text-body-md text-on-surface-variant">
          La firma quedó guardada en este celular. El acta se va a marcar
          como firmada en cuanto vuelva la señal.
        </p>
        <Boton
          onClick={() => {
            // eslint-disable-next-line @next/next/no-location-assign-relative-destination -- recarga dura intencional, ver NuevaActaForm
            window.location.href = "/guardia";
          }}
          fullWidth
          icono="home"
        >
          Volver al Menú
        </Boton>
      </div>
    );
  }

  return (
    <form action={firmarActa} onSubmit={handleSubmit} className="space-y-4">
      <input type="hidden" name="actaId" value={actaId} />
      <input type="hidden" name="firmaInfractor" ref={inputFirmaInfractor} />
      <input type="hidden" name="firmaActuante" ref={inputFirmaActuante} />
      {esContravencional && (
        <input type="hidden" name="firmaSecretario" ref={inputFirmaSecretario} />
      )}

      <p className="text-body-sm font-body-sm text-on-surface-variant">
        Queda Ud. debidamente notificado. Vencido el plazo sin dar cumplimiento
        incurrirá en rebeldía. Dicho acto se firma en ejemplares de un mismo
        tenor. CONSTE.
      </p>

      <div className="border border-outline rounded p-3 bg-surface-container-low">
        <div className="flex justify-between items-center mb-1">
          <span className="text-label-sm font-label-sm text-primary uppercase font-bold">
            Firma del {esContravencional ? "Conductor" : "Infractor"}{" "}
            {seNiega && "(Negativa registrada)"}
          </span>
          <button
            type="button"
            onClick={() => canvasInfractor.current?.limpiar()}
            className="min-h-touch-min px-1 text-label-sm text-error uppercase font-bold"
          >
            Limpiar
          </button>
        </div>
        <FirmaCanvas ref={canvasInfractor} deshabilitado={seNiega} />
        <label className="flex items-center gap-2 mt-2 text-body-sm text-on-surface">
          <input
            type="checkbox"
            name="infractorSeNiegaAFirmar"
            checked={seNiega}
            onChange={(e) => setSeNiega(e.target.checked)}
            className="w-5 h-5 accent-error"
          />
          El {esContravencional ? "conductor" : "infractor"} se niega a firmar
        </label>
      </div>

      <div className="border border-outline rounded p-3 bg-surface-container-low">
        <div className="flex justify-between items-center mb-1">
          <span className="text-label-sm font-label-sm text-primary uppercase font-bold">
            Firma del {esContravencional ? "Instructor" : "Actuante"}
          </span>
          <button
            type="button"
            onClick={() => canvasActuante.current?.limpiar()}
            className="min-h-touch-min px-1 text-label-sm text-error uppercase font-bold"
          >
            Limpiar
          </button>
        </div>
        <FirmaCanvas ref={canvasActuante} />
        <p className="text-body-sm text-on-surface-variant mt-1">
          {actuanteNombre}
        </p>
      </div>

      {esContravencional && (
        <div className="border border-outline rounded p-3 bg-surface-container-low">
          <div className="flex justify-between items-center mb-1">
            <span className="text-label-sm font-label-sm text-primary uppercase font-bold">
              Firma del Secretario Autorizante
            </span>
            <button
              type="button"
              onClick={() => canvasSecretario.current?.limpiar()}
              className="min-h-touch-min px-1 text-label-sm text-error uppercase font-bold"
            >
              Limpiar
            </button>
          </div>
          <FirmaCanvas ref={canvasSecretario} />
        </div>
      )}

      {errorFirma && (
        <p className="text-body-sm text-error bg-error-container/40 border border-error rounded p-2">
          {errorFirma}
        </p>
      )}

      <BotonCerrar guardandoOffline={guardandoOffline} />
    </form>
  );
}

function BotonCerrar({ guardandoOffline }: { guardandoOffline: boolean }) {
  const { pending } = useFormStatus();
  return (
    <Boton
      type="submit"
      icono="task_alt"
      fullWidth
      disabled={pending || guardandoOffline}
      className="disabled:opacity-60"
    >
      {pending || guardandoOffline ? "Cerrando acta…" : "Firmar y Cerrar Acta"}
    </Boton>
  );
}
