import { AppHeader } from "@/components/ui/AppHeader";
import { BottomNav } from "@/components/ui/BottomNav";
import { EsqueletoLista } from "@/components/ui/EsqueletoLista";

export default function Cargando() {
  return (
    <>
      <AppHeader />
      <main className="flex-1 max-w-2xl w-full mx-auto px-pad-lg pt-pad-xl pb-24 space-y-4">
        <EsqueletoLista filas={3} />
      </main>
      <BottomNav />
    </>
  );
}
