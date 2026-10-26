"use client";

import { useState } from "react";
import clsx from "clsx";

/** Para un acta con valor legal, confirmar que la foto realmente se
 * adjuntó importa — antes este campo mostraba "Adjuntar" sin cambios
 * aunque ya hubiera un archivo elegido. */
export function CampoArchivo({
  label,
  id,
  name,
}: {
  label: string;
  id: string;
  name: string;
}) {
  const [nombreArchivo, setNombreArchivo] = useState<string | null>(null);

  return (
    <div>
      <label
        htmlFor={id}
        className="block text-label-sm font-label-sm text-on-surface-variant uppercase mb-1"
      >
        {label}
      </label>
      <label
        htmlFor={id}
        className={clsx(
          "flex items-center justify-center gap-1.5 min-h-touch-min border rounded text-label-sm font-label-sm cursor-pointer px-2 text-center",
          nombreArchivo
            ? "border-secondary bg-secondary-fixed/30 text-primary"
            : "border-dashed border-outline bg-surface-container-low text-on-surface-variant hover:bg-surface-container",
        )}
      >
        <span className="material-symbols-outlined text-[18px]">
          {nombreArchivo ? "check_circle" : "photo_camera"}
        </span>
        <span className="truncate">{nombreArchivo ?? "Adjuntar"}</span>
      </label>
      <input
        id={id}
        name={name}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => setNombreArchivo(e.target.files?.[0]?.name ?? null)}
      />
    </div>
  );
}
