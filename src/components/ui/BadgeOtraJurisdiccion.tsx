import clsx from "clsx";

/** Badge compacto para que un jefe detecte de un vistazo, en cualquier
 * listado, qué actas/procedimientos se hicieron bajo la modalidad "Otra
 * Jurisdicción" (autodeclarada, sin autorización previa) y pueda revisarlos
 * después. El detalle completo (puesto, motivo) ya se muestra en
 * AvisoOtraJurisdiccion dentro de cada registro. */
export function BadgeOtraJurisdiccion({ className }: { className?: string }) {
  return (
    <span
      className={clsx(
        "flex items-center gap-1 text-label-sm font-label-sm px-2 py-0.5 rounded font-bold uppercase bg-secondary-container/40 text-on-secondary-container shrink-0",
        className,
      )}
    >
      <span className="material-symbols-outlined text-[14px]" aria-hidden>
        travel_explore
      </span>
      Otra Jurisdicción
    </span>
  );
}
