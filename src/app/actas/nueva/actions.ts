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
  // Numérico no-negativo: ante un valor inválido o negativo, se descarta
  // (null) en vez de guardar NaN o un número fuera de rango.
  const numero = (campo: string, max?: number) => {
    const v = formData.get(campo);
    if (!v) return null;
    const n = Number(v);
    if (!Number.isFinite(n) || n < 0) return null;
    if (max != null && n > max) return null;
    return n;
  };

  const infraccionIds = formData.getAll("infracciones").map(String);
  const detalleOtra = texto("detalleOtraInfraccion");
  const alcoholemiaGraduacion = numero("alcoholemiaGraduacion", 10);

  const catalogoSeleccionado = infraccionIds.length
    ? await prisma.infraccionCatalogo.findMany({
        where: { id: { in: infraccionIds } },
        select: { montoBase: true },
      })
    : [];
  const montoCatalogo = catalogoSeleccionado.reduce(
    (acc, i) => acc + Number(i.montoBase),
    0,
  );

  // El agente puede ajustar el monto a mano (discrecionalidad al labrar el
  // acta), pero si el valor no es válido se usa el del catálogo como
  // respaldo, y toda diferencia queda registrada para auditoría posterior.
  const montoBaseIngresado = numero("montoBase");
  const montoBase = montoBaseIngresado ?? montoCatalogo;
  if (montoBaseIngresado !== null && montoBaseIngresado !== montoCatalogo) {
    console.warn(
      `[auditoria-monto] agente=${agente.legajo} infracciones=[${infraccionIds.join(",")}] montoCatalogo=${montoCatalogo} montoIngresado=${montoBaseIngresado}`,
    );
  }

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
      conductorEdad: numero("conductorEdad", 120),
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
