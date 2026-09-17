import Image from "next/image";
import { LoginForm } from "./LoginForm";

export default function LoginPage() {
  return (
    <main className="flex-1 flex flex-col items-center justify-center bg-background px-pad-lg py-pad-2xl">
      <div className="w-full max-w-md space-y-4">
        <div className="flex items-center justify-between text-body-sm font-label-sm text-on-surface-variant">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500" aria-hidden />
            Sincronización Activa
          </span>
          <span className="flex items-center gap-1">
            <span className="material-symbols-outlined text-[18px]">wifi</span>
            SRV Catamarca-01
          </span>
        </div>

        <div className="bg-primary-container rounded-xl p-pad-xl flex flex-col items-center text-center gap-3 shadow-md">
          <Image
            src="/escudo-policia-catamarca.png"
            alt="Escudo Dirección de Seguridad Vial - Policía de Catamarca"
            width={88}
            height={88}
            className="rounded-lg border border-outline-variant/40 bg-primary/40 p-1"
          />
          <span className="inline-flex items-center px-2 py-1 rounded text-[10px] font-label-sm font-bold bg-secondary text-on-secondary uppercase">
            Puesto Caminero / Fiscalización
          </span>
          <h1 className="text-headline-lg font-headline-lg text-on-primary">
            Dirección de Seguridad Vial
          </h1>
          <p className="text-body-md text-primary-fixed-dim">Policía de Catamarca</p>
        </div>

        <div className="bg-surface-container-lowest rounded-xl border border-outline-variant shadow-sm p-pad-xl space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-headline-sm font-headline-sm text-primary">
              <span className="material-symbols-outlined text-secondary">badge</span>
              Acceso a Guardia
            </h2>
            <span className="text-label-sm font-label-sm text-on-surface-variant bg-surface-container px-2 py-0.5 rounded">
              Ord. N° 385/12
            </span>
          </div>

          <LoginForm />
        </div>

        <div className="bg-surface-container p-pad-md rounded border border-outline-variant text-body-sm text-on-surface-variant flex gap-2">
          <span className="material-symbols-outlined text-secondary shrink-0">
            verified_user
          </span>
          <p>
            Sistema oficial de fiscalización y actas. Leyes Nacionales 24.449 y
            26.363 · Adhesión Municipal Ord. 385/12. Uso restringido y exclusivo
            para agentes de la Policía de Catamarca e Inspectores de Tránsito en
            servicio activo.
          </p>
        </div>

        <p className="text-center text-label-sm font-label-sm text-outline">
          Versión Táctica 1.0 · Huillapima · Catamarca
        </p>
      </div>
    </main>
  );
}
