"use client";

import { useState } from "react";
import Image, { type ImageProps } from "next/image";

/** Para evidencia con valor legal (fotos de acta), un link roto a
 * Cloudinary no puede fallar en silencio — se avisa en vez de generar un
 * PDF que parece completo pero le falta una foto. */
export function ImagenConFallback({ alt, ...rest }: ImageProps) {
  const [fallo, setFallo] = useState(false);

  if (fallo) {
    return (
      <div className="w-full h-28 flex flex-col items-center justify-center gap-1 rounded border border-dashed border-error bg-error-container/30 text-error text-center p-2">
        <span className="material-symbols-outlined text-[20px]">broken_image</span>
        <span className="text-body-sm">No se pudo cargar esta imagen</span>
      </div>
    );
  }

  return <Image alt={alt} onError={() => setFallo(true)} {...rest} />;
}
