import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

/**
 * Sube una imagen (foto de vehículo/documento o firma en base64) a Cloudinary
 * desde el servidor. Requiere completar NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
 * CLOUDINARY_API_KEY y CLOUDINARY_API_SECRET en .env — ver README.
 */
export async function subirImagen(
  dataUrl: string,
  folder: "actas/fotos" | "actas/firmas",
) {
  if (
    !process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME ||
    !process.env.CLOUDINARY_API_KEY ||
    !process.env.CLOUDINARY_API_SECRET
  ) {
    throw new Error(
      "Cloudinary no está configurado: completá las variables NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY y CLOUDINARY_API_SECRET en el archivo .env.",
    );
  }

  const result = await cloudinary.uploader.upload(dataUrl, {
    folder,
    resource_type: "image",
  });

  return result.secure_url;
}
