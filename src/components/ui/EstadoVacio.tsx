import { type ReactNode } from "react";
import clsx from "clsx";

/** "Todavía no hay nada acá" — antes con 3 tratamientos visuales distintos
 * según la pantalla (centrado grande, línea compacta, con/sin padding).
 * Un solo lugar para el mensaje de "lista vacía". */
export function EstadoVacio({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <p
      className={clsx(
        "text-body-sm text-on-surface-variant text-center py-6",
        className,
      )}
    >
      {children}
    </p>
  );
}
