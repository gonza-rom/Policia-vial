"use client";

import { useEffect, useRef, useState } from "react";
import { comprimirImagen } from "@/lib/imagenes";

export type FotoExistente = { id: string; url: string };

/** Varias fotos por categoría (antes era una sola por `CampoArchivo`). Las
 * que ya estaban guardadas (`existentes`) y las que se eligen ahora
 * conviven en la misma grilla, cada una con su botón de quitar — las
 * existentes se marcan para borrar en un hidden input (`${name}Borrar`,
 * uno por id) y las nuevas viajan en el input de archivos real.
 *
 * El input real sincroniza su `.files` con el estado de "nuevos" cada vez
 * que cambia (agregar o quitar) usando un DataTransfer: es el único modo
 * de que un <input type="file"> refleje una lista editable por el
 * usuario en vez de solo lo último que elige el selector nativo. */
export function CampoFotos({
  label,
  name,
  existentes = [],
}: {
  label: string;
  name: string;
  existentes?: FotoExistente[];
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [restantes, setRestantes] = useState(existentes);
  const [borradas, setBorradas] = useState<string[]>([]);
  const [nuevos, setNuevos] = useState<{ archivo: File; previewUrl: string }[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [verGrande, setVerGrande] = useState<string | null>(null);

  useEffect(() => {
    if (!inputRef.current) return;
    const dt = new DataTransfer();
    for (const n of nuevos) dt.items.add(n.archivo);
    inputRef.current.files = dt.files;
  }, [nuevos]);

  useEffect(() => {
    return () => {
      for (const n of nuevos) URL.revokeObjectURL(n.previewUrl);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- solo al desmontar
  }, []);

  async function manejarCambio(e: React.ChangeEvent<HTMLInputElement>) {
    const archivos = Array.from(e.target.files ?? []);
    if (!archivos.length) return;

    const noImagen = archivos.find((a) => !a.type.startsWith("image/"));
    if (noImagen) {
      setError("Uno de los archivos elegidos no es una imagen válida.");
      return;
    }

    setError(null);
    // Achicar antes de guardar: una foto de cámara sin comprimir pesa
    // varios MB, y con varias por acta eso se nota mucho con poca señal.
    const comprimidos = await Promise.all(archivos.map((a) => comprimirImagen(a)));
    setNuevos((prev) => [
      ...prev,
      ...comprimidos.map((archivo) => ({ archivo, previewUrl: URL.createObjectURL(archivo) })),
    ]);
  }

  function quitarExistente(id: string) {
    setRestantes((prev) => prev.filter((f) => f.id !== id));
    setBorradas((prev) => [...prev, id]);
  }

  function quitarNuevo(index: number) {
    setNuevos((prev) => {
      URL.revokeObjectURL(prev[index].previewUrl);
      return prev.filter((_, i) => i !== index);
    });
  }

  return (
    <div>
      <p className="block text-label-sm font-label-sm text-on-surface-variant uppercase mb-1">
        {label}
      </p>

      <div className="grid grid-cols-3 gap-2">
        {restantes.map((foto) => (
          <div key={foto.id} className="relative">
            <button type="button" onClick={() => setVerGrande(foto.url)} className="block w-full">
              {/* eslint-disable-next-line @next/next/no-img-element -- miniatura de una URL ya subida a Cloudinary */}
              <img
                src={foto.url}
                alt={`Foto ya guardada de ${label}`}
                className="w-full h-20 object-cover rounded border-2 border-secondary"
              />
            </button>
            <button
              type="button"
              onClick={() => quitarExistente(foto.id)}
              aria-label="Quitar foto"
              className="absolute top-1 right-1 w-6 h-6 flex items-center justify-center rounded-full bg-error text-on-error shadow"
            >
              <span className="material-symbols-outlined text-[14px]">close</span>
            </button>
          </div>
        ))}

        {nuevos.map((n, i) => (
          <div key={n.previewUrl} className="relative">
            <button type="button" onClick={() => setVerGrande(n.previewUrl)} className="block w-full">
              {/* eslint-disable-next-line @next/next/no-img-element -- vista previa local (blob: URL) */}
              <img
                src={n.previewUrl}
                alt={`Vista previa: ${n.archivo.name}`}
                className="w-full h-20 object-cover rounded border-2 border-secondary"
              />
            </button>
            <button
              type="button"
              onClick={() => quitarNuevo(i)}
              aria-label="Quitar foto"
              className="absolute top-1 right-1 w-6 h-6 flex items-center justify-center rounded-full bg-error text-on-error shadow"
            >
              <span className="material-symbols-outlined text-[14px]">close</span>
            </button>
          </div>
        ))}

        <label
          htmlFor={name}
          className="flex items-center justify-center gap-1 h-20 border rounded text-label-sm font-label-sm cursor-pointer text-center border-dashed border-outline bg-surface-container-low text-on-surface-variant hover:bg-surface-container"
        >
          <span className="material-symbols-outlined text-[18px]">add_a_photo</span>
        </label>
      </div>

      <input
        ref={inputRef}
        id={name}
        name={name}
        type="file"
        accept="image/*"
        capture="environment"
        multiple
        className="hidden"
        onChange={manejarCambio}
      />
      {borradas.map((id) => (
        <input key={id} type="hidden" name={`${name}Borrar`} value={id} />
      ))}

      {error && <p className="text-body-sm text-error mt-1">{error}</p>}

      {verGrande && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
          onClick={() => setVerGrande(null)}
        >
          {/* eslint-disable-next-line @next/next/no-img-element -- vista previa ampliada, puede ser blob: o una URL de Cloudinary */}
          <img
            src={verGrande}
            alt="Vista previa ampliada"
            className="max-w-full max-h-full object-contain rounded"
          />
        </div>
      )}
    </div>
  );
}
