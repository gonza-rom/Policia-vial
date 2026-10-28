"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";
import { Boton } from "./Boton";

/** Cerrar guardia ahora se puede hacer desde 3 lugares (inicio, menú de
 * cuenta, historial) — por eso pide confirmación: un toque accidental ya
 * no alcanza para terminar el turno. Debe usarse dentro de un
 * `<form action={cerrarGuardia}>`; el botón "Sí, Cerrar Guardia" es el que
 * realmente envía ese formulario. */
export function BotonCerrarGuardiaConConfirmacion({
  puestoNombre,
  agenteNombre,
  variante = "outline",
  className,
}: {
  puestoNombre: string;
  /** Si un jefe cierra la guardia de OTRO agente (no la propia), pasar su
   * nombre acá cambia el mensaje de "tu turno" a la guardia de esa persona. */
  agenteNombre?: string;
  variante?: "outline" | "destructivo";
  className?: string;
}) {
  const [confirmando, setConfirmando] = useState(false);
  const { pending } = useFormStatus();

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
          onClick={() => !pending && setConfirmando(false)}
        >
          <div
            className="w-full max-w-sm bg-surface-container-lowest rounded-xl shadow-lg p-pad-lg space-y-3"
            onClick={(e) => e.stopPropagation()}
          >
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
                  Vas a cerrar tu turno en <strong>{puestoNombre}</strong>. No
                  vas a poder cargar más actas hasta iniciar una guardia
                  nueva.
                </>
              )}
            </p>
            <div className="flex flex-col gap-2">
              <Boton
                type="submit"
                variante="destructivo"
                fullWidth
                icono="lock"
                disabled={pending}
                className="disabled:opacity-60"
              >
                {pending ? "Cerrando…" : "Sí, Cerrar Guardia"}
              </Boton>
              <Boton
                type="button"
                variante="fantasma"
                fullWidth
                disabled={pending}
                onClick={() => setConfirmando(false)}
              >
                Cancelar
              </Boton>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
