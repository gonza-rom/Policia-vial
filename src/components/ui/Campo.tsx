import { type ComponentPropsWithoutRef } from "react";
import clsx from "clsx";

const inputBase =
  "w-full bg-surface-container-low border border-outline rounded text-body-md font-body-md text-on-surface px-3 py-2.5 min-h-touch-min focus:bg-surface-container-lowest transition-colors placeholder:text-on-surface-variant/60";

type CampoProps = {
  label: string;
  hint?: string;
  error?: string;
  monoespaciado?: boolean;
} & ComponentPropsWithoutRef<"input">;

export function Campo({
  label,
  hint,
  error,
  monoespaciado,
  className,
  id,
  ...rest
}: CampoProps) {
  return (
    <div>
      <label
        htmlFor={id}
        className="block text-label-sm font-label-sm text-on-surface-variant uppercase mb-1"
      >
        {label}
      </label>
      <input
        id={id}
        className={clsx(
          inputBase,
          monoespaciado && "font-display",
          error && "border-error",
          className,
        )}
        {...rest}
      />
      {hint && !error && (
        <p className="text-body-sm text-on-surface-variant mt-1">{hint}</p>
      )}
      {error && <p className="text-body-sm text-error mt-1">{error}</p>}
    </div>
  );
}

type AreaProps = {
  label: string;
  hint?: string;
} & ComponentPropsWithoutRef<"textarea">;

export function CampoTextarea({ label, hint, id, className, ...rest }: AreaProps) {
  return (
    <div>
      <label
        htmlFor={id}
        className="block text-label-sm font-label-sm text-on-surface-variant uppercase mb-1"
      >
        {label}
      </label>
      <textarea
        id={id}
        className={clsx(
          "w-full bg-surface-container-low border border-outline rounded text-body-md font-body-md text-on-surface p-3 focus:bg-surface-container-lowest transition-colors placeholder:text-on-surface-variant/60",
          className,
        )}
        {...rest}
      />
      {hint && <p className="text-body-sm text-on-surface-variant mt-1">{hint}</p>}
    </div>
  );
}

type SelectProps = {
  label: string;
} & ComponentPropsWithoutRef<"select">;

export function CampoSelect({ label, id, className, children, ...rest }: SelectProps) {
  return (
    <div>
      <label
        htmlFor={id}
        className="block text-label-sm font-label-sm text-on-surface-variant uppercase mb-1"
      >
        {label}
      </label>
      <select id={id} className={clsx(inputBase, className)} {...rest}>
        {children}
      </select>
    </div>
  );
}
