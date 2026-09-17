"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getAgenteActual, getGuardiaActiva } from "@/lib/auth";
import { subirImagen } from "@/lib/cloudinary";

async function subirSiHayArchivo(
  file: FormDataEntryValue | null,
  folder: "actas/fotos",
) {
  if (!(file instanceof File) || file.size === 0) return null;
  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    const dataUrl = `data:${file.type};base64,${buffer.toString("base64")}`;
    return await subirImagen(dataUrl, folder);
  } catch (err) {
    console.warn("No se pudo subir la imagen a Cloudinary:", err);
    return null;
  }
}

export async function crearActa(formData: FormData) {
  const agente = await getAgenteActual();
  const guardia = await getGuardiaActiva(agente.id);
  if (!guardia) redirect("/guardia");

  const texto = (campo: string) => String(formData.get(campo) ?? "").trim();
  const numero = (campo: string) => {
    const v = formData.get(campo);
    return v ? Number(v) : null;
  };

  const infraccionIds = formData.getAll("infracciones").map(String);
  const detalleOtra = texto("detalleOtraInfraccion");
  const alcoholemiaGraduacion = numero("alcoholemiaGraduacion");

  const montoBase = numero("montoBase") ?? 0;
  const porcentajeDescuento = 40;
  const montoConDescuento = Math.round(montoBase * (1 - porcentajeDescuento / 100));

  const [fotoVehiculoUrl, fotoDocumentoUrl] = await Promise.all([
    subirSiHayArchivo(formData.get("fotoVehiculo"), "actas/fotos"),
    subirSiHayArchivo(formData.get("fotoDocumento"), "actas/fotos"),
  ]);

  const acta = await prisma.acta.create({
    data: {
      guardiaId: guardia.id,
      agenteId: agente.id,
      puestoId: guardia.puestoId,
      lugarControl: texto("lugarControl") || null,

      conductorNombre: texto("conductorNombre"),
      conductorDni: texto("conductorDni"),
      conductorEdad: numero("conductorEdad"),
      conductorDomicilio: texto("conductorDomicilio") || null,
      conductorLicenciaNro: texto("conductorLicenciaNro") || null,
      conductorLicenciaClase: texto("conductorLicenciaClase") || null,
      conductorExpedidoPor: texto("conductorExpedidoPor") || null,

      vehiculoDominio: texto("vehiculoDominio").toUpperCase(),
      vehiculoMarcaModelo: texto("vehiculoMarcaModelo") || null,
      vehiculoTipo: texto("vehiculoTipo") as "AUTO" | "MOTO" | "PICKUP" | "CARGA",
      vehiculoRemitidoA: texto("vehiculoRemitidoA") || null,

      otrosDatosAmpliatorios: texto("otrosDatosAmpliatorios") || null,

      montoBase,
      porcentajeDescuento,
      montoConDescuento,

      fotoVehiculoUrl,
      fotoDocumentoUrl,

      retencionPreventiva: formData.get("retencionPreventiva") === "on",
      tipoRetencion:
        (texto("tipoRetencion") as
          | "NINGUNA"
          | "LICENCIA"
          | "VEHICULO"
          | "LICENCIA_Y_VEHICULO") || "NINGUNA",

      alcoholemiaGraduacion,

      infracciones: {
        create: infraccionIds.map((infraccionId) => ({
          infraccionId,
          detalleOperativo:
            infraccionId === formData.get("otraInfraccionId")
              ? detalleOtra || null
              : null,
        })),
      },
    },
  });

  redirect(`/actas/${acta.id}/firma`);
}
