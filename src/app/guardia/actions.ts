"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { getAgenteActual, getGuardiaActiva } from "@/lib/auth";

export async function cerrarSesion() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

export async function iniciarGuardia(formData: FormData) {
  const agente = await getAgenteActual();
  const puestoId = String(formData.get("puestoId") ?? "");
  if (!puestoId) return;

  const activa = await getGuardiaActiva(agente.id);
  if (activa) {
    redirect("/guardia");
  }

  await prisma.guardia.create({
    data: { agenteId: agente.id, puestoId },
  });

  revalidatePath("/guardia");
  redirect("/guardia");
}

export async function cerrarGuardia(formData: FormData) {
  const agente = await getAgenteActual();
  const guardia = await getGuardiaActiva(agente.id);
  if (!guardia) redirect("/guardia");

  const notasCierre = String(formData.get("notasCierre") ?? "").trim();

  await prisma.guardia.update({
    where: { id: guardia.id },
    data: {
      estado: "CERRADA",
      turnoFin: new Date(),
      horaCierre: new Date(),
      notasCierre: notasCierre || null,
    },
  });

  revalidatePath("/guardia");
  redirect("/guardia");
}
