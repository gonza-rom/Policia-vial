import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";

/** Mapeo determinístico legajo -> email interno usado por Supabase Auth. */
export function legajoToEmail(legajo: string) {
  const normalizado = legajo
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]/g, "");
  return `${normalizado}@huillapima.local`;
}

export async function getAgenteActual() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email) {
    redirect("/login");
  }

  const agente = await prisma.agente.findUnique({
    where: { authEmail: user.email },
  });

  if (!agente || !agente.activo) {
    redirect("/login");
  }

  return agente;
}

export async function getGuardiaActiva(agenteId: string) {
  return prisma.guardia.findFirst({
    where: { agenteId, estado: "ACTIVA" },
    include: { puesto: true },
    orderBy: { turnoInicio: "desc" },
  });
}
