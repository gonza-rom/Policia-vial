"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";

const ITEMS = [
  { href: "/actas/nueva", icono: "note_add", label: "Nueva Acta" },
  { href: "/actas", icono: "task_alt", label: "Actas" },
  { href: "/guardia/historial", icono: "history", label: "Historial" },
  { href: "/estadisticas", icono: "bar_chart", label: "Estadísticas" },
] as const;

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-surface-container-lowest border-t border-outline-variant flex justify-around items-stretch h-16 shadow-[0_-1px_3px_rgba(13,34,64,0.08)]">
      {ITEMS.map((item) => {
        const activo =
          item.href === "/actas"
            ? pathname === "/actas"
            : pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={clsx(
              "flex-1 flex flex-col items-center justify-center gap-0.5 min-h-touch-min transition-colors",
              activo
                ? "text-primary bg-surface-container"
                : "text-on-surface-variant",
            )}
          >
            <span className="material-symbols-outlined text-[22px]" aria-hidden>
              {item.icono}
            </span>
            <span className="text-label-sm font-label-sm">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
