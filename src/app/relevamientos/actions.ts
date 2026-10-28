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
import { MODALIDADES_RELEVAMIENTO } from "@/lib/relevamientos";

function leerCampos(formData: FormData) {
  const texto = (campo: string) => String(formData.get(campo) ?? "").trim();
  const modalidadTexto = texto("modalidad");
  const modalidad = (
    MODALIDADES_RELEVAMIENTO.includes(
      modalidadTexto as (typeof MODALIDADES_RELEVAMIENTO)[number],
    )
      ? modalidadTexto
      : "FINES_LARGOS"
  ) as (typeof MODALIDADES_RELEVAMIENTO)[number];

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

/** Carga rápida de Día de la Virgen: un solo envío con las 3 cantidades
 * (Masculino/Femenino/Otros) crea hasta 3 registros atrás — uno por
 * categoría con cantidad > 0 — para no cambiar cómo se arman después las
 * estadísticas (siguen siendo "un registro = un sexo"). */
export async function crearRelevamientoDiaVirgen(formData: FormData) {
  const agente = await getAgenteActual();
  const puesto = await getPuestoSeleccionado();
  if (!puesto) redirect("/puesto");

  const texto = (campo: string) => String(formData.get(campo) ?? "").trim();
  const cantidad = (campo: string) => {
    const n = Number(texto(campo));
    return Number.isFinite(n) && n > 0 ? Math.round(n) : 0;
  };

  const medioTransporte = texto("medioTransporte") || "VEHICULO";
  const procedencia = texto("procedencia") || null;

  const conteos = [
    { sexo: "MASCULINO" as const, cantidadPersonas: cantidad("masculino") },
    { sexo: "FEMENINO" as const, cantidadPersonas: cantidad("femenino") },
    { sexo: "NO_BINARIO" as const, cantidadPersonas: cantidad("otros") },
  ].filter((c) => c.cantidadPersonas > 0);

  if (conteos.length === 0) {
    // El formulario ya valida esto del lado del cliente; si de todos modos
    // llega vacío (JS deshabilitado, etc.) no se crea nada en silencio.
    redirect("/relevamientos?modalidad=DIA_VIRGEN");
  }

  await prisma.relevamiento.createMany({
    data: conteos.map((c) => ({
      modalidad: "DIA_VIRGEN" as const,
      cantidadPersonas: c.cantidadPersonas,
      procedencia,
      medioTransporte: medioTransporte as
        | "VEHICULO"
        | "CAMINATA"
        | "BICICLETA"
        | "CABALLO"
        | "COLECTIVO"
        | "CAMION",
      sexo: c.sexo,
      puestoId: puesto.id,
      agenteId: agente.id,
    })),
  });

  console.info(
    `[auditoria-relevamientos] alta rápida Día de la Virgen (${conteos.length} registro(s)) por agente=${agente.legajo}`,
  );

  revalidatePath("/relevamientos");
  redirect("/relevamientos?modalidad=DIA_VIRGEN");
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
