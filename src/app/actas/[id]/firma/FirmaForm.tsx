"use client";

import { useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import { firmarActa } from "./actions";
import { FirmaCanvas, type FirmaCanvasHandle } from "@/components/ui/FirmaCanvas";
import { Boton } from "@/components/ui/Boton";

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

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    const firmaActuante = canvasActuante.current?.obtenerDataUrl() ?? null;
    if (!firmaActuante) {
      e.preventDefault();
      setErrorFirma(
        `Falta la firma del ${esContravencional ? "instructor" : "actuante"} para cerrar el acta.`,
      );
      return;
    }
    if (!seNiega) {
      const firmaInfractor = canvasInfractor.current?.obtenerDataUrl() ?? null;
      if (!firmaInfractor) {
        e.preventDefault();
        setErrorFirma(
          `Falta la firma del ${esContravencional ? "conductor" : "infractor"}. Si se niega a firmar, marcá la casilla correspondiente.`,
        );
        return;
      }
      if (inputFirmaInfractor.current) {
        inputFirmaInfractor.current.value = firmaInfractor;
      }
    }
    if (esContravencional) {
      const firmaSecretario = canvasSecretario.current?.obtenerDataUrl() ?? null;
      if (!firmaSecretario) {
        e.preventDefault();
        setErrorFirma("Falta la firma del secretario autorizante.");
        return;
      }
      if (inputFirmaSecretario.current) {
        inputFirmaSecretario.current.value = firmaSecretario;
      }
    }
    if (inputFirmaActuante.current) {
      inputFirmaActuante.current.value = firmaActuante;
    }
    setErrorFirma(null);
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

      <BotonCerrar />
    </form>
  );
}

function BotonCerrar() {
  const { pending } = useFormStatus();
  return (
    <Boton
      type="submit"
      icono="task_alt"
      fullWidth
      disabled={pending}
      className="disabled:opacity-60"
    >
      {pending ? "Cerrando acta…" : "Firmar y Cerrar Acta"}
    </Boton>
  );
}
