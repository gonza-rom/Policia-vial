export function CampoArchivo({
  label,
  id,
  name,
}: {
  label: string;
  id: string;
  name: string;
}) {
  return (
    <div>
      <label
        htmlFor={id}
        className="block text-label-sm font-label-sm text-on-surface-variant uppercase mb-1"
      >
        {label}
      </label>
      <label
        htmlFor={id}
        className="flex items-center justify-center gap-1.5 min-h-touch-min border border-dashed border-outline rounded bg-surface-container-low text-label-sm font-label-sm text-on-surface-variant cursor-pointer hover:bg-surface-container px-2 text-center"
      >
        <span className="material-symbols-outlined text-[18px]">
          photo_camera
        </span>
        Adjuntar
      </label>
      <input
        id={id}
        name={name}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
      />
    </div>
  );
}
