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

const TIPOS_VALIDOS = [
  "ORDEN_JUDICIAL",
  "SECUESTRO",
  "DEMORA",
  "ARRESTO",
  "DETENCION",
  "UBICACION_PARADERO",
  "ESTUPEFACIENTES",
] as const;

function leerCampos(formData: FormData) {
  const texto = (campo: string) => String(formData.get(campo) ?? "").trim();
  const tipoTexto = texto("tipo");
  const tipo = (TIPOS_VALIDOS as readonly string[]).includes(tipoTexto)
    ? (tipoTexto as (typeof TIPOS_VALIDOS)[number])
    : "DEMORA";

  // Misma mecánica que en actas (ver actas/nueva/actions.ts): sin
  // autorización previa, pero con motivo obligatorio para trazabilidad.
  const modalidadTrabajo =
    texto("modalidadTrabajo") === "OTRA_JURISDICCION"
      ? ("OTRA_JURISDICCION" as const)
      : ("HABITUAL" as const);
  const puestoTrabajoId =
    modalidadTrabajo === "OTRA_JURISDICCION" ? texto("puestoTrabajoId") || null : null;
  const motivoOtraJurisdiccion =
    modalidadTrabajo === "OTRA_JURISDICCION"
      ? texto("motivoOtraJurisdiccion") || null
      : null;

  return {
    tipo,
    modalidadTrabajo,
    puestoTrabajoId,
    motivoOtraJurisdiccion,
    personaNombre: texto("personaNombre") || null,
    personaDni: texto("personaDni") || null,
    vehiculoDominio: texto("vehiculoDominio").toUpperCase() || null,
    descripcion: texto("descripcion"),
    datosOrden: texto("datosOrden") || null,
    observaciones: texto("observaciones") || null,
  };
}

export async function crearProcedimiento(formData: FormData) {
  const agente = await getAgenteActual();
  const puesto = await getPuestoSeleccionado();
  if (!puesto) redirect("/puesto");

  const campos = leerCampos(formData);
  if (!campos.descripcion) return;
  if (campos.modalidadTrabajo === "OTRA_JURISDICCION" && !campos.motivoOtraJurisdiccion) {
    redirect("/procedimientos/nuevo?error=motivo");
  }

  const procedimiento = await prisma.procedimiento.create({
    data: {
      ...campos,
      puestoId: puesto.id,
      agenteId: agente.id,
    },
  });

  console.info(
    `[auditoria-procedimientos] alta N°${procedimiento.numero} (${procedimiento.tipo}) por agente=${agente.legajo}`,
  );

  revalidatePath("/procedimientos");
  redirect(`/procedimientos/${procedimiento.id}`);
}

export async function actualizarProcedimiento(formData: FormData) {
  const agente = await getAgenteActual();
  const id = String(formData.get("id") ?? "");
  const actual = await prisma.procedimiento.findUnique({ where: { id } });
  if (!actual || !puedeEditarRegistroPropio(agente, actual)) {
    redirect("/procedimientos");
  }

  // La modalidad/jurisdicción ya quedó fijada al crear — no se vuelve a
  // pedir al editar (mismo criterio que las actas).
  const texto = (campo: string) => String(formData.get(campo) ?? "").trim();
  const tipoTexto = texto("tipo");
  const tipo = (TIPOS_VALIDOS as readonly string[]).includes(tipoTexto)
    ? (tipoTexto as (typeof TIPOS_VALIDOS)[number])
    : actual.tipo;

  const descripcion = texto("descripcion");
  if (!descripcion) return;

  await prisma.procedimiento.update({
    where: { id },
    data: {
      tipo,
      personaNombre: texto("personaNombre") || null,
      personaDni: texto("personaDni") || null,
      vehiculoDominio: texto("vehiculoDominio").toUpperCase() || null,
      descripcion,
      datosOrden: texto("datosOrden") || null,
      observaciones: texto("observaciones") || null,
    },
  });

  console.info(
    `[auditoria-procedimientos] editado N°${actual.numero} por agente=${agente.legajo}`,
  );

  revalidatePath("/procedimientos");
  redirect(`/procedimientos/${id}`);
}

export async function eliminarProcedimiento(formData: FormData) {
  const jefe = await getJefeActual();
  const id = String(formData.get("id") ?? "");
  const actual = await prisma.procedimiento.findUnique({ where: { id } });
  if (!actual) redirect("/procedimientos");

  await prisma.procedimiento.delete({ where: { id } });

  console.info(
    `[auditoria-procedimientos] eliminado N°${actual.numero} (${actual.tipo}) por jefe=${jefe.legajo}`,
  );

  revalidatePath("/procedimientos");
  redirect("/procedimientos");
}
