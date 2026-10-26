"use client";

import { useState } from "react";
import { Boton } from "./Boton";

/** Confirmación de borrado propia de la app en vez del confirm() nativo del
 * navegador (que se ve como una alerta del sistema, no de la app, y no se
 * puede estilar). El panel se posiciona flotando sobre el botón para no
 * empujar el layout de la fila donde vive (header de acta, item de lista). */
export function BotonEliminarConConfirmacion({ mensaje }: { mensaje: string }) {
  const [confirmando, setConfirmando] = useState(false);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setConfirmando(true)}
        className="min-h-touch-min flex items-center gap-1 text-error text-label-sm font-label-sm uppercase"
      >
        <span className="material-symbols-outlined text-[18px]">delete</span>
        Eliminar
      </button>

      {confirmando && (
        <div className="absolute right-0 top-full mt-1 z-20 w-52 bg-surface-container-lowest border-2 border-error rounded-lg shadow-md p-3 space-y-3">
          <p className="text-body-sm text-on-surface">{mensaje}</p>
          <div className="flex flex-col gap-2">
            <Boton type="submit" variante="destructivo" fullWidth className="text-label-sm">
              Sí, Eliminar
            </Boton>
            <Boton
              type="button"
              variante="fantasma"
              fullWidth
              className="text-label-sm"
              onClick={() => setConfirmando(false)}
            >
              Cancelar
            </Boton>
          </div>
        </div>
      )}
    </div>
  );
}
