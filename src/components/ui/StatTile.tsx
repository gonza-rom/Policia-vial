import clsx from "clsx";

type Tono = "primario" | "secundario" | "error";

const BORDE_TONO: Record<Tono, string> = {
  primario: "border-primary",
  secundario: "border-secondary",
  error: "border-error",
};

const TEXTO_VALOR_TONO: Record<Tono, string> = {
  primario: "text-primary",
  secundario: "text-primary",
  error: "text-error",
};

const TEXTO_LABEL_TONO: Record<Tono, string> = {
  primario: "text-on-surface-variant",
  secundario: "text-on-surface-variant",
  error: "text-error",
};

/** Tarjeta de métrica — franja de color a la izquierda (`tono`), como pide
 * DESIGN.md para "Checkpoint Metric & Summary Cards". Único componente
 * para los números destacados de /guardia, /estadisticas, /agentes y
 * /agentes/[id], que antes reimplementaban esto cada uno a su manera. */
export function StatTile({
  label,
  valor,
  icono,
  tono = "primario",
  delta,
  className,
}: {
  label: string;
  valor: string;
  icono?: string;
  tono?: Tono;
  delta?: number | null;
  className?: string;
}) {
  return (
    <div
      className={clsx(
        "border-l-4 px-3 py-2 bg-surface-container-lowest rounded shadow-sm min-w-0",
        BORDE_TONO[tono],
        className,
      )}
    >
      <div className="flex items-center justify-between gap-1">
        <span
          className={clsx(
            "text-label-sm font-label-sm uppercase",
            TEXTO_LABEL_TONO[tono],
          )}
        >
          {label}
        </span>
        {icono && (
          <span
            className="material-symbols-outlined text-secondary text-[16px] shrink-0"
            aria-hidden
          >
            {icono}
          </span>
        )}
      </div>
      <p
        className={clsx(
          "text-headline-sm font-display font-bold break-words",
          TEXTO_VALOR_TONO[tono],
        )}
      >
        {valor}
      </p>
      {delta != null && (
        <p
          className={clsx(
            "text-body-sm font-semibold flex items-center gap-0.5",
            delta >= 0 ? "text-emerald-600" : "text-error",
          )}
        >
          <span className="material-symbols-outlined text-[14px]" aria-hidden>
            {delta >= 0 ? "trending_up" : "trending_down"}
          </span>
          {delta >= 0 ? "+" : ""}
          {delta.toFixed(1)}% vs mes anterior
        </p>
      )}
    </div>
  );
}
