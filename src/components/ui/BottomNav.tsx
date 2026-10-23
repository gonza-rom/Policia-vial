"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";

const ITEMS = [
  { href: "/guardia", icono: "home", label: "Inicio" },
  { href: "/actas/nueva", icono: "note_add", label: "Nueva Acta" },
  { href: "/actas", icono: "task_alt", label: "Actas" },
  { href: "/guardia/historial", icono: "history", label: "Historial" },
  { href: "/estadisticas", icono: "bar_chart", label: "Estadísticas" },
] as const;

const ITEM_AGENTES = { href: "/agentes", icono: "groups", label: "Agentes" } as const;

// "/guardia" y "/actas" tienen subrutas propias en el menú: solo se marcan
// activas con la ruta exacta.
const RUTAS_EXACTAS: string[] = ["/guardia", "/actas"];

/** `verAgentes`: muestra el acceso a /agentes (solo JEFE o ADMIN). */
export function BottomNav({ verAgentes = false }: { verAgentes?: boolean }) {
  const pathname = usePathname();
  const items = verAgentes ? [...ITEMS, ITEM_AGENTES] : ITEMS;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-surface-container-lowest border-t border-outline-variant flex justify-around items-stretch h-16 shadow-[0_-1px_3px_rgba(13,34,64,0.08)]">
      {items.map((item) => {
        const activo = RUTAS_EXACTAS.includes(item.href)
          ? pathname === item.href
          : pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={clsx(
              "flex-1 min-w-0 flex flex-col items-center justify-center gap-0.5 min-h-touch-min transition-colors",
              activo
                ? "text-primary bg-surface-container"
                : "text-on-surface-variant",
            )}
          >
            <span className="material-symbols-outlined text-[22px]" aria-hidden>
              {item.icono}
            </span>
            <span
              className={clsx(
                "font-label-sm max-w-full truncate px-0.5",
                verAgentes ? "text-[10px] sm:text-label-sm" : "text-label-sm",
              )}
            >
              {item.label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
