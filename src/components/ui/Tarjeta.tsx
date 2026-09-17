import { type ReactNode } from "react";
import clsx from "clsx";

type TarjetaSeccionProps = {
  icono: string;
  titulo: string;
  badge?: string;
  badgeTono?: "secundario" | "error" | "primario";
  children: ReactNode;
  className?: string;
};

const BADGE_TONOS: Record<NonNullable<TarjetaSeccionProps["badgeTono"]>, string> = {
  secundario: "bg-surface-container text-secondary",
  error: "bg-error-container text-on-error-container",
  primario: "bg-secondary-fixed text-primary",
};

export function TarjetaSeccion({
  icono,
  titulo,
  badge,
  badgeTono = "secundario",
  children,
  className,
}: TarjetaSeccionProps) {
  return (
    <section
      className={clsx(
        "bg-surface-container-lowest rounded-lg border border-outline-variant p-4 shadow-sm",
        className,
      )}
    >
      <div className="flex items-center justify-between pb-2 mb-3 border-b border-outline-variant">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-secondary" aria-hidden>
            {icono}
          </span>
          <h2 className="text-label-lg font-label-lg text-primary uppercase">
            {titulo}
          </h2>
        </div>
        {badge && (
          <span
            className={clsx(
              "text-label-sm font-label-sm px-2 py-0.5 rounded font-bold",
              BADGE_TONOS[badgeTono],
            )}
          >
            {badge}
          </span>
        )}
      </div>
      <div className="space-y-3">{children}</div>
    </section>
  );
}

export function Tarjeta({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={clsx(
        "bg-surface-container-lowest rounded-xl border border-outline-variant shadow-sm overflow-hidden",
        className,
      )}
    >
      {children}
    </div>
  );
}
