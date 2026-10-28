"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";
import { elegirPuesto } from "./actions";

type PuestoDTO = {
  id: string;
  nombre: string;
  ubicacion: string | null;
};

function BotonPuesto({
  puesto,
  seleccionado,
  tocado,
  onTocar,
}: {
  puesto: PuestoDTO;
  seleccionado: boolean;
  tocado: boolean;
  onTocar: () => void;
}) {
  const { pending } = useFormStatus();
  const enviando = pending && tocado;

  return (
    <button
      type="submit"
      name="puestoId"
      value={puesto.id}
      disabled={pending}
      onClick={onTocar}
      className={`min-h-[92px] rounded-lg border-2 p-2.5 flex flex-col items-center justify-center gap-1 text-center active:scale-95 transition-all disabled:opacity-60 ${
        seleccionado
          ? "border-primary bg-primary-container text-on-primary"
          : "border-outline-variant bg-surface-container-lowest text-on-surface hover:bg-surface-container"
      }`}
    >
      <span
        className={`material-symbols-outlined ${enviando ? "animate-spin" : ""} ${
          seleccionado ? "text-secondary-container" : "text-secondary"
        }`}
      >
        {enviando ? "progress_activity" : "shield"}
      </span>
      <span className="text-label-sm font-label-sm leading-tight">
        {enviando ? "Confirmando…" : puesto.nombre}
      </span>
      {!enviando && puesto.ubicacion && (
        <span
          className={`text-[11px] leading-tight line-clamp-1 w-full ${
            seleccionado ? "text-on-primary/80" : "text-on-surface-variant"
          }`}
        >
          {puesto.ubicacion}
        </span>
      )}
    </button>
  );
}

/** Elegir puesto en la grilla ahora avisa "Confirmando…" en el botón
 * tocado y deshabilita el resto mientras se envía — con mala señal en
 * ruta, sin esto no se sabe si el toque se registró y se puede volver a
 * tocar otro puesto por error. */
export function SelectorPuesto({
  puestos,
  actualId,
}: {
  puestos: PuestoDTO[];
  actualId: string | undefined;
}) {
  const [tocadoId, setTocadoId] = useState<string | null>(null);

  return (
    <form action={elegirPuesto} className="grid grid-cols-3 gap-2.5">
      {puestos.map((p) => (
        <BotonPuesto
          key={p.id}
          puesto={p}
          seleccionado={p.id === actualId}
          tocado={p.id === tocadoId}
          onTocar={() => setTocadoId(p.id)}
        />
      ))}
    </form>
  );
}
