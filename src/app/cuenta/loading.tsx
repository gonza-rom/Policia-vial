import { AppHeader } from "@/components/ui/AppHeader";
import { BottomNav } from "@/components/ui/BottomNav";
import { EsqueletoLista } from "@/components/ui/EsqueletoLista";

export default function Cargando() {
  return (
    <>
      <AppHeader />
      <main className="w-full max-w-2xl mx-auto px-pad-lg pt-4 pb-24 space-y-4">
        <EsqueletoLista filas={3} />
      </main>
      <BottomNav />
    </>
  );
}
