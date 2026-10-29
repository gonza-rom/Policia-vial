import { prisma } from "@/lib/prisma";

/** Al editar: borra las fotos que el agente sacó y agrega las nuevas,
 * siguiendo el orden después de las que quedaron (nunca se reemplaza todo
 * el grupo — las fotos existentes que no se tocaron, se conservan).
 * Sin "use server": la comparten `actions.ts` (edición online) y
 * `offline-actions.ts` (edición sincronizada), y una función compartida
 * desde un archivo de Server Actions se exportaría como acción. */
export async function aplicarCambiosDeFotos(
  tx: Pick<typeof prisma, "fotoActa">,
  actaId: string,
  idsABorrar: string[],
  fotosVehiculo: string[],
  fotosDocumento: string[],
) {
  if (idsABorrar.length > 0) {
    await tx.fotoActa.deleteMany({ where: { id: { in: idsABorrar }, actaId } });
  }
  if (fotosVehiculo.length === 0 && fotosDocumento.length === 0) return;

  const restantes = await tx.fotoActa.findMany({
    where: { actaId },
    select: { categoria: true, orden: true },
  });
  const maxOrden = (categoria: "VEHICULO" | "DOCUMENTO") =>
    restantes
      .filter((f) => f.categoria === categoria)
      .reduce((max, f) => Math.max(max, f.orden), -1);

  await tx.fotoActa.createMany({
    data: [
      ...fotosVehiculo.map((url, i) => ({
        actaId,
        categoria: "VEHICULO" as const,
        url,
        orden: maxOrden("VEHICULO") + 1 + i,
      })),
      ...fotosDocumento.map((url, i) => ({
        actaId,
        categoria: "DOCUMENTO" as const,
        url,
        orden: maxOrden("DOCUMENTO") + 1 + i,
      })),
    ],
  });
}
