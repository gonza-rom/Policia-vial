"use client";

import { useEffect, useRef, useState } from "react";
import clsx from "clsx";

/** Para un acta con valor legal, confirmar que la foto realmente se
 * adjuntó importa — además de mostrar el nombre, se ve una miniatura real
 * (vista previa local, antes de subir nada al servidor) con opción de
 * verla más grande o quitarla y elegir otra. */
export function CampoArchivo({
  label,
  id,
  name,
}: {
  label: string;
  id: string;
  name: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [nombreArchivo, setNombreArchivo] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [verGrande, setVerGrande] = useState(false);

  // Revocar el blob URL anterior cuando cambia o se desmonta — si no, se
  // acumulan objetos en memoria mientras el agente prueba varias fotos.
  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  function manejarCambio(e: React.ChangeEvent<HTMLInputElement>) {
    const archivo = e.target.files?.[0] ?? null;
    if (previewUrl) URL.revokeObjectURL(previewUrl);

    if (!archivo) {
      setNombreArchivo(null);
      setPreviewUrl(null);
      setError(null);
      return;
    }

    if (!archivo.type.startsWith("image/")) {
      setError("El archivo elegido no es una imagen válida.");
      setNombreArchivo(null);
      setPreviewUrl(null);
      if (inputRef.current) inputRef.current.value = "";
      return;
    }

    setError(null);
    setNombreArchivo(archivo.name);
    setPreviewUrl(URL.createObjectURL(archivo));
  }

  function quitar() {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setNombreArchivo(null);
    setPreviewUrl(null);
    setError(null);
    if (inputRef.current) inputRef.current.value = "";
  }

  return (
    <div>
      <label
        htmlFor={id}
        className="block text-label-sm font-label-sm text-on-surface-variant uppercase mb-1"
      >
        {label}
      </label>

      {previewUrl ? (
        <div className="relative">
          <button
            type="button"
            onClick={() => setVerGrande(true)}
            className="block w-full"
          >
            {/* eslint-disable-next-line @next/next/no-img-element -- vista previa local (blob: URL), next/image no soporta este esquema */}
            <img
              src={previewUrl}
              alt={`Vista previa: ${nombreArchivo}`}
              className="w-full h-28 object-cover rounded border-2 border-secondary"
            />
          </button>
          <div className="absolute top-1 right-1 flex gap-1">
            <button
              type="button"
              onClick={() => setVerGrande(true)}
              aria-label="Ver más grande"
              className="w-7 h-7 flex items-center justify-center rounded-full bg-surface/90 text-on-surface shadow"
            >
              <span className="material-symbols-outlined text-[16px]">zoom_in</span>
            </button>
            <button
              type="button"
              onClick={quitar}
              aria-label="Quitar foto"
              className="w-7 h-7 flex items-center justify-center rounded-full bg-error text-on-error shadow"
            >
              <span className="material-symbols-outlined text-[16px]">close</span>
            </button>
          </div>
        </div>
      ) : (
        <label
          htmlFor={id}
          className={clsx(
            "flex items-center justify-center gap-1.5 min-h-touch-min border rounded text-label-sm font-label-sm cursor-pointer px-2 text-center",
            "border-dashed border-outline bg-surface-container-low text-on-surface-variant hover:bg-surface-container",
          )}
        >
          <span className="material-symbols-outlined text-[18px]">photo_camera</span>
          <span className="truncate">Adjuntar</span>
        </label>
      )}

      <input
        ref={inputRef}
        id={id}
        name={name}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={manejarCambio}
      />

      {error && <p className="text-body-sm text-error mt-1">{error}</p>}

      {verGrande && previewUrl && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
          onClick={() => setVerGrande(false)}
        >
          {/* eslint-disable-next-line @next/next/no-img-element -- vista previa local (blob: URL) */}
          <img
            src={previewUrl}
            alt={`Vista previa ampliada: ${nombreArchivo}`}
            className="max-w-full max-h-full object-contain rounded"
          />
        </div>
      )}
    </div>
  );
}
