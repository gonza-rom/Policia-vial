"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import {
  buscarUsuarioAuthPorEmail,
  createAdminClient,
} from "@/lib/supabase/admin";
import {
  getAgenteACargo,
  getJefeActual,
  legajoToEmail,
  type AgenteActual,
} from "@/lib/auth";

export type EstadoForm = { error?: string; ok?: string };

const contrasenaSchema = z
  .string()
  .min(8, "La contraseña debe tener al menos 8 caracteres.")
  .max(72, "La contraseña es demasiado larga.");

const datosAgenteSchema = z.object({
  nombreApellido: z
    .string()
    .trim()
    .min(3, "Ingresá apellido y nombre del agente.")
    .max(120),
  grado: z.string().trim().max(60),
});

const nuevoAgenteSchema = datosAgenteSchema.extend({
  legajo: z
    .string()
    .trim()
    .toUpperCase()
    .min(2, "Ingresá el legajo.")
    .max(30)
    .regex(/^[A-Z0-9.\-]+$/, "El legajo solo puede tener letras, números, puntos y guiones."),
  contrasena: contrasenaSchema,
});

function primerError(error: z.ZodError) {
  return error.issues[0]?.message ?? "Datos inválidos.";
}

function cerrarGuardiasActivas(agenteId: string, jefe: AgenteActual, motivo: string) {
  const ahora = new Date();
  return prisma.guardia.updateMany({
    where: { agenteId, estado: "ACTIVA" },
    data: {
      estado: "CERRADA",
      turnoFin: ahora,
      horaCierre: ahora,
      notasCierre: `${motivo} por ${jefe.nombreApellido} (Leg. ${jefe.legajo}).`,
    },
  });
}

export async function crearAgente(
  _prev: EstadoForm,
  formData: FormData,
): Promise<EstadoForm> {
  const jefe = await getJefeActual();

  const parsed = nuevoAgenteSchema.safeParse({
    legajo: formData.get("legajo") ?? "",
    nombreApellido: formData.get("nombreApellido") ?? "",
    grado: formData.get("grado") ?? "",
    contrasena: formData.get("contrasena") ?? "",
  });
  if (!parsed.success) return { error: primerError(parsed.error) };
  const { legajo, nombreApellido, grado, contrasena } = parsed.data;

  const authEmail = legajoToEmail(legajo);
  const existente = await prisma.agente.findFirst({
    where: { OR: [{ legajo }, { authEmail }] },
  });
  if (existente) {
    return { error: `Ya existe un agente con el legajo ${existente.legajo}.` };
  }

  const admin = createAdminClient();
  const { data: creado, error: errorAuth } = await admin.auth.admin.createUser({
    email: authEmail,
    password: contrasena,
    email_confirm: true,
  });
  if (errorAuth || !creado.user) {
    console.error("[agentes] No se pudo crear el usuario de Auth:", errorAuth);
    return { error: "No se pudo crear el usuario de acceso. Probá de nuevo." };
  }

  let agenteId: string;
  try {
    const agente = await prisma.agente.create({
      data: {
        legajo,
        authEmail,
        nombreApellido,
        grado: grado || null,
        rol: "AGENTE",
        jefeId: jefe.id,
      },
    });
    agenteId = agente.id;
  } catch (err) {
    // Sin el registro en la base el usuario de Auth queda huérfano: se borra.
    console.error("[agentes] No se pudo guardar el agente:", err);
    await admin.auth.admin.deleteUser(creado.user.id);
    return { error: "No se pudo guardar el agente en la base de datos." };
  }

  console.info(
    `[auditoria-agentes] alta legajo=${legajo} por jefe=${jefe.legajo}`,
  );
  revalidatePath("/agentes");
  redirect(`/agentes/${agenteId}`);
}

export async function actualizarAgente(
  _prev: EstadoForm,
  formData: FormData,
): Promise<EstadoForm> {
  const jefe = await getJefeActual();
  const agente = await getAgenteACargo(jefe, String(formData.get("agenteId") ?? ""));
  if (!agente) return { error: "No tenés a cargo a este agente." };

  const parsed = datosAgenteSchema.safeParse({
    nombreApellido: formData.get("nombreApellido") ?? "",
    grado: formData.get("grado") ?? "",
  });
  if (!parsed.success) return { error: primerError(parsed.error) };

  await prisma.agente.update({
    where: { id: agente.id },
    data: {
      nombreApellido: parsed.data.nombreApellido,
      grado: parsed.data.grado || null,
    },
  });

  revalidatePath("/agentes");
  revalidatePath(`/agentes/${agente.id}`);
  return { ok: "Datos actualizados." };
}

export async function restablecerContrasena(
  _prev: EstadoForm,
  formData: FormData,
): Promise<EstadoForm> {
  const jefe = await getJefeActual();
  const agente = await getAgenteACargo(jefe, String(formData.get("agenteId") ?? ""));
  if (!agente) return { error: "No tenés a cargo a este agente." };

  const parsed = contrasenaSchema.safeParse(formData.get("contrasena") ?? "");
  if (!parsed.success) return { error: primerError(parsed.error) };

  try {
    const usuario = await buscarUsuarioAuthPorEmail(agente.authEmail);
    if (!usuario) return { error: "El agente no tiene usuario de acceso." };

    const { error } = await createAdminClient().auth.admin.updateUserById(
      usuario.id,
      { password: parsed.data },
    );
    if (error) throw error;
  } catch (err) {
    console.error("[agentes] No se pudo cambiar la contraseña:", err);
    return { error: "No se pudo cambiar la contraseña. Probá de nuevo." };
  }

  console.info(
    `[auditoria-agentes] cambio de contraseña legajo=${agente.legajo} por jefe=${jefe.legajo}`,
  );
  return { ok: "Contraseña restablecida. Pasásela al agente en persona." };
}

export async function cambiarEstadoAgente(formData: FormData) {
  const jefe = await getJefeActual();
  const agente = await getAgenteACargo(jefe, String(formData.get("agenteId") ?? ""));
  if (!agente) redirect("/agentes");

  const activo = !agente.activo;
  await prisma.$transaction([
    prisma.agente.update({ where: { id: agente.id }, data: { activo } }),
    ...(activo
      ? []
      : [cerrarGuardiasActivas(agente.id, jefe, "Guardia cerrada al dar de baja al agente")]),
  ]);

  console.info(
    `[auditoria-agentes] ${activo ? "alta" : "baja"} legajo=${agente.legajo} por jefe=${jefe.legajo}`,
  );
  revalidatePath("/agentes");
  revalidatePath(`/agentes/${agente.id}`);
}

export async function cerrarGuardiaDeAgente(formData: FormData) {
  const jefe = await getJefeActual();
  const agente = await getAgenteACargo(jefe, String(formData.get("agenteId") ?? ""));
  if (!agente) redirect("/agentes");

  await cerrarGuardiasActivas(agente.id, jefe, "Guardia cerrada");

  revalidatePath("/agentes");
  revalidatePath(`/agentes/${agente.id}`);
}
