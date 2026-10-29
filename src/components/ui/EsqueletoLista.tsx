/** Placeholder que se ve mientras carga una pantalla de listado/detalle —
 * Next.js lo muestra al instante en la transición (`loading.tsx` de cada
 * ruta), así la navegación se siente inmediata en vez de quedar en
 * blanco hasta que termine la consulta a la base. */
export function EsqueletoLista({ filas = 4 }: { filas?: number }) {
  return (
    <div className="space-y-3" aria-hidden>
      {Array.from({ length: filas }).map((_, i) => (
        <div
          key={i}
          className="h-20 rounded-xl bg-surface-container-low border border-outline-variant animate-pulse"
        />
      ))}
    </div>
  );
}
