"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getAgenteActual, getJefeActual } from "@/lib/auth";
import { subirImagen } from "@/lib/cloudinary";

async function subirFirma(dataUrl: string | null) {
  if (!dataUrl) return null;
  try {
    return await subirImagen(dataUrl, "actas/firmas");
  } catch (err) {
    console.warn("No se pudo subir la firma a Cloudinary:", err);
    return null;
  }
}

export async function firmarActa(formData: FormData) {
  const agente = await getAgenteActual();
  const actaId = String(formData.get("actaId") ?? "");
  if (!actaId) return;

  const acta = await prisma.acta.findUnique({ where: { id: actaId } });
  if (!acta || acta.agenteId !== agente.id) {
    redirect("/actas");
  }

  const seNiega = formData.get("infractorSeNiegaAFirmar") === "on";
  const firmaInfractorData = String(formData.get("firmaInfractor") ?? "");
  const firmaActuanteData = String(formData.get("firmaActuante") ?? "");
  const firmaSecretarioData = String(formData.get("firmaSecretario") ?? "");

  const [firmaInfractorUrl, firmaActuanteUrl, firmaSecretarioUrl] =
    await Promise.all([
      seNiega ? Promise.resolve(null) : subirFirma(firmaInfractorData || null),
      subirFirma(firmaActuanteData || null),
      acta.tipo === "CONTRAVENCIONAL"
        ? subirFirma(firmaSecretarioData || null)
        : Promise.resolve(null),
    ]);

  await prisma.acta.update({
    where: { id: actaId },
    data: {
      infractorSeNiegaAFirmar: seNiega,
      firmaInfractorUrl,
      firmaActuanteUrl,
      ...(acta.tipo === "CONTRAVENCIONAL" ? { firmaSecretarioUrl } : {}),
      estado: "FIRMADA",
    },
  });

  redirect(`/actas/${actaId}/firma`);
}

export async function eliminarActa(formData: FormData) {
  const jefe = await getJefeActual();
  const actaId = String(formData.get("actaId") ?? "");
  if (!actaId) return;

  const acta = await prisma.acta.findUnique({ where: { id: actaId } });
  if (!acta) redirect("/actas");

  await prisma.acta.delete({ where: { id: actaId } });

  console.info(
    `[auditoria-actas] eliminada acta N°${acta.numero} (${acta.tipo}) por jefe=${jefe.legajo}`,
  );

  redirect("/actas");
}
