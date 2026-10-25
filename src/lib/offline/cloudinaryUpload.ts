// Subida directa del navegador a Cloudinary (sin pasar por el servidor),
// necesaria para sincronizar fotos cargadas offline. Usa un "unsigned
// upload preset" — a diferencia de src/lib/cloudinary.ts (que sube firmado
// desde el servidor), acá no hay forma de firmar sin conexión al servidor,
// así que el preset tiene que estar configurado como "Unsigned" en
// Cloudinary (Settings → Upload → Add upload preset).
export async function subirFotoOffline(blob: Blob, folder: string): Promise<string> {
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const preset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

  if (!cloudName || !preset) {
    throw new Error(
      "Falta configurar NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME / NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET para subir fotos offline.",
    );
  }

  const formData = new FormData();
  formData.append("file", blob);
  formData.append("upload_preset", preset);
  formData.append("folder", folder);

  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
    { method: "POST", body: formData },
  );

  if (!res.ok) {
    const texto = await res.text().catch(() => "");
    throw new Error(`Cloudinary rechazó la subida (${res.status}): ${texto}`);
  }

  const data = await res.json();
  return data.secure_url as string;
}
