import Link from "next/link";
import { getAgenteActual, getGuardiaActiva } from "@/lib/auth";
import { AppHeader } from "@/components/ui/AppHeader";
import { Boton } from "@/components/ui/Boton";
import { ROL_LABEL } from "@/lib/formato";
import { cerrarSesion } from "../guardia/actions";

function iniciales(nombreApellido: string) {
  const partes = nombreApellido.trim().split(/\s+/);
  const letras = partes.slice(0, 2).map((p) => p[0]?.toUpperCase() ?? "");
  return letras.join("") || "PV";
}

/** Pantalla de cuenta — se llega acá tocando el avatar del header, desde
 * cualquier parte de la app. Antes "Cerrar sesión" solo existía al fondo
 * de /guardia; para alguien que no usa muchas apps, eso es difícil de
 * encontrar si está en otra pantalla. El avatar tocable es un patrón que
 * ya conocen de otras apps (WhatsApp, Gmail, etc.). */
export default async function CuentaPage() {
  const agente = await getAgenteActual();
  const guardia = await getGuardiaActiva(agente.id);

  return (
    <>
      <AppHeader nombreApellido={agente.nombreApellido} legajo={agente.legajo} />
      <main className="w-full max-w-2xl mx-auto px-pad-lg pt-4 pb-10 space-y-4">
        <Link
          href="/guardia"
          className="min-h-touch-min flex items-center gap-1 text-secondary text-label-sm font-label-sm uppercase"
        >
          <span className="material-symbols-outlined text-[18px]">arrow_back</span>
          Volver al Menú
        </Link>

        <div className="bg-surface-container-lowest rounded-xl border border-outline-variant shadow-sm p-pad-xl text-center space-y-2">
          <div className="w-20 h-20 mx-auto rounded-full bg-secondary text-on-secondary font-display text-headline-lg flex items-center justify-center font-bold ring-4 ring-secondary-container/40">
            {iniciales(agente.nombreApellido)}
          </div>
          <h1 className="text-headline-md font-headline-md text-primary">
            {agente.grado ? `${agente.grado} ` : ""}
            {agente.nombreApellido}
          </h1>
          <p className="text-body-md text-on-surface-variant">Legajo {agente.legajo}</p>
          <span className="inline-flex items-center px-2 py-1 rounded text-label-sm font-label-sm bg-secondary-fixed text-primary uppercase font-bold">
            {ROL_LABEL[agente.rol]}
          </span>
        </div>

        {guardia && (
          <div className="bg-surface-container-lowest rounded-xl border border-outline-variant shadow-sm p-pad-lg flex items-center gap-3">
            <span className="material-symbols-outlined text-secondary text-[28px]">
              location_on
            </span>
            <div>
              <p className="text-label-sm font-label-sm text-on-surface-variant uppercase">
                Guardia activa en
              </p>
              <p className="text-body-lg font-bold text-on-surface">
                {guardia.puesto.nombre}
              </p>
            </div>
          </div>
        )}

        <form action={cerrarSesion} className="pt-4">
          <Boton
            type="submit"
            variante="outline"
            fullWidth
            icono="logout"
            className="text-error border-error"
          >
            Cerrar Sesión
          </Boton>
          <p className="text-body-sm text-on-surface-variant text-center mt-2">
            Vas a tener que volver a ingresar tu legajo y contraseña.
          </p>
        </form>
      </main>
    </>
  );
}
