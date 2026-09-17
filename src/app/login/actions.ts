"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";

export type EstadoLogin = { error?: string };

export async function iniciarSesion(
  _prevState: EstadoLogin,
  formData: FormData,
): Promise<EstadoLogin> {
  const legajo = String(formData.get("legajo") ?? "").trim();
  const contrasena = String(formData.get("contrasena") ?? "");

  if (!legajo || !contrasena) {
    return { error: "Ingresá tu legajo y contraseña." };
  }

  const agente = await prisma.agente.findUnique({ where: { legajo } });

  if (!agente || !agente.activo) {
    return { error: "Legajo no encontrado o usuario inactivo." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: agente.authEmail,
    password: contrasena,
  });

  if (error) {
    return { error: "Legajo o contraseña incorrectos." };
  }

  redirect("/guardia");
}
