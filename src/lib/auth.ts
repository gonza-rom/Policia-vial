import { cache } from "react";
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

/** `cache()` (memoización por request de React): AppHeader necesita el
 * agente actual para el menú del avatar, pero cada página ya lo pide para
 * lo suyo — sin esto, cada carga de página haría el viaje a Supabase Auth +
 * la consulta de Prisma dos veces. */
export const getAgenteActual = cache(async function getAgenteActual() {
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
    // Hay sesión de Supabase pero el agente fue dado de baja: se cierra la
    // sesión en /salir (un Server Component no puede borrar cookies), si no
    // el proxy rebotaría /login -> /guardia en un bucle.
    redirect("/salir");
  }

  return agente;
});

export type AgenteActual = Awaited<ReturnType<typeof getAgenteActual>>;

export function esJefe(agente: Pick<AgenteActual, "rol">) {
  return agente.rol === "JEFE" || agente.rol === "ADMIN";
}

/** Para las pantallas de gestión de agentes: solo JEFE o ADMIN. */
export async function getJefeActual() {
  const agente = await getAgenteActual();
  if (!esJefe(agente)) redirect("/guardia");
  return agente;
}

/**
 * Busca un agente que el jefe puede gestionar: un JEFE solo a los suyos,
 * un ADMIN a cualquiera (menos a sí mismo).
 */
export async function getAgenteACargo(jefe: AgenteActual, agenteId: string) {
  const agente = await prisma.agente.findUnique({ where: { id: agenteId } });
  if (!agente || agente.id === jefe.id) return null;
  if (jefe.rol !== "ADMIN" && agente.jefeId !== jefe.id) return null;
  return agente;
}

/** Un acta solo se puede corregir mientras no tenga firma, y solo por su
 * agente dueño o por un jefe/admin — nunca se puede eliminar desde acá. */
export function puedeEditarActa(
  agente: Pick<AgenteActual, "id" | "rol">,
  acta: { agenteId: string; estado: string },
) {
  if (acta.estado !== "PENDIENTE_FIRMA") return false;
  return acta.agenteId === agente.id || esJefe(agente);
}

/** Regla compartida por requerimientos y relevamientos: los puede corregir
 * su agente dueño o un jefe/admin — no tienen estado de firma, así que no
 * hay ventana de tiempo como en el acta. */
export function puedeEditarRegistroPropio(
  agente: Pick<AgenteActual, "id" | "rol">,
  registro: { agenteId: string },
) {
  return registro.agenteId === agente.id || esJefe(agente);
}

/**
 * Regla de acceso a acta MUNICIPAL por jurisdicción (ver DESIGN / pedido
 * de ampliación de oct-2026): bajo modalidad HABITUAL, un puesto solo puede
 * labrar la(s) jurisdicción(es) municipal(es) que tiene asignadas
 * (`Puesto.jurisdiccionesMunicipales`). Bajo OTRA_JURISDICCION no hay
 * autorización previa: el agente puede elegir cualquier jurisdicción,
 * pero tiene que declarar un motivo (ver `motivoOtraJurisdiccion`) — la
 * trazabilidad es la que reemplaza al permiso. La contravencional no está
 * restringida por jurisdicción en ningún caso.
 */
export function puedeCrearActaMunicipalEnJurisdiccion(
  puestoOrigen: { jurisdiccionesMunicipales: string[] },
  modalidadTrabajo: string,
  jurisdiccion: string | null,
) {
  if (!jurisdiccion) return false;
  if (modalidadTrabajo === "OTRA_JURISDICCION") return true;
  return puestoOrigen.jurisdiccionesMunicipales.includes(jurisdiccion);
}

export const getGuardiaActiva = cache(async function getGuardiaActiva(
  agenteId: string,
) {
  return prisma.guardia.findFirst({
    where: { agenteId, estado: "ACTIVA" },
    include: { puesto: true },
    orderBy: { turnoInicio: "desc" },
  });
});
