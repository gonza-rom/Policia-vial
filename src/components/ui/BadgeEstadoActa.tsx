import clsx from "clsx";
import { ESTADO_ACTA_LABEL } from "@/lib/formato";

/** Badge de estado de acta (pendiente de firma / firmada / etc.), antes
 * reimplementado a mano en el listado de actas y en la pantalla de firma. */
export function BadgeEstadoActa({
  estado,
  className,
}: {
  estado: string;
  className?: string;
}) {
  const pendiente = estado === "PENDIENTE_FIRMA";
  return (
    <span
      className={clsx(
        "text-label-sm font-label-sm px-2 py-0.5 rounded font-bold uppercase",
        pendiente
          ? "bg-error-container text-on-error-container"
          : "bg-secondary-container/40 text-on-secondary-container",
        className,
      )}
    >
      {ESTADO_ACTA_LABEL[estado]}
    </span>
  );
}
