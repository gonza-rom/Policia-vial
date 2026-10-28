"use client";

import { useState } from "react";
import { BotonEnviar } from "./BotonEnviar";
import { BotonCerrarGuardiaConConfirmacion } from "./BotonCerrarGuardiaConConfirmacion";

function iniciales(nombreApellido: string) {
  const partes = nombreApellido.trim().split(/\s+/);
  const letras = partes.slice(0, 2).map((p) => p[0]?.toUpperCase() ?? "");
  return letras.join("") || "PV";
}

/** El avatar del header ahora es un botón: toca para ver tu perfil, cerrar
 * guardia o cerrar sesión sin salir de la pantalla en la que estás — antes
 * llevaba a /cuenta como una página aparte. Mismo patrón de panel flotante
 * que BotonEliminarConConfirmacion (no empuja el layout del header). */
export function MenuCuenta({
  nombreApellido,
  legajo,
  rolLabel,
  guardiaPuesto,
  cerrarGuardia,
  cerrarSesion,
}: {
  nombreApellido: string;
  legajo: string;
  rolLabel: string;
  guardiaPuesto: string | null;
  cerrarGuardia: (formData: FormData) => void | Promise<void>;
  cerrarSesion: () => void | Promise<void>;
}) {
  const [abierto, setAbierto] = useState(false);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setAbierto((v) => !v)}
        aria-label="Mi perfil, cerrar guardia y cerrar sesión"
        aria-expanded={abierto}
        className="flex items-center gap-2 pl-pad-sm border-l border-on-primary-container/30 min-h-touch-min active:opacity-70"
      >
        <div className="text-right hidden sm:block">
          <p className="text-label-sm font-label-sm font-bold text-on-primary leading-tight">
            {nombreApellido}
          </p>
          <p className="text-label-sm font-label-sm text-on-primary-container text-[10px]">
            {legajo}
          </p>
        </div>
        <div className="w-8 h-8 rounded-full bg-secondary text-on-secondary font-display text-label-md flex items-center justify-center font-bold ring-2 ring-secondary-container/40 shrink-0">
          {iniciales(nombreApellido)}
        </div>
      </button>

      {abierto && (
        <>
          {/* Capa invisible para cerrar el panel al tocar afuera, sin
          oscurecer la pantalla (no es un modal bloqueante). */}
          <div
            className="fixed inset-0 z-30"
            onClick={() => setAbierto(false)}
            aria-hidden
          />
          <div className="absolute right-0 top-full mt-2 z-40 w-64 bg-surface-container-lowest border border-outline-variant rounded-lg shadow-md p-3 space-y-3">
            <div className="flex items-center gap-3 pb-2 border-b border-outline-variant">
              <div className="w-11 h-11 rounded-full bg-secondary text-on-secondary font-display text-label-lg flex items-center justify-center font-bold shrink-0">
                {iniciales(nombreApellido)}
              </div>
              <div className="min-w-0">
                <p className="text-body-md font-bold text-on-surface truncate">
                  {nombreApellido}
                </p>
                <p className="text-body-sm text-on-surface-variant">
                  Legajo {legajo} · {rolLabel}
                </p>
              </div>
            </div>

            {guardiaPuesto && (
              <form action={cerrarGuardia}>
                <BotonCerrarGuardiaConConfirmacion
                  puestoNombre={guardiaPuesto}
                  className="text-label-sm"
                />
              </form>
            )}

            <form action={cerrarSesion}>
              <BotonEnviar
                variante="outline"
                fullWidth
                icono="logout"
                className="text-label-sm text-error border-error"
                textoEnviando="Cerrando sesión…"
                onClick={() => setAbierto(false)}
              >
                Cerrar Sesión
              </BotonEnviar>
            </form>
          </div>
        </>
      )}
    </div>
  );
}
