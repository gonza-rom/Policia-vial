import { type ComponentPropsWithoutRef, type ElementType } from "react";
import clsx from "clsx";

type Variante = "primario" | "secundario" | "destructivo" | "outline" | "fantasma";

const VARIANTES: Record<Variante, string> = {
  primario:
    "bg-primary-container hover:bg-primary text-on-primary shadow-md",
  secundario: "bg-secondary hover:bg-on-secondary-container text-on-secondary",
  destructivo: "bg-error hover:bg-on-error-container text-on-error",
  outline:
    "bg-surface-container-lowest border border-outline text-on-surface hover:bg-surface-container",
  fantasma: "bg-transparent text-secondary hover:bg-surface-container",
};

type Props<T extends ElementType> = {
  as?: T;
  variante?: Variante;
  icono?: string;
  fullWidth?: boolean;
  className?: string;
} & Omit<ComponentPropsWithoutRef<T>, "as" | "className">;

export function Boton<T extends ElementType = "button">({
  as,
  variante = "primario",
  icono,
  fullWidth = false,
  className,
  children,
  ...rest
}: Props<T>) {
  const Componente = as || "button";

  return (
    <Componente
      className={clsx(
        "min-h-touch-min inline-flex items-center justify-center gap-2 rounded font-label-lg text-label-lg font-bold uppercase tracking-wide transition-all active:scale-95",
        VARIANTES[variante],
        fullWidth && "w-full",
        className,
      )}
      {...rest}
    >
      {icono && (
        <span className="material-symbols-outlined text-[20px]" aria-hidden>
          {icono}
        </span>
      )}
      {children}
    </Componente>
  );
}
