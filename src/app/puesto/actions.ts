"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getAgenteActual } from "@/lib/auth";
import { COOKIE_PUESTO } from "@/lib/puesto";

export async function elegirPuesto(formData: FormData) {
  await getAgenteActual();

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

  redirect("/guardia");
}
