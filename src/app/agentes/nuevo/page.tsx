import Link from "next/link";
import { getJefeActual } from "@/lib/auth";
import { AppHeader } from "@/components/ui/AppHeader";
import { BottomNav } from "@/components/ui/BottomNav";
import { TarjetaSeccion } from "@/components/ui/Tarjeta";
import { NuevoAgenteForm } from "./NuevoAgenteForm";

export default async function NuevoAgentePage() {
  await getJefeActual();

  return (
    <>
      <AppHeader />
      <main className="w-full max-w-2xl mx-auto px-pad-lg pt-4 pb-24 space-y-4">
        <Link
          href="/agentes"
          className="flex items-center gap-1 text-secondary text-label-sm font-label-sm uppercase"
        >
          <span className="material-symbols-outlined text-[18px]">arrow_back</span>
          Volver
        </Link>
        <h1 className="text-headline-md font-headline-md text-primary">
          Alta de Agente
        </h1>
        <TarjetaSeccion icono="badge" titulo="Datos del agente">
          <NuevoAgenteForm />
        </TarjetaSeccion>
      </main>
      <BottomNav verAgentes />
    </>
  );
}
