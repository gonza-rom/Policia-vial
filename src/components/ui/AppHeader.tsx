import Image from "next/image";
import { getAgenteActual, getGuardiaActiva } from "@/lib/auth";
import { ROL_LABEL } from "@/lib/formato";
import { cerrarGuardia, cerrarSesion } from "@/app/guardia/actions";
import { EstadoConexion } from "./EstadoConexion";
import { MenuCuenta } from "./MenuCuenta";

/** Header fijo de toda la app. Antes recibía nombreApellido/legajo por
 * props desde cada página — ahora resuelve el agente (y si tiene guardia
 * activa, para el menú del avatar) por su cuenta. `getAgenteActual` y
 * `getGuardiaActiva` están memoizadas por request (`cache()` en auth.ts),
 * así que esto no duplica la consulta que la página ya hace para lo suyo. */
export async function AppHeader() {
  const agente = await getAgenteActual();
  const guardia = await getGuardiaActiva(agente.id);

  return (
    <header className="sticky top-0 z-40 bg-primary-container text-on-primary border-b border-primary shadow-sm w-full px-pad-lg h-touch-min flex justify-between items-center">
      <div className="flex items-center gap-pad-md min-w-0">
        <Image
          src="/escudo-policia-catamarca.png"
          alt="Escudo Dirección de Seguridad Vial - Policía de Catamarca"
          width={40}
          height={40}
          className="w-10 h-10 object-contain rounded border border-outline-variant/30 bg-primary/40 p-0.5 shrink-0"
        />
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <h1 className="text-headline-sm font-headline-sm font-bold text-on-primary tracking-tight leading-none truncate">
              Seguridad Vial Catamarca
            </h1>
            <span className="hidden sm:inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-label-sm font-bold bg-secondary text-on-secondary uppercase shrink-0">
              Huillapima
            </span>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-pad-md shrink-0">
        <EstadoConexion className="text-on-primary-container" ocultarTextoEnMovil />
        <MenuCuenta
          nombreApellido={agente.nombreApellido}
          legajo={agente.legajo}
          rolLabel={ROL_LABEL[agente.rol]}
          guardiaPuesto={guardia?.puesto.nombre ?? null}
          cerrarGuardia={cerrarGuardia}
          cerrarSesion={cerrarSesion}
        />
      </div>
    </header>
  );
}
