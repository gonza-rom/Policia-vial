import Link from "next/link";
import { type ReactNode } from "react";
import clsx from "clsx";

/** Chip de filtro tipo pestaña (p. ej. "Todos / Personas / Vehículos"),
 * antes repetido a mano con la misma clase en requerimientos y
 * relevamientos — ahora en un solo lugar, ya con el mínimo táctil de
 * 48px que pide DESIGN.md (antes quedaba en ~32px). */
export function FiltroPill({
  href,
  activo,
  children,
}: {
  href: string;
  activo: boolean;
  children: ReactNode;
}) {
  return (
    <Link
      href={href}
      className={clsx(
        "min-h-touch-min flex items-center px-3 rounded text-label-sm font-label-sm border",
        activo
          ? "bg-primary-container text-on-primary border-primary"
          : "border-outline-variant text-on-surface-variant",
      )}
    >
      {children}
    </Link>
  );
}
