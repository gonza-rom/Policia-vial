"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import {
  getAgenteActual,
  getJefeActual,
  puedeEditarRequerimiento,
} from "@/lib/auth";
import { getPuestoSeleccionado } from "@/lib/puesto";

function leerCampos(formData: FormData) {
  const texto = (campo: string) => String(formData.get(campo) ?? "").trim();
  return {
    tipo: texto("tipo") === "VEHICULO" ? ("VEHICULO" as const) : ("PERSONA" as const),
    descripcion: texto("descripcion"),
    datosOrden: texto("datosOrden") || null,
    motivo: texto("motivo") || null,
    observaciones: texto("observaciones") || null,
  };
}

export async function crearRequerimiento(formData: FormData) {
  const agente = await getAgenteActual();
  const puesto = await getPuestoSeleccionado();
  if (!puesto) redirect("/puesto");

  const campos = leerCampos(formData);
  if (!campos.descripcion) return;

  const requerimiento = await prisma.requerimiento.create({
    data: {
      ...campos,
      puestoId: puesto.id,
      agenteId: agente.id,
    },
  });

  console.info(
    `[auditoria-requerimientos] alta N°${requerimiento.numero} (${requerimiento.tipo}) por agente=${agente.legajo}`,
  );

  redirect(`/requerimientos/${requerimiento.id}`);
}

export async function actualizarRequerimiento(formData: FormData) {
  const agente = await getAgenteActual();
  const id = String(formData.get("id") ?? "");
  const actual = await prisma.requerimiento.findUnique({ where: { id } });
  if (!actual || !puedeEditarRequerimiento(agente, actual)) {
    redirect("/requerimientos");
  }

  const campos = leerCampos(formData);
  if (!campos.descripcion) return;

  await prisma.requerimiento.update({ where: { id }, data: campos });

  console.info(
    `[auditoria-requerimientos] editado N°${actual.numero} por agente=${agente.legajo}`,
  );

  revalidatePath("/requerimientos");
  redirect(`/requerimientos/${id}`);
}

export async function eliminarRequerimiento(formData: FormData) {
  const jefe = await getJefeActual();
  const id = String(formData.get("id") ?? "");
  const actual = await prisma.requerimiento.findUnique({ where: { id } });
  if (!actual) redirect("/requerimientos");

  await prisma.requerimiento.delete({ where: { id } });

  console.info(
    `[auditoria-requerimientos] eliminado N°${actual.numero} (${actual.tipo}) por jefe=${jefe.legajo}`,
  );

  revalidatePath("/requerimientos");
  redirect("/requerimientos");
}
