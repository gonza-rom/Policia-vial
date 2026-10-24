"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getAgenteActual, getGuardiaActiva } from "@/lib/auth";
import { COOKIE_PUESTO } from "@/lib/puesto";

export async function elegirPuesto(formData: FormData) {
  const agente = await getAgenteActual();

  const puestoId = String(formData.get("puestoId") ?? "");
  const puesto = await prisma.puesto.findUnique({ where: { id: puestoId } });
  if (!puesto || !puesto.activo) return;

  const cookieStore = await cookies();
  cookieStore.set(COOKIE_PUESTO, puesto.id, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30, // 30 días
  });

  // Si ya hay un turno abierto, "cambiar puesto" reasigna ESE turno (te
  // movieron de puesto a mitad de guardia) — si no, solo queda guardado
  // como contexto para cuando inicies el próximo.
  const guardiaActiva = await getGuardiaActiva(agente.id);
  if (guardiaActiva && guardiaActiva.puestoId !== puesto.id) {
    await prisma.guardia.update({
      where: { id: guardiaActiva.id },
      data: { puestoId: puesto.id },
    });
    console.info(
      `[auditoria-guardia] agente=${agente.legajo} reasignado de puesto=${guardiaActiva.puestoId} a puesto=${puesto.id} (guardia=${guardiaActiva.id})`,
    );
  }

  redirect("/guardia");
}
