"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";
import { Boton } from "./Boton";
import { soportaIndexedDB } from "@/lib/offline/db";
import { encolarCierreGuardia } from "@/lib/offline/colaCierreGuardia";
import { avisarCambioDeCola } from "@/lib/offline/sincronizar";

/** Cerrar guardia ahora se puede hacer desde varios lugares (inicio, menú
 * de cuenta, historial, cuenta, y un jefe sobre la guardia de otro
 * agente) — por eso pide confirmación: un toque accidental ya no alcanza
 * para terminar el turno. Debe usarse dentro de un
 * `<form action={cerrarGuardia}>`; el botón "Sí, Cerrar Guardia" es el que
 * realmente envía ese formulario cuando hay señal. Sin señal, se encola
 * en vez de enviar — no hace falta recargar la pantalla para eso, el
 * indicador global (`SincronizadorOffline`) ya avisa que queda un cierre
 * pendiente. */
export function BotonCerrarGuardiaConConfirmacion({
  guardiaId,
  puestoNombre,
  agenteNombre,
  variante = "outline",
  className,
}: {
  /** Solo hace falta para poder encolar el cierre sin conexión. */
  guardiaId?: string;
  puestoNombre: string;
  /** Si un jefe cierra la guardia de OTRO agente (no la propia), pasar su
   * nombre acá cambia el mensaje de "tu turno" a la guardia de esa persona. */
  agenteNombre?: string;
  variante?: "outline" | "destructivo";
  className?: string;
}) {
  const [confirmando, setConfirmando] = useState(false);
  const [guardadoOffline, setGuardadoOffline] = useState(false);
  const [guardandoOffline, setGuardandoOffline] = useState(false);
  const { pending } = useFormStatus();

  /** Esta pieza no renderiza el `<form>` (vive afuera, en cada pantalla que
   * la usa) — por eso la intercepción va en el click del botón "Sí, Cerrar
   * Guardia" en vez de un onSubmit, leyendo el form a través de
   * `e.currentTarget.form` (incluye el textarea de notas, si la pantalla
   * lo tiene). */
  async function manejarConfirmar(e: React.MouseEvent<HTMLButtonElement>) {
    if (navigator.onLine) return; // hay señal: que siga el submit normal
    if (!soportaIndexedDB() || !guardiaId) return;

    e.preventDefault();
    setGuardandoOffline(true);

    const formData = new FormData(e.currentTarget.form ?? undefined);
    const notasCierre = String(formData.get("notasCierre") ?? "").trim() || null;

    await encolarCierreGuardia({
      id: guardiaId,
      notasCierre,
      creadoEnCliente: new Date().toISOString(),
    });
    avisarCambioDeCola();
    setGuardandoOffline(false);
    setGuardadoOffline(true);
  }

  return (
    <>
      <Boton
        type="button"
        variante={variante}
        fullWidth
        icono="lock"
        className={className}
        onClick={() => setConfirmando(true)}
      >
        Cerrar Guardia
      </Boton>

      {confirmando && (
        <div
          className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
          onClick={() => !pending && !guardandoOffline && setConfirmando(false)}
        >
          <div
            className="w-full max-w-sm bg-surface-container-lowest rounded-xl shadow-lg p-pad-lg space-y-3"
            onClick={(e) => e.stopPropagation()}
          >
            {guardadoOffline ? (
              <>
                <p className="text-headline-sm font-headline-sm text-primary flex items-center gap-2">
                  <span className="material-symbols-outlined text-secondary">
                    cloud_off
                  </span>
                  Guardado sin conexión
                </p>
                <p className="text-body-sm text-on-surface-variant">
                  El cierre de guardia quedó guardado en este celular. Se va a
                  sincronizar solo en cuanto vuelva la señal.
                </p>
                <Boton
                  type="button"
                  fullWidth
                  onClick={() => {
                    setConfirmando(false);
                    setGuardadoOffline(false);
                  }}
                >
                  Entendido
                </Boton>
              </>
            ) : (
              <>
                <p className="text-headline-sm font-headline-sm text-primary flex items-center gap-2">
                  <span className="material-symbols-outlined text-secondary">
                    lock
                  </span>
                  ¿Cerrar la guardia?
                </p>
                <p className="text-body-sm text-on-surface-variant">
                  {agenteNombre ? (
                    <>
                      Vas a cerrar la guardia de <strong>{agenteNombre}</strong>{" "}
                      en <strong>{puestoNombre}</strong>.
                    </>
                  ) : (
                    <>
                      Vas a cerrar tu turno en <strong>{puestoNombre}</strong>.
                      No vas a poder cargar más actas hasta iniciar una
                      guardia nueva.
                    </>
                  )}
                </p>
                <div className="flex flex-col gap-2">
                  <Boton
                    type="submit"
                    variante="destructivo"
                    fullWidth
                    icono="lock"
                    disabled={pending || guardandoOffline}
                    className="disabled:opacity-60"
                    onClick={manejarConfirmar}
                  >
                    {pending || guardandoOffline ? "Cerrando…" : "Sí, Cerrar Guardia"}
                  </Boton>
                  <Boton
                    type="button"
                    variante="fantasma"
                    fullWidth
                    disabled={pending || guardandoOffline}
                    onClick={() => setConfirmando(false)}
                  >
                    Cancelar
                  </Boton>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
