const NOMBRE = process.env.NEXT_PUBLIC_DEVHUB_NOMBRE || "Devhub";
const URL = process.env.NEXT_PUBLIC_DEVHUB_URL || "https://www.devhub.com.ar/";

export function Footer() {
  return (
    <footer className="w-full py-pad-md text-center">
      <a
        href={URL}
        target="_blank"
        rel="noopener noreferrer"
        className="text-label-sm font-label-sm text-on-surface-variant hover:text-secondary"
      >
        Desarrollado por {NOMBRE}
      </a>
    </footer>
  );
}
