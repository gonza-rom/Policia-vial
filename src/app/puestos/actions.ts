"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getJefeActual } from "@/lib/auth";

const JURISDICCIONES_VALIDAS = ["CAPITAL", "HUILLAPIMA", "LA_PUERTA"] as const;

/** Registro centralizado de puestos (ver DESIGN / pedido de ampliación de
 * oct-2026): solo jefe/admin puede editar código, ubicación, coordenadas,
 * jurisdicciones municipales habituales y estado operativo. Las
 * coordenadas nunca se inventan — si no se completan, el puesto queda
 * "pendiente de geolocalización" en el listado (ver puestos/page.tsx). */
export async function actualizarPuesto(formData: FormData) {
  await getJefeActual();

  const id = String(formData.get("id") ?? "");
  const texto = (campo: string) => String(formData.get(campo) ?? "").trim();
  const numero = (campo: string) => {
    const v = texto(campo);
    if (!v) return null;
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
  };

  const jurisdiccionesMunicipales = formData
    .getAll("jurisdiccionesMunicipales")
    .map(String)
    .filter((j): j is (typeof JURISDICCIONES_VALIDAS)[number] =>
      (JURISDICCIONES_VALIDAS as readonly string[]).includes(j),
    );

  await prisma.puesto.update({
    where: { id },
    data: {
      codigo: texto("codigo") || null,
      ubicacion: texto("ubicacion") || null,
      kmRuta: texto("kmRuta") || null,
      latitud: numero("latitud"),
      longitud: numero("longitud"),
      activo: formData.get("activo") === "on",
      jurisdiccionesMunicipales,
    },
  });

  console.info(`[auditoria-puestos] editado puesto id=${id}`);

  revalidatePath("/puestos");
  revalidatePath("/puestos/mapa");
  redirect("/puestos");
}
