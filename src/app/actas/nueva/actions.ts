"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getAgenteActual, getGuardiaActiva, puedeEditarActa } from "@/lib/auth";
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
      tipo: "MUNICIPAL",
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

export async function actualizarActa(formData: FormData) {
  const agente = await getAgenteActual();
  const actaId = String(formData.get("actaId") ?? "");
  const actaActual = await prisma.acta.findUnique({ where: { id: actaId } });
  if (!actaActual || !puedeEditarActa(agente, actaActual)) {
    redirect("/actas");
  }

  const texto = (campo: string) => String(formData.get(campo) ?? "").trim();
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

  const montoBaseIngresado = numero("montoBase");
  const montoBase = montoBaseIngresado ?? 0;
  const porcentajeDescuento = 40;
  const montoConDescuento = Math.round(montoBase * (1 - porcentajeDescuento / 100));

  const [fotoVehiculoUrl, fotoDocumentoUrl] = await Promise.all([
    subirSiHayArchivo(formData.get("fotoVehiculo"), "actas/fotos"),
    subirSiHayArchivo(formData.get("fotoDocumento"), "actas/fotos"),
  ]);

  await prisma.$transaction([
    prisma.actaInfraccion.deleteMany({ where: { actaId } }),
    prisma.acta.update({
      where: { id: actaId },
      data: {
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

        // Solo se pisa la foto si se adjuntó una nueva; si no, se conserva.
        ...(fotoVehiculoUrl ? { fotoVehiculoUrl } : {}),
        ...(fotoDocumentoUrl ? { fotoDocumentoUrl } : {}),

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
    }),
  ]);

  console.info(
    `[auditoria-actas] editada acta N°${actaActual.numero} por agente=${agente.legajo}`,
  );

  redirect(`/actas/${actaId}/firma`);
}

export async function crearActaContravencional(formData: FormData) {
  const agente = await getAgenteActual();
  const guardia = await getGuardiaActiva(agente.id);
  if (!guardia) redirect("/guardia");

  const campos = await prisma.campoContravencional.findMany({
    where: { activo: true },
  });

  // Los campos requeridos ya se exigen con `required` en el formulario; acá
  // solo se guarda lo que vino completo (sin forzar tipos, es texto libre).
  const datos: Record<string, string> = {};
  for (const campo of campos) {
    const valor = String(formData.get(campo.clave) ?? "").trim();
    if (valor) datos[campo.clave] = valor;
  }

  const [fotoVehiculoUrl, fotoDocumentoUrl] = await Promise.all([
    subirSiHayArchivo(formData.get("fotoVehiculo"), "actas/fotos"),
    subirSiHayArchivo(formData.get("fotoDocumento"), "actas/fotos"),
  ]);

  const acta = await prisma.acta.create({
    data: {
      tipo: "CONTRAVENCIONAL",
      guardiaId: guardia.id,
      agenteId: agente.id,
      puestoId: guardia.puestoId,
      lugarControl: String(formData.get("lugarControl") ?? "").trim() || null,
      datosContravencional: datos,
      fotoVehiculoUrl,
      fotoDocumentoUrl,
    },
  });

  redirect(`/actas/${acta.id}/firma`);
}

export async function actualizarActaContravencional(formData: FormData) {
  const agente = await getAgenteActual();
  const actaId = String(formData.get("actaId") ?? "");
  const actaActual = await prisma.acta.findUnique({ where: { id: actaId } });
  if (!actaActual || !puedeEditarActa(agente, actaActual)) {
    redirect("/actas");
  }

  const campos = await prisma.campoContravencional.findMany({
    where: { activo: true },
  });

  const datos: Record<string, string> = {};
  for (const campo of campos) {
    const valor = String(formData.get(campo.clave) ?? "").trim();
    if (valor) datos[campo.clave] = valor;
  }

  const [fotoVehiculoUrl, fotoDocumentoUrl] = await Promise.all([
    subirSiHayArchivo(formData.get("fotoVehiculo"), "actas/fotos"),
    subirSiHayArchivo(formData.get("fotoDocumento"), "actas/fotos"),
  ]);

  await prisma.acta.update({
    where: { id: actaId },
    data: {
      lugarControl: String(formData.get("lugarControl") ?? "").trim() || null,
      datosContravencional: datos,
      ...(fotoVehiculoUrl ? { fotoVehiculoUrl } : {}),
      ...(fotoDocumentoUrl ? { fotoDocumentoUrl } : {}),
    },
  });

  console.info(
    `[auditoria-actas] editada acta N°${actaActual.numero} por agente=${agente.legajo}`,
  );

  redirect(`/actas/${actaId}/firma`);
}
