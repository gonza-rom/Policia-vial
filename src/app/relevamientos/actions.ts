"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import {
  getAgenteActual,
  getJefeActual,
  puedeEditarRegistroPropio,
} from "@/lib/auth";
import { getPuestoSeleccionado } from "@/lib/puesto";

function leerCampos(formData: FormData) {
  const texto = (campo: string) => String(formData.get(campo) ?? "").trim();
  const modalidad =
    texto("modalidad") === "DIA_VIRGEN"
      ? ("DIA_VIRGEN" as const)
      : ("FINES_LARGOS" as const);

  const cantidadRaw = Number(texto("cantidadPersonas"));
  const cantidadPersonas =
    Number.isFinite(cantidadRaw) && cantidadRaw > 0 ? Math.round(cantidadRaw) : 1;

  const medioTransporte =
    modalidad === "DIA_VIRGEN"
      ? ((texto("medioTransporte") || null) as
          | "VEHICULO"
          | "CAMINATA"
          | "BICICLETA"
          | "CABALLO"
          | "COLECTIVO"
          | "CAMION"
          | null)
      : null;
  const sexo =
    modalidad === "DIA_VIRGEN"
      ? ((texto("sexo") || null) as "FEMENINO" | "MASCULINO" | "NO_BINARIO" | null)
      : null;

  return {
    modalidad,
    cantidadPersonas,
    procedencia: texto("procedencia") || null,
    medioTransporte,
    sexo,
  };
}

export async function crearRelevamiento(formData: FormData) {
  const agente = await getAgenteActual();
  const puesto = await getPuestoSeleccionado();
  if (!puesto) redirect("/puesto");

  const campos = leerCampos(formData);

  await prisma.relevamiento.create({
    data: { ...campos, puestoId: puesto.id, agenteId: agente.id },
  });

  console.info(
    `[auditoria-relevamientos] alta (${campos.modalidad}, ${campos.cantidadPersonas} personas) por agente=${agente.legajo}`,
  );

  revalidatePath("/relevamientos");
  redirect(`/relevamientos?modalidad=${campos.modalidad}`);
}

export async function actualizarRelevamiento(formData: FormData) {
  const agente = await getAgenteActual();
  const id = String(formData.get("id") ?? "");
  const actual = await prisma.relevamiento.findUnique({ where: { id } });
  if (!actual || !puedeEditarRegistroPropio(agente, actual)) {
    redirect("/relevamientos");
  }

  const campos = leerCampos(formData);
  await prisma.relevamiento.update({ where: { id }, data: campos });

  console.info(
    `[auditoria-relevamientos] editado id=${id} por agente=${agente.legajo}`,
  );

  revalidatePath("/relevamientos");
  redirect(`/relevamientos?modalidad=${campos.modalidad}`);
}

export async function eliminarRelevamiento(formData: FormData) {
  const jefe = await getJefeActual();
  const id = String(formData.get("id") ?? "");
  const actual = await prisma.relevamiento.findUnique({ where: { id } });
  if (!actual) redirect("/relevamientos");

  await prisma.relevamiento.delete({ where: { id } });

  console.info(
    `[auditoria-relevamientos] eliminado id=${id} (${actual.modalidad}) por jefe=${jefe.legajo}`,
  );

  revalidatePath("/relevamientos");
  redirect(`/relevamientos?modalidad=${actual.modalidad}`);
}
