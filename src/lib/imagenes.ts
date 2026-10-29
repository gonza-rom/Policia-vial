/** Achica una foto de cámara (que puede pesar varios MB) a un tamaño
 * razonable para subir, antes de mandarla a Cloudinary — importa sobre
 * todo en modo offline/con poca señal, y ahora que una acta puede llevar
 * varias fotos por categoría en vez de una sola. Si algo falla (formato
 * raro, navegador viejo sin `createImageBitmap`), se sube el archivo
 * original tal cual: nunca bloquea la carga por esto. */
export async function comprimirImagen(
  archivo: File,
  maxDimension = 1600,
  calidad = 0.82,
): Promise<File> {
  if (!archivo.type.startsWith("image/") || archivo.type === "image/svg+xml") {
    return archivo;
  }

  try {
    const bitmap = await createImageBitmap(archivo);
    const escala = Math.min(1, maxDimension / Math.max(bitmap.width, bitmap.height));
    if (escala >= 1) {
      bitmap.close();
      return archivo; // ya es lo bastante chica
    }

    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bitmap.width * escala);
    canvas.height = Math.round(bitmap.height * escala);
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      bitmap.close();
      return archivo;
    }
    ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close();

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/jpeg", calidad),
    );
    if (!blob) return archivo;

    const nombre = archivo.name.replace(/\.\w+$/, "") + ".jpg";
    return new File([blob], nombre, { type: "image/jpeg" });
  } catch {
    return archivo;
  }
}
